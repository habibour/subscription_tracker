/**
 * =============================================================================
 * ENV.JS - Environment Configuration
 * =============================================================================
 *
 * This file loads and exports environment variables from .env files.
 *
 * WHY USE ENVIRONMENT VARIABLES?
 * - Security: Keep sensitive data (passwords, API keys) out of code
 * - Flexibility: Different settings for development vs production
 * - Best Practice: Never commit secrets to version control (git)
 *
 * HOW IT WORKS:
 * 1. dotenv package reads the .env file
 * 2. Variables are loaded into process.env
 * 3. We export them for use throughout the app
 *
 * FILE NAMING: .env.{environment}.local
 * - .env.development.local - for local development
 * - .env.production.local - for production server
 *
 * =============================================================================
 */

import { config } from "dotenv";

// Load environment variables from the appropriate .env file
// If NODE_ENV is not set, default to "development"
config({ path: `.env.${process.env.NODE_ENV || "development"}.local` });

/**
 * Export all environment variables as named exports.
 * This allows us to import only what we need in each file.
 *
 * Example usage: import { PORT, DB_URI } from "./config/env.js";
 */
export const {
  // Server Configuration
  PORT, // Port number the server runs on (e.g., 5500)
  NODE_ENV, // Environment: "development" or "production"

  // Database Configuration
  DB_URI, // MongoDB connection string

  // JWT (JSON Web Token) Configuration - for user authentication
  JWT_SECRET, // Secret key to sign/verify tokens (keep this SECRET!)
  JWT_EXPIRES_IN, // How long tokens are valid (e.g., "7d" = 7 days)

  // Arcjet Configuration - for API security (rate limiting, bot protection)
  ARCJET_KEY, // Arcjet API key
  ARCJET_ENV, // Arcjet environment

  // Upstash QStash Configuration - for background job scheduling
  QSTASH_URL, // QStash API URL
  QSTASH_TOKEN, // QStash authentication token
  QSTASH_CURRENT_SIGNING_KEY, // For verifying webhook signatures
  QSTASH_NEXT_SIGNING_KEY, // Rotating signing key

  // Email Configuration - for sending notification emails
  EMAIL_HOST, // SMTP server hostname (e.g., "smtp.gmail.com")
  EMAIL_PORT, // SMTP port (587 for TLS, 465 for SSL)
  EMAIL_USER, // Email account username
  EMAIL_PASSWORD, // Email account password or App Password
  EMAIL_FROM, // "From" address shown in emails

  // Server URL - used for webhook callbacks
  SERVER_URL, // Full URL of the server (e.g., "http://localhost:5500")
} = process.env;
