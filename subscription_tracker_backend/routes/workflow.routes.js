/**
 * =============================================================================
 * WORKFLOW.ROUTES.JS - Email Reminder Workflow Routes
 * =============================================================================
 *
 * This file defines the URL endpoints for the email reminder system.
 *
 * WHAT ARE ROUTES?
 * Routes define the URLs that clients can access and which functions handle them.
 * Think of them as the "menu" of what your API can do.
 *
 * ROUTE STRUCTURE:
 * router.{method}(path, [middleware], handler)
 * - method: HTTP method (GET, POST, PUT, DELETE)
 * - path: URL path (e.g., "/send-reminders")
 * - middleware: Optional functions that run before the handler (e.g., auth check)
 * - handler: The controller function that processes the request
 *
 * WHY SEPARATE ROUTES FROM CONTROLLERS?
 * - Routes: Define WHAT URLs exist and WHAT middleware to apply
 * - Controllers: Define HOW to handle the request (business logic)
 * - This separation makes code more organized and testable
 *
 * =============================================================================
 */

import { Router } from "express";
import {
  sendReminders,
  processAllSubscriptionReminders,
  triggerReminderManually,
  sendTestReminder,
  sendDirectTestEmail,
} from "../controllers/workflow.controllers.js";
import authorize from "../middlewares/auth.middlewares.js";

// Create a new router instance
const workflowRouter = Router();

/**
 * =============================================================================
 * ROUTE DEFINITIONS
 * =============================================================================
 */

/**
 * POST /api/v1/workflow/send-reminders
 *
 * PURPOSE: Upstash Workflow callback endpoint
 *
 * WHO CALLS THIS: Upstash (not users directly)
 * When you trigger a workflow, Upstash calls this endpoint to execute the work.
 *
 * HOW IT WORKS:
 * 1. Upstash sends POST request with { subscriptionId: "..." }
 * 2. sendReminders handler fetches the subscription
 * 3. If renewal is soon, it sends an email
 * 4. It can "sleep" for days and Upstash will call back later
 *
 * NO AUTH REQUIRED: Upstash has its own authentication via signing keys
 */
workflowRouter.post("/send-reminders", sendReminders);

/**
 * GET /api/v1/workflow/process-reminders
 *
 * PURPOSE: Find all subscriptions needing reminders and trigger workflows
 *
 * USE CASE: Run this as a daily cron job to catch any subscriptions
 * that need reminders (in case auto-scheduling failed).
 *
 * EXAMPLE: Set up a cron job to call this URL every day at midnight
 */
workflowRouter.get("/process-reminders", processAllSubscriptionReminders);

/**
 * POST /api/v1/workflow/trigger/:subscriptionId
 *
 * PURPOSE: Manually trigger a reminder workflow for a specific subscription
 *
 * USE CASE: Admin wants to manually schedule reminders for a subscription
 *
 * PROTECTED: Requires authentication (authorize middleware)
 * Only logged-in users can access this endpoint
 */
workflowRouter.post(
  "/trigger/:subscriptionId",
  authorize, // ← Middleware: Check if user is logged in
  triggerReminderManually // ← Handler: Process the request
);

/**
 * POST /api/v1/workflow/test-email/:subscriptionId
 *
 * PURPOSE: Send an immediate test email for a subscription
 *
 * USE CASE: Testing that emails work correctly for a specific subscription
 *
 * PROTECTED: Requires authentication
 */
workflowRouter.post("/test-email/:subscriptionId", authorize, sendTestReminder);

/**
 * POST /api/v1/workflow/send-direct-email
 *
 * PURPOSE: Send a test email to any email address
 *
 * USE CASE: Testing email configuration without needing a real subscription
 *
 * BODY: { "email": "test@example.com" }
 *
 * NOT PROTECTED: For easy testing (consider adding auth in production!)
 */
workflowRouter.post("/send-direct-email", sendDirectTestEmail);

/**
 * GET /api/v1/workflow/
 *
 * PURPOSE: Health check and API documentation
 *
 * USE CASE: Quickly see if the workflow service is running
 * and what endpoints are available.
 */
workflowRouter.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Workflow service is running",
    endpoints: {
      "POST /send-reminders": "Upstash workflow endpoint",
      "GET /process-reminders": "Process all subscription reminders",
      "POST /trigger/:subscriptionId":
        "Trigger reminder for specific subscription",
      "POST /test-email/:subscriptionId": "Send test reminder email",
      "POST /send-direct-email": "Send test email to any address",
    },
  });
});

export default workflowRouter;
