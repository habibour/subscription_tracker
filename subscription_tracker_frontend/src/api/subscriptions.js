/**
 * =============================================================================
 * SUBSCRIPTIONS.JS - Subscription API Functions
 * =============================================================================
 *
 * This file contains functions to communicate with the subscription endpoints
 * on our backend server.
 *
 * It imports the pre-configured Axios instance from auth.js, which means:
 * - All requests automatically include the JWT token (if logged in)
 * - All requests go to the correct base URL
 * - All responses/errors are intercepted
 *
 * CRUD OPERATIONS:
 * ================
 * C - Create  → POST   /subscriptions        → Add new subscription
 * R - Read    → GET    /subscriptions/user/  → Get all subscriptions
 * U - Update  → PUT    /subscriptions/:id    → Update a subscription
 * D - Delete  → DELETE /subscriptions/:id    → Remove a subscription
 *
 * =============================================================================
 */

// Import the configured Axios instance from auth.js
// This instance already has the base URL and auth token interceptor
import api from "./auth";

/**
 * Subscriptions API - Functions to interact with subscription endpoints
 *
 * These functions correspond to the routes in subscription.routes.js:
 * - GET    /api/v1/subscriptions/user/:userId → getUserSubscriptions
 * - POST   /api/v1/subscriptions              → createSubscription
 * - PUT    /api/v1/subscriptions/:id          → updateSubscription
 * - DELETE /api/v1/subscriptions/:id          → deleteSubscription
 */
export const subscriptionsAPI = {
  /**
   * Get All Subscriptions for a User
   *
   * @param {string} userId - The ID of the logged-in user
   * @returns {Object} - { success: true, data: [array of subscriptions] }
   *
   * FLOW:
   * 1. Frontend: subscriptionsAPI.getAll("6951ee487bdaa33aeb3c624d")
   * 2. Request:  GET http://localhost:5500/api/v1/subscriptions/user/6951ee487bdaa33aeb3c624d
   *              Headers: { Authorization: "Bearer eyJ..." }
   * 3. Backend:  auth.middleware checks token → controller queries MongoDB
   * 4. Response: { success: true, data: [{ name: "Netflix", price: 15.99, ... }, ...] }
   *
   * WHY userId IN URL?
   * The backend uses this to:
   * 1. Know which user's subscriptions to fetch
   * 2. Verify the logged-in user matches the requested userId (security)
   */
  getAll: async (userId) => {
    const response = await api.get(`/subscriptions/user/${userId}`);
    return response.data;
  },

  /**
   * Create a New Subscription
   *
   * @param {Object} subscriptionData - The subscription details
   * @returns {Object} - { success: true, data: { created subscription } }
   *
   * subscriptionData example:
   * {
   *   name: "Netflix",
   *   price: 15.99,
   *   currency: "USD",
   *   frequency: "monthly",
   *   catagory: "entertainment",
   *   payementMethod: "credit_card",
   *   startDate: "2026-01-01",
   *   renewalDate: "2026-02-01"
   * }
   *
   * FLOW:
   * 1. Frontend: subscriptionsAPI.create({ name: "Netflix", price: 15.99, ... })
   * 2. Request:  POST http://localhost:5500/api/v1/subscriptions
   *              Headers: { Authorization: "Bearer eyJ...", Content-Type: "application/json" }
   *              Body: { name: "Netflix", price: 15.99, ... }
   * 3. Backend:  Validates data → Saves to MongoDB → Schedules email reminders
   * 4. Response: { success: true, data: { _id: "...", name: "Netflix", ... } }
   *
   * NOTE: The user ID is NOT sent in the body!
   * The backend extracts it from the JWT token (req.user._id)
   */
  create: async (subscriptionData) => {
    const response = await api.post("/subscriptions", subscriptionData);
    return response.data;
  },

  /**
   * Update an Existing Subscription
   *
   * @param {string} subscriptionId - The MongoDB _id of the subscription
   * @param {Object} subscriptionData - The updated fields
   * @returns {Object} - { success: true, data: { updated subscription } }
   *
   * FLOW:
   * 1. Frontend: subscriptionsAPI.update("abc123", { price: 19.99 })
   * 2. Request:  PUT http://localhost:5500/api/v1/subscriptions/abc123
   *              Body: { price: 19.99 }
   * 3. Backend:  Finds subscription → Verifies ownership → Updates in MongoDB
   * 4. Response: { success: true, data: { ...updated subscription } }
   */
  update: async (subscriptionId, subscriptionData) => {
    const response = await api.put(
      `/subscriptions/${subscriptionId}`,
      subscriptionData
    );
    return response.data;
  },

  /**
   * Delete a Subscription
   *
   * @param {string} subscriptionId - The MongoDB _id of the subscription to delete
   * @returns {Object} - { success: true, message: "Subscription deleted successfully" }
   *
   * FLOW:
   * 1. Frontend: subscriptionsAPI.delete("abc123")
   * 2. Request:  DELETE http://localhost:5500/api/v1/subscriptions/abc123
   *              Headers: { Authorization: "Bearer eyJ..." }
   * 3. Backend:  Finds subscription → Verifies ownership → Deletes from MongoDB
   * 4. Response: { success: true, message: "Subscription deleted successfully" }
   *
   * SECURITY:
   * The backend checks that the logged-in user owns this subscription
   * before deleting. User A cannot delete User B's subscriptions.
   */
  delete: async (subscriptionId) => {
    const response = await api.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  },
};

export default subscriptionsAPI;
