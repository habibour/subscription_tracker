/**
 * =============================================================================
 * WORKFLOW.CONTROLLERS.JS - Email Reminder Workflow Logic
 * =============================================================================
 *
 * This file contains the business logic for sending subscription renewal
 * reminder emails using Upstash Workflows.
 *
 * WHAT IS A WORKFLOW?
 * A workflow is a series of steps that can be executed reliably over time.
 * Unlike regular code, workflows can:
 * - "Sleep" for days/weeks and resume automatically
 * - Retry failed steps automatically
 * - Survive server restarts
 *
 * WHY USE UPSTASH WORKFLOWS FOR REMINDERS?
 * Imagine you want to send emails 7 days, 3 days, and 1 day before renewal.
 *
 * BAD APPROACH (without workflow):
 * - Set up a cron job to check every day
 * - Store reminder states in database
 * - Handle server restarts, failures, etc.
 * - Complex and error-prone!
 *
 * GOOD APPROACH (with Upstash Workflow):
 * - Trigger once when subscription is created
 * - Workflow sleeps until 7 days before renewal
 * - Sends email, sleeps until 3 days, sends email, etc.
 * - Upstash handles all the scheduling and retries!
 *
 * HOW THE REMINDER FLOW WORKS:
 * 1. User creates subscription (e.g., Netflix, renews Feb 1)
 * 2. scheduleReminderWorkflow() triggers Upstash
 * 3. Upstash calls sendReminders endpoint
 * 4. If renewal > 7 days away: workflow sleeps until 7 days before
 * 5. At 7 days: send email, sleep until 3 days before
 * 6. At 3 days: send email, sleep until 1 day before
 * 7. At 1 day: send final email
 *
 * =============================================================================
 */

import { createRequire } from "module";
import Subscription from "../models/subscriptions.models.js";
import dayjs from "dayjs"; // Library for easy date manipulation
import { sendRenewalReminder } from "../utils/sendEmail.js";
import { upstashWorkflowClient } from "../config/upstash.js";
import { SERVER_URL } from "../config/env.js";

/**
 * createRequire is needed because @upstash/workflow uses CommonJS
 * while our project uses ES Modules (import/export)
 * This is a workaround to use require() in ES Modules
 */
const require = createRequire(import.meta.url);
const { serve } = require("@upstash/workflow/express");

/**
 * REMINDER_DAYS defines when to send reminders before renewal
 * - 7 days before: First reminder
 * - 3 days before: Second reminder
 * - 1 day before: Final reminder
 */
const REMINDER_DAYS = [7, 3, 1];

/**
 * =============================================================================
 * SEND REMINDERS - Main Upstash Workflow Handler
 * =============================================================================
 *
 * This is the main workflow function that Upstash calls.
 * It's wrapped in serve() which handles Upstash's special requirements.
 *
 * IMPORTANT CONCEPTS:
 *
 * 1. context.run("step-name", async () => { ... })
 *    - Executes a "step" in the workflow
 *    - If step fails, Upstash retries it automatically
 *    - Results are cached, so re-running workflow skips completed steps
 *
 * 2. context.sleep("sleep-name", seconds)
 *    - Pauses the workflow for specified seconds
 *    - Workflow state is saved, server can restart during sleep
 *    - Upstash wakes up workflow when sleep ends
 *
 * 3. context.requestPayload
 *    - Contains the data sent when triggering the workflow
 *    - In our case: { subscriptionId: "..." }
 */
