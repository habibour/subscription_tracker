/**
 * =============================================================================
 * AUTH.JS - API Configuration & Authentication
 * =============================================================================
 *
 * This file sets up the connection between our React frontend and Express backend.
 * It uses Axios, a popular HTTP client library for making API requests.
 *
 * HOW FRONTEND-BACKEND COMMUNICATION WORKS:
 * =========================================
 *
 * 1. Frontend (React) sends HTTP requests to Backend (Express)
 * 2. Backend processes the request and returns a response
 * 3. Frontend receives the response and updates the UI
 *
 *    React App                         Express Server
 *    ─────────                         ──────────────
 *        │                                   │
 *        │  ──── HTTP Request ────────────▶  │
 *        │  (POST /api/v1/auth/sign-in)      │
 *        │                                   │
 *        │  ◀──── HTTP Response ──────────   │
 *        │  ({ token: "...", user: {...} })  │
 *        │                                   │
 *
 * =============================================================================
 */

// Import Axios - a promise-based HTTP client
// It makes it easy to send HTTP requests (GET, POST, PUT, DELETE)
import axios from "axios";

/**
 * API_URL - The base URL where our backend server is running
 *
 * import.meta.env.VITE_API_URL reads from the .env file (VITE_API_URL=http://localhost:5500/api/v1)
 * If not found, it falls back to the default localhost URL
 *
 * This allows us to have different URLs for:
 * - Development: http://localhost:5500/api/v1
 * - Production: https://api.yourapp.com/api/v1
 */
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5500/api/v1";

/**
 * Create an Axios instance with default configuration
 *
 * axios.create() creates a reusable HTTP client with preset settings
 * This means we don't have to repeat these settings for every request
 *
 * baseURL: All requests will be prefixed with this URL
 *          api.get("/auth/sign-in") becomes GET http://localhost:5500/api/v1/auth/sign-in
 *
 * headers: Default headers sent with every request
 *          "Content-Type": "application/json" tells the server we're sending JSON data
 */
const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

/**
 * =============================================================================
 * REQUEST INTERCEPTOR - Runs BEFORE every request is sent
 * =============================================================================
 *
 * An interceptor is like a "middleware" for HTTP requests.
 * It intercepts (catches) requests before they leave and can modify them.
 *
 * WHY WE NEED THIS:
 * After login, the backend gives us a JWT token. We need to send this token
 * with every subsequent request to prove we're authenticated.
 *
 * FLOW:
 * 1. User logs in → Backend sends JWT token → We store it in localStorage
 * 2. User makes another request (e.g., get subscriptions)
 * 3. This interceptor automatically adds the token to the request headers
 * 4. Backend receives token, verifies it, and knows who the user is
 *
 * Authorization Header Format: "Bearer <token>"
 * This is a standard format for JWT authentication
 */
api.interceptors.request.use((config) => {
  // Get the token from browser's localStorage
  const token = localStorage.getItem("token");

  // If token exists, add it to the request headers
  if (token) {
    // The backend expects: Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Return the modified config - the request will now include the token
  return config;
});

/**
 * =============================================================================
 * RESPONSE INTERCEPTOR - Runs AFTER every response is received
 * =============================================================================
 *
 * This interceptor catches responses (or errors) from the server.
 *
 * WHY WE NEED THIS:
 * If the server returns a 401 (Unauthorized) error, it means:
 * - The token expired
 * - The token is invalid
 * - The user needs to log in again
 *
 * Instead of handling this in every component, we handle it once here.
 *
 * FLOW:
 * 1. Request is sent with token
 * 2. Backend says "401 Unauthorized" (token expired/invalid)
 * 3. This interceptor catches the error
 * 4. Clears stored credentials and redirects to login page
 */
api.interceptors.response.use(
  // Success handler - just return the response as-is
  (response) => response,

  // Error handler - check if it's an auth error
  (error) => {
    // Don't redirect if we're on auth routes (sign-in, sign-up)
    // Because 401 on login just means "wrong password", not "session expired"
    const isAuthRoute = error.config?.url?.includes("/auth/");

    // If it's a 401 error and NOT on an auth route, the session expired
    if (error.response?.status === 401 && !isAuthRoute) {
      // Clear the stored credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Redirect to login page
      window.location.href = "/login";
    }

    // Re-throw the error so the component can also handle it if needed
    return Promise.reject(error);
  }
);

/**
 * =============================================================================
 * AUTH API - Functions to call authentication endpoints
 * =============================================================================
 *
 * These functions wrap the API calls for authentication.
 * They match the routes defined in the backend (auth.routes.js):
 *
 * Backend Routes:
 * - POST /api/v1/auth/sign-up  → Creates a new user account
 * - POST /api/v1/auth/sign-in  → Logs in and returns JWT token
 * - POST /api/v1/auth/sign-out → Logs out the user
 *
 * Each function:
 * 1. Makes an HTTP request using our configured Axios instance
 * 2. Returns the response data (not the full response object)
 */
export const authAPI = {
  /**
   * Sign Up - Create a new user account
   *
   * @param {Object} userData - { username, email, password }
   * @returns {Object} - { success, token, user } from backend
   *
   * WHAT HAPPENS:
   * 1. Frontend: authAPI.signUp({ username: "john", email: "john@example.com", password: "123456" })
   * 2. Request:  POST http://localhost:5500/api/v1/auth/sign-up
   *              Body: { username: "john", email: "john@example.com", password: "123456" }
   * 3. Backend:  Creates user in MongoDB, generates JWT token
   * 4. Response: { success: true, token: "eyJ...", user: { id, username, email } }
   */
  signUp: async (userData) => {
    const response = await api.post("/auth/sign-up", userData);
    return response.data;
  },

  /**
   * Sign In - Log in to existing account
   *
   * @param {Object} credentials - { email, password }
   * @returns {Object} - { message, token, user } from backend
   *
   * WHAT HAPPENS:
   * 1. Frontend: authAPI.signIn({ email: "john@example.com", password: "123456" })
   * 2. Request:  POST http://localhost:5500/api/v1/auth/sign-in
   *              Body: { email: "john@example.com", password: "123456" }
   * 3. Backend:  Finds user, compares password hash, generates JWT token
   * 4. Response: { message: "Sign in successful", token: "eyJ...", user: {...} }
   */
  signIn: async (credentials) => {
    const response = await api.post("/auth/sign-in", credentials);
    return response.data;
  },

  /**
   * Sign Out - Log out the user
   *
   * @returns {Object} - Success message from backend
   *
   * Note: The actual logout (clearing localStorage) happens in AuthContext
   * This just notifies the backend (useful for invalidating tokens server-side)
   */
  signOut: async () => {
    const response = await api.post("/auth/sign-out");
    return response.data;
  },
};

// Export the configured Axios instance for use in other API files (like subscriptions.js)
export default api;
