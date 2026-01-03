/**
 * =============================================================================
 * SENDEMAIL.JS - Email Sending Utility
 * =============================================================================
 *
 * This file handles all email sending functionality for the application.
 *
 * WHAT IS NODEMAILER?
 * Nodemailer is the most popular Node.js library for sending emails.
 * It supports various transport methods: SMTP, Gmail, SendGrid, etc.
 *
 * HOW EMAIL SENDING WORKS:
 * 1. Create a "transporter" - the email delivery service connection
 * 2. Define "mail options" - who, what, subject, body
 * 3. Call sendMail() to actually send the email
 *
 * SMTP CONFIGURATION:
 * - HOST: The mail server address (e.g., smtp.gmail.com)
 * - PORT: 587 (TLS) or 465 (SSL) or 25 (unencrypted - not recommended)
 * - USER: Your email address
 * - PASSWORD: For Gmail, use an "App Password" not your regular password
 *
 * COMMON EMAIL PROVIDERS:
 * - Gmail: smtp.gmail.com (requires App Password with 2FA)
 * - Outlook: smtp-mail.outlook.com
 * - SendGrid: smtp.sendgrid.net (production recommended)
 *
 * =============================================================================
 */

import nodemailer from "nodemailer";
import {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASSWORD,
  EMAIL_FROM,
} from "../config/env.js";

/**
 * Create reusable transporter object.
 * A transporter is a connection to the email server.
 * We create it once and reuse it for all emails (more efficient).
 *
 * SECURITY NOTE:
 * - "secure: true" uses SSL/TLS encryption (port 465)
 * - "secure: false" uses STARTTLS upgrade (port 587)
 * - Both are encrypted, just different methods
 */
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST, // SMTP server hostname
  port: EMAIL_PORT, // SMTP port number
  secure: EMAIL_PORT === "465", // true for 465 (SSL), false for 587 (TLS)
  auth: {
    user: EMAIL_USER, // Email account username
    pass: EMAIL_PASSWORD, // Email account password/app password
  },
});

/**
 * Send an email notification.
 * This is a generic function that can send any type of email.
 *
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email address
 * @param {string} options.subject - Email subject line
 * @param {string} options.text - Plain text content (for email clients that don't support HTML)
 * @param {string} options.html - HTML content (optional, but recommended for nice formatting)
 * @returns {Promise<Object>} - Nodemailer send result with messageId
 *
 * EXAMPLE USAGE:
 * await sendEmail({
 *   to: "user@example.com",
 *   subject: "Welcome!",
 *   text: "Thanks for signing up",
 *   html: "<h1>Thanks for signing up!</h1>"
 * });
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  const mailOptions = {
    from: EMAIL_FROM || `"SubDub" <${EMAIL_USER}>`, // Sender address
    to, // Recipient(s) - can be array: ["a@b.com", "c@d.com"]
    subject, // Subject line
    text, // Plain text body (fallback)
    html, // HTML body (preferred)
  };

  try {
    // Send the email and get the result
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully to ${to}: ${info.messageId}`);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    // Log error for debugging but re-throw for caller to handle
    console.error(`Failed to send email to ${to}:`, error.message);
    throw error;
  }
};

/**
 * =============================================================================
 * SEND RENEWAL REMINDER
 * =============================================================================
 *
 * Sends a beautifully formatted subscription renewal reminder email.
 * This is the main function used by the workflow controllers.
 *
 * WHY BOTH TEXT AND HTML?
 * - HTML: Beautiful, styled emails for modern email clients
 * - Text: Fallback for email clients that don't support HTML (rare but good practice)
 *
 * EMAIL STRUCTURE:
 * 1. Subject line with emoji and urgency indicator
 * 2. Personal greeting using username
 * 3. Subscription details in a styled card
 * 4. Warning/action section
 * 5. Footer with branding
 *
 * @param {Object} options - Reminder options
 * @param {string} options.email - User's email address (where to send)
 * @param {string} options.username - User's name (for personalization)
 * @param {string} options.subscriptionName - e.g., "Netflix", "Spotify"
 * @param {Date} options.renewalDate - When the subscription renews
 * @param {number} options.price - Subscription cost (e.g., 15.99)
 * @param {string} options.currency - Currency code (e.g., "USD", "EUR")
 * @param {number} options.daysUntilRenewal - Days until renewal (for urgency)
 * @returns {Promise<Object>} - Email send result from sendEmail()
 *
 * EXAMPLE:
 * await sendRenewalReminder({
 *   email: "user@example.com",
 *   username: "John",
 *   subscriptionName: "Netflix",
 *   renewalDate: new Date("2025-02-01"),
 *   price: 15.99,
 *   currency: "USD",
 *   daysUntilRenewal: 3
 * });
 */