export const sendReminders = serve(async (context) => {
  // Get the subscription ID from the workflow trigger payload
  const { subscriptionId } = context.requestPayload;

  // STEP 1: Fetch the subscription from database
  // Using context.run() makes this step retryable
  const subscription = await fetchSubscriptionById(context, subscriptionId);

  // Validation checks - exit early if subscription is invalid
  if (!subscription) {
    console.log(`Subscription ${subscriptionId} not found. Skipping reminder.`);
    return { success: false, message: "Subscription not found" };
  }

  if (subscription.status !== "active") {
    console.log(
      `Subscription ${subscriptionId} is not active. Skipping reminder.`
    );
    return { success: false, message: "Subscription is not active" };
  }

  // Calculate days until renewal using dayjs library
  const renewalDate = dayjs(subscription.renewalDate);
  const today = dayjs();

  if (renewalDate.isBefore(today)) {
    console.log(
      `Subscription ${subscriptionId} renewal date has passed. Skipping reminder.`
    );
    return { success: false, message: "Renewal date has passed" };
  }

  const daysUntilRenewal = renewalDate.diff(today, "day");

  // SCENARIO A: Renewal is within 7 days - send reminder immediately
  if (daysUntilRenewal <= REMINDER_DAYS[0]) {
    // STEP 2: Send the first reminder email
    // context.run() wraps this in a retryable step
    await context.run("send-reminder-email", async () => {
      await sendRenewalReminder({
        email: subscription.user.email,
        username: subscription.user.username,
        subscriptionName: subscription.name,
        renewalDate: subscription.renewalDate,
        price: subscription.price,
        currency: subscription.currency,
        daysUntilRenewal,
      });
    });

    console.log(
      `Reminder sent for subscription ${subscriptionId}. Renewal in ${daysUntilRenewal} days.`
    );

    // STEP 3: Schedule next reminder if needed
    if (daysUntilRenewal > 1) {
      // Find next reminder day (e.g., if 5 days left, next reminder is at 3 days)
      const nextReminderDay = REMINDER_DAYS.find(
        (day) => day < daysUntilRenewal
      );

      if (nextReminderDay) {
        const daysToWait = daysUntilRenewal - nextReminderDay;

        // STEP 4: Sleep until next reminder
        // This is the magic! Workflow pauses for days, then resumes
        await context.sleep(
          "wait-for-next-reminder",
          daysToWait * 24 * 60 * 60 // Convert days to seconds
        );

        // STEP 5: Send next reminder after waking up
        await context.run("send-next-reminder-email", async () => {
          await sendRenewalReminder({
            email: subscription.user.email,
            username: subscription.user.username,
            subscriptionName: subscription.name,
            renewalDate: subscription.renewalDate,
            price: subscription.price,
            currency: subscription.currency,
            daysUntilRenewal: nextReminderDay,
          });
        });
      }
    }

    return {
      success: true,
      message: `Reminder sent for subscription ${subscriptionId}`,
      daysUntilRenewal,
    };
  } else {
    // SCENARIO B: Renewal is more than 7 days away
    // Sleep until we're within the reminder window

    const daysToWait = daysUntilRenewal - REMINDER_DAYS[0];

    // Sleep until 7 days before renewal
    await context.sleep(
      "wait-until-reminder-window",
      daysToWait * 24 * 60 * 60
    );

    // After waking up, re-fetch subscription to check if still active
    // (User might have cancelled during the sleep period)
    const updatedSubscription = await context.run(
      "re-fetch-subscription",
      () => {
        return Subscription.findById(subscriptionId).populate(
          "user",
          "email username"
        );
      }
    );

    // Only send if subscription is still active
    if (updatedSubscription && updatedSubscription.status === "active") {
      await context.run("send-first-reminder-email", async () => {
        await sendRenewalReminder({
          email: updatedSubscription.user.email,
          username: updatedSubscription.user.username,
          subscriptionName: updatedSubscription.name,
          renewalDate: updatedSubscription.renewalDate,
          price: updatedSubscription.price,
          currency: updatedSubscription.currency,
          daysUntilRenewal: REMINDER_DAYS[0],
        });
      });
    }

    return {
      success: true,
      message: `Reminder scheduled for subscription ${subscriptionId}`,
      scheduledIn: `${daysToWait} days`,
    };
  }
});

/**
 * Helper function to fetch subscription with user details
 * Wrapped in context.run() for retry capability
 *
 * .populate("user", "email username") is a Mongoose feature that:
 * - Replaces the user ID with the actual user document
 * - Only includes email and username fields (not password, etc.)
 */
async function fetchSubscriptionById(context, subscriptionId) {
  return await context.run("get-subscription", () => {
    return Subscription.findById(subscriptionId).populate(
      "user",
      "email username"
    );
  });
}

/**
 * =============================================================================
 * SCHEDULE REMINDER WORKFLOW
 * =============================================================================
 *
 * Triggers a new Upstash workflow for a subscription.
 * Called when a subscription is created or needs reminder scheduling.
 *
 * This is like saying: "Hey Upstash, please handle reminders for this subscription"
 * Upstash will then call our /send-reminders endpoint to do the actual work.
 */
export const scheduleReminderWorkflow = async (subscriptionId) => {
  try {
    // The URL that Upstash will call back
    const workflowUrl = `${SERVER_URL}/api/v1/workflow/send-reminders`;

    // Trigger the workflow with subscription ID as payload
    await upstashWorkflowClient.trigger({
      url: workflowUrl,
      body: { subscriptionId: subscriptionId.toString() },
    });

    console.log(`Workflow triggered for subscription ${subscriptionId}`);
    return { success: true, message: "Reminder workflow scheduled" };
  } catch (error) {
    console.error(
      `Failed to trigger workflow for subscription ${subscriptionId}:`,
      error
    );
    throw error;
  }
};

