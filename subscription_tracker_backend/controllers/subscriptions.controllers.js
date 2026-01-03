/**
 * =============================================================================
 * SUBSCRIPTIONS.CONTROLLERS.JS - Subscription Business Logic
 * =============================================================================
 *
 * This file contains the "controller" functions for subscription operations.
 *
 * WHAT IS A CONTROLLER?
 * Controllers contain the business logic for handling requests.
 * They sit between routes (which define URLs) and models (which define data).
 *
 * CONTROLLER RESPONSIBILITIES:
 * 1. Validate the incoming request
 * 2. Call the appropriate model methods (database operations)
 * 3. Handle errors appropriately
 * 4. Send the response back to the client
 *
 * REQUEST-RESPONSE FLOW:
 * Client Request → Route → Controller → Model → Database
 *                                    ↓
 * Client Response ← Route ← Controller ← Model ← Database
 *
 * CONTROLLER FUNCTION SIGNATURE:
 * async (req, res, next) => { ... }
 * - req: Request object (contains body, params, query, user, etc.)
 * - res: Response object (used to send data back to client)
 * - next: Function to pass control to next middleware (for error handling)
 *
 * =============================================================================
 */

import Subscription from "../models/subscriptions.models.js";
import { scheduleReminderWorkflow } from "./workflow.controllers.js";

/**
 * CREATE SUBSCRIPTION
 *
 * Creates a new subscription for the authenticated user.
 * Also schedules email reminders for the subscription.
 *
 * HTTP: POST /api/v1/subscriptions
 *
 * REQUEST BODY:
 * {
 *   "name": "Netflix",
 *   "price": 15.99,
 *   "currency": "USD",
 *   "frequency": "monthly",
 *   "catagory": "entertainment",
 *   "payementMethod": "credit_card",
 *   "startDate": "2025-01-01",
 *   "renewalDate": "2025-02-01"
 * }
 *
 * RESPONSE: 201 Created
 * { "success": true, "data": { subscription object } }
 */
export const createSubscription = async (req, res, next) => {
  try {
    // Debug logging - helpful during development
    console.log("Request body:", req.body);
    console.log("User from auth:", req.user);

    // STEP 1: Verify user is authenticated
    // req.user is set by the auth middleware after verifying JWT token
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // STEP 2: Create the subscription in database
    // We use spread operator (...req.body) to copy all fields from request
    // Then we add/override the user field with the authenticated user's ID
    const subscription = await Subscription.create({
      ...req.body, // Copy all fields from request body
      user: req.user._id, // Associate subscription with the logged-in user
    });

    // STEP 3: Schedule email reminder workflow
    // This triggers the Upstash workflow to send reminders before renewal
    // We wrap in try-catch because we don't want to fail subscription creation
    // if the workflow scheduling fails (it can be retried later)
    try {
      await scheduleReminderWorkflow(subscription._id);
      console.log(
        `Reminder workflow scheduled for subscription ${subscription._id}`
      );
    } catch (workflowError) {
      // Log the error but DON'T fail the request
      // The subscription is still created successfully
      console.error(
        "Failed to schedule reminder workflow:",
        workflowError.message
      );
    }

    // STEP 4: Send success response
    // HTTP 201 = "Created" - used when a new resource is created
    res.status(201).json({
      success: true,
      data: subscription,
    });
  } catch (error) {
    // Error handling: Log and send error response
    console.error("Create Subscription Error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      error: error.message || "Failed to create subscription",
    });
  }
};

/**
 * GET USER SUBSCRIPTIONS
 *
 * Retrieves all subscriptions for a specific user.
 * Users can only access their own subscriptions (authorization check).
 *
 * HTTP: GET /api/v1/subscriptions/user/:userId
 *
 * URL PARAMS:
 * - userId: The ID of the user whose subscriptions to fetch
 *
 * RESPONSE: 200 OK
 * { "success": true, "data": [ array of subscriptions ] }
 *
 * SECURITY: User can only access their own subscriptions
 */
export const getUserSubscriptions = async (req, res, next) => {
  try {
    // AUTHORIZATION CHECK: Ensure user is only accessing their own data
    // This prevents User A from viewing User B's subscriptions
    // req.params.userId comes from the URL (/user/:userId)
    // req.user._id comes from the JWT token (set by auth middleware)
    if (req.user._id.toString() !== req.params.userId) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You can only access your own subscriptions",
      });
    }

    // Verify user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Query database for all subscriptions belonging to this user
    // Mongoose find() returns an array of matching documents
    const subscriptions = await Subscription.find({ user: req.user._id });

    // Send success response with the subscriptions
    res.status(200).json({
      success: true,
      data: subscriptions,
    });
  } catch (error) {
    console.error("Get User Subscriptions Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to get subscriptions",
    });
  }
};

/**
 * DELETE SUBSCRIPTION
 *
 * Deletes a subscription by ID.
 * Users can only delete their own subscriptions (authorization check).
 *
 * HTTP: DELETE /api/v1/subscriptions/:subscriptionId
 *
 * URL PARAMS:
 * - subscriptionId: The ID of the subscription to delete
 *
 * RESPONSE: 200 OK
 * { "success": true, "message": "Subscription deleted successfully" }
 *
 * SECURITY: User can only delete their own subscriptions
 */
export const deleteSubscription = async (req, res, next) => {
  try {
    const { subscriptionId } = req.params;

    // Verify user is authenticated
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        error: "User not authenticated",
      });
    }

    // Find the subscription first to check ownership
    const subscription = await Subscription.findById(subscriptionId);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        error: "Subscription not found",
      });
    }

    // AUTHORIZATION CHECK: Ensure user owns this subscription
    if (subscription.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You can only delete your own subscriptions",
      });
    }

    // Delete the subscription
    await Subscription.findByIdAndDelete(subscriptionId);

    res.status(200).json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error) {
    console.error("Delete Subscription Error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to delete subscription",
    });
  }
};
