/**
 * =============================================================================
 * APP.JS - Main Entry Point of the Application
 * =============================================================================
 *
 * This is the main file that starts our Express.js server. Think of it as the
 * "control center" of our backend application.
 *
 * WHAT THIS FILE DOES:
 * 1. Creates an Express application instance
 * 2. Sets up middleware (functions that run before our routes)
 * 3. Defines API routes (URLs that clients can access)
 * 4. Starts the server and connects to the database
 *
 * ARCHITECTURE PATTERN: MVC (Model-View-Controller)
 * - Models: Define data structure (in /models folder)
 * - Views: Not applicable here (this is an API, no HTML views)
 * - Controllers: Handle business logic (in /controllers folder)
 * - Routes: Define URL endpoints (in /routes folder)
 *
 * =============================================================================
 */

// Import Express - the web framework for Node.js
import express from "express";

// Import CORS - Cross-Origin Resource Sharing
import cors from "cors";

// Import environment variables (PORT number, etc.)
import { PORT } from "./config/env.js";

// Import route handlers - these define what happens at each URL
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import subscriptionRouter from "./routes/subscription.routes.js";
import workflowRouter from "./routes/workflow.routes.js";

// Import database configuration
import { DB_URI, NODE_ENV } from "./config/env.js";
import connectDB from "./database/mongodb.js";

// Import middleware
import errorMiddleware from "./middlewares/error.middlewares.js";
import cookieParser from "cookie-parser";
import arcjetMiddleware from "./middlewares/arcjet.middlewares.js";

// Create the Express application
const app = express();

/**
 * =============================================================================
 * MIDDLEWARE SETUP
 * =============================================================================
 * Middleware are functions that run BEFORE your route handlers.
 * They can modify the request, response, or end the request-response cycle.
 * Order matters! They execute in the order they are defined.
 */

// Enable CORS - allows frontend to communicate with this backend
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:3000"],
    credentials: true,
  })
);

// Parse JSON bodies - allows us to read JSON data sent in requests
// Example: When client sends {"name": "Netflix"}, we can access it via req.body.name
app.use(express.json());

// Parse URL-encoded bodies - for form submissions
// Example: name=Netflix&price=15.99 becomes req.body.name and req.body.price
app.use(express.urlencoded({ extended: false }));

// Parse cookies - allows us to read cookies from requests
// Used for authentication tokens stored in cookies
app.use(cookieParser());

// Arcjet middleware - provides security features like rate limiting and bot protection
// This helps prevent abuse of our API (too many requests, malicious bots, etc.)
app.use(arcjetMiddleware);

/**
 * =============================================================================
 * ROUTE DEFINITIONS
 * =============================================================================
 * Routes define the URLs (endpoints) that clients can access.
 * Each route is handled by a specific router that contains related endpoints.
 *
 * URL Structure: /api/v1/{resource}
 * - /api: Indicates this is an API endpoint
 * - /v1: Version 1 of the API (allows future versioning)
 * - /{resource}: The specific resource being accessed
 */

// User routes - for user profile operations
// Example: GET /api/v1/users/:id - Get user by ID
app.use("/api/v1/users", userRouter);

// Auth routes - for authentication (login, register, logout)
// Example: POST /api/v1/auth/sign-up - Register new user
// Example: POST /api/v1/auth/sign-in - Login user
app.use("/api/v1/auth", authRouter);

// Subscription routes - for managing user subscriptions
// Example: POST /api/v1/subscriptions - Create new subscription
// Example: GET /api/v1/subscriptions/user/:userId - Get user's subscriptions
app.use("/api/v1/subscriptions", subscriptionRouter);

// Workflow routes - for email reminder workflows
// Example: POST /api/v1/workflow/send-reminders - Upstash workflow endpoint
// Example: POST /api/v1/workflow/send-direct-email - Send test email
app.use("/api/v1/workflow", workflowRouter);

/**
 * Error handling middleware - MUST be last!
 * This catches any errors thrown in route handlers and sends appropriate responses.
 */
app.use(errorMiddleware);

// Root endpoint - simple health check
app.get("/", (req, res) => {
  res.send("Hello, SubDub!");
});

/**
 * =============================================================================
 * START THE SERVER
 * =============================================================================
 * app.listen() starts the HTTP server on the specified port.
 * Once started, the server listens for incoming requests.
 */
app.listen(PORT, async () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
  // Connect to MongoDB database after server starts
  await connectDB();
});

// Export the app for testing purposes
export default app;