/**
 * =============================================================================
 * PROCESS ALL SUBSCRIPTION REMINDERS
 * =============================================================================
 *
 * Finds all subscriptions that need reminders and triggers workflows for them.
 *
 * USE CASE: Daily cron job to ensure no reminders are missed
 *
 * Example: Run this every day at midnight to catch any subscriptions
 * where automatic scheduling might have failed.
 */
export const processAllSubscriptionReminders = async (req, res, next) => {
  try {
    const today = dayjs();
    const reminderWindowEnd = today.add(REMINDER_DAYS[0], "day");

    // MongoDB query: Find active subscriptions renewing in next 7 days
    // $gte = greater than or equal, $lte = less than or equal
    const subscriptions = await Subscription.find({
      status: "active",
      renewalDate: {
        $gte: today.toDate(), // Renewal date >= today
        $lte: reminderWindowEnd.toDate(), // Renewal date <= 7 days from now
      },
    });

    console.log(
      `Found ${subscriptions.length} subscriptions needing reminders`
    );

    // Trigger workflow for each subscription
    const results = [];
    for (const subscription of subscriptions) {
      try {
        await scheduleReminderWorkflow(subscription._id);
        results.push({
          subscriptionId: subscription._id,
          status: "scheduled",
        });
      } catch (error) {
        results.push({
          subscriptionId: subscription._id,
          status: "failed",
          error: error.message,
        });
      }
    }

    res.status(200).json({
      success: true,
      message: `Processed ${subscriptions.length} subscriptions`,
      results,
    });
  } catch (error) {
    console.error("Error processing subscription reminders:", error);
    next(error);
  }
};

/**
 * =============================================================================
 * TRIGGER REMINDER MANUALLY
 * =============================================================================
 *
 * Manually trigger a reminder workflow for a specific subscription.
 * Useful for testing or re-triggering failed reminders.
 */
export const triggerReminderManually = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params; // Get ID from URL: /trigger/:subscriptionId

    if (!subscriptionId) {
      return res.status(400).json({
        success: false,
        error: "Subscription ID is required",
      });
    }

    // Verify subscription exists before triggering
    const subscription = await Subscription.findById(subscriptionId).populate(
      "user",
      "email username"
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    // Trigger the workflow
    await scheduleReminderWorkflow(subscriptionId);

    res.status(200).json({
      success: true,
      message: `Reminder workflow triggered for subscription ${subscriptionId}`,
      subscription: {
        name: subscription.name,
        renewalDate: subscription.renewalDate,
        userEmail: subscription.user.email,
      },
    });
  } catch (error) {
    console.error("Error triggering reminder:", error);
    next(error);
  }
};

/**
 * =============================================================================
 * SEND TEST REMINDER
 * =============================================================================
 *
 * Send an immediate test email for a specific subscription.
 * Bypasses the workflow - sends email directly.
 *
 * USE CASE: Testing that emails look correct for a specific subscription
 */
export const sendTestReminder = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    const subscription = await Subscription.findById(subscriptionId).populate(
      "user",
      "email username"
    );

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    const renewalDate = dayjs(subscription.renewalDate);
    const today = dayjs();
    const daysUntilRenewal = renewalDate.diff(today, "day");

    // Send email directly (not through workflow)
    await sendRenewalReminder({
      email: subscription.user.email,
      username: subscription.user.username,
      subscriptionName: subscription.name,
      renewalDate: subscription.renewalDate,
      price: subscription.price,
      currency: subscription.currency,
      daysUntilRenewal: Math.max(daysUntilRenewal, 1), // Minimum 1 day
    });

    res.status(200).json({
      success: true,
      message: `Test reminder email sent to ${subscription.user.email}`,
    });
  } catch (error) {
    console.error("Error sending test reminder:", error);
    next(error);
  }
};

/**
 * =============================================================================
 * SEND DIRECT TEST EMAIL
 * =============================================================================
 *
 * Send a test email to ANY email address (doesn't need a real subscription).
 *
 * USE CASE: Testing email configuration is working correctly
 * Just provide an email address and it sends a sample reminder.
 */
export const sendDirectTestEmail = async (req, res, next) => {
  try {
    const { email } = req.body; // Get email from request body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: "Email address is required",
      });
    }

    // Send a sample reminder with fake subscription data
    await sendRenewalReminder({
      email: email,
      username: "Test User",
      subscriptionName: "Netflix Premium",
      renewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
      price: 15.99,
      currency: "USD",
      daysUntilRenewal: 3,
    });

    res.status(200).json({
      success: true,
      message: `Test reminder email sent to ${email}`,
    });
  } catch (error) {
    console.error("Error sending direct test email:", error);
    next(error);
  }
};
