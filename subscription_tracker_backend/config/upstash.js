/**
 * =============================================================================
 * UPSTASH.JS - Upstash Workflow Client Configuration
 * =============================================================================
 *
 * WHAT IS UPSTASH?
 * Upstash is a serverless platform that provides:
 * - QStash: Message queue for scheduling background jobs
 * - Workflow: Durable workflow execution (retries, delays, etc.)
 *
 * WHY USE UPSTASH FOR EMAIL REMINDERS?
 * 1. Reliability: If email fails, it automatically retries
 * 2. Scheduling: Can schedule emails for specific times (e.g., 7 days before renewal)
 * 3. Durability: Jobs survive server restarts
 * 4. Serverless: Pay only for what you use
 *
 * HOW IT WORKS:
 * 1. When a subscription is created, we "trigger" a workflow
 * 2. Upstash calls our /api/v1/workflow/send-reminders endpoint
 * 3. The workflow can "sleep" for days and wake up to send reminders
 * 4. If our server is down, Upstash retries later
 *
 * IMPORTANT: Upstash needs a PUBLIC URL to call back to your server.
 * This won't work with localhost in production - you need a deployed server.
 *
 * =============================================================================
 */

import { Client as WorkflowClient } from "@upstash/workflow";
import {
  QSTASH_CURRENT_SIGNING_KEY,
  QSTASH_NEXT_SIGNING_KEY,
  QSTASH_TOKEN,
  QSTASH_URL,
} from "./env.js";

/**
 * Create the Upstash Workflow client.
 * This client is used to trigger new workflows (schedule reminder jobs).
 *
 * Usage example:
 * await upstashWorkflowClient.trigger({
 *   url: "https://yourserver.com/api/v1/workflow/send-reminders",
 *   body: { subscriptionId: "123" }
 * });
 */
export const upstashWorkflowClient = new WorkflowClient({
  url: QSTASH_URL,
  token: QSTASH_TOKEN,
});