export const sendRenewalReminder = async ({
  email,
  username,
  subscriptionName,
  renewalDate,
  price,
  currency,
  daysUntilRenewal,
}) => {
  // Format the date nicely: "Friday, January 31, 2025"
  // toLocaleDateString() converts Date to human-readable string
  const formattedDate = new Date(renewalDate).toLocaleDateString("en-US", {
    weekday: "long", // "Friday"
    year: "numeric", // "2025"
    month: "long", // "January"
    day: "numeric", // "31"
  });

  // Create an eye-catching subject line with emoji
  // Template literals (``) allow embedding variables with ${}
  // The ternary operator handles pluralization: "1 day" vs "3 days"
  const subject = `⏰ Reminder: Your ${subscriptionName} subscription renews in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? "s" : ""}`;

  // PLAIN TEXT VERSION
  // This is shown if the email client doesn't support HTML
  // Keep it simple and readable
  const text = `
Hi ${username || "there"},

This is a friendly reminder that your ${subscriptionName} subscription will renew on ${formattedDate}.

Subscription Details:
- Name: ${subscriptionName}
- Renewal Date: ${formattedDate}
- Amount: ${price} ${currency}
- Days Until Renewal: ${daysUntilRenewal}

If you wish to cancel or modify your subscription, please log in to your SubDub account.

Best regards,
The SubDub Team
  `;

  // HTML VERSION
  // This is the beautiful formatted version most users will see
  // Uses inline CSS for maximum email client compatibility
  // Note: Email CSS is limited - no external stylesheets, limited CSS support
  const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
    .details-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .details-row:last-child { border-bottom: none; }
    .label { color: #666; }
    .value { font-weight: bold; color: #333; }
    .warning { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 8px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 20px; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>⏰ Subscription Renewal Reminder</h1>
    </div>
    <div class="content">
      <p>Hi <strong>${username || "there"}</strong>,</p>
      <p>This is a friendly reminder that your subscription is renewing soon!</p>
      
      <div class="details">
        <div class="details-row">
          <span class="label">Subscription</span>
          <span class="value">${subscriptionName}</span>
        </div>
        <div class="details-row">
          <span class="label">Renewal Date</span>
          <span class="value">${formattedDate}</span>
        </div>
        <div class="details-row">
          <span class="label">Amount</span>
          <span class="value">${price} ${currency}</span>
        </div>
        <div class="details-row">
          <span class="label">Days Until Renewal</span>
          <span class="value">${daysUntilRenewal} day${daysUntilRenewal > 1 ? "s" : ""}</span>
        </div>
      </div>
      
      <div class="warning">
        <strong>📌 Action Required?</strong><br>
        If you wish to cancel or modify this subscription, please log in to your SubDub account before the renewal date.
      </div>
      
      <div class="footer">
        <p>Best regards,<br><strong>The SubDub Team</strong></p>
        <p>You received this email because you have an active subscription on SubDub.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `;

  // Call our generic sendEmail function with the prepared content
  // This reuses the transporter and handles the actual sending
  return sendEmail({ to: email, subject, text, html });
};

// Export sendEmail as default for flexibility
// Other files can import as: import sendEmail from "./sendEmail.js"
// Or use named export: import { sendEmail, sendRenewalReminder } from "./sendEmail.js"
export default sendEmail;
