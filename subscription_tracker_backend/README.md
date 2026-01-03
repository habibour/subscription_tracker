# 📬 Subscription Tracker Backend

A production-ready **Node.js/Express REST API** for managing subscription services with **automated email reminders**. Built with modern backend architecture patterns including durable workflows, JWT authentication, and MongoDB.

![Node.js](https://img.shields.io/badge/Node.js-18+-green?logo=node.js)
![Express](https://img.shields.io/badge/Express-4.x-blue?logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-green?logo=mongodb)
![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 🎯 Project Overview

**SubDub** is a subscription management platform that helps users track their recurring payments and never miss a renewal date. The backend handles user authentication, subscription CRUD operations, and **automated email notifications** sent 7, 3, and 1 day before each renewal.

### ✨ Key Features

| Feature                          | Description                                            |
| -------------------------------- | ------------------------------------------------------ |
| 🔐 **JWT Authentication**        | Secure user registration & login with token-based auth |
| 📊 **Subscription Management**   | Full CRUD operations for tracking subscriptions        |
| 📧 **Smart Email Reminders**     | Automated emails at 7, 3, and 1 day before renewal     |
| ⏰ **Durable Workflows**         | Upstash Workflow for reliable, long-running tasks      |
| 🛡️ **Rate Limiting**             | Arcjet integration for bot protection & rate limiting  |
| 🎨 **Beautiful Email Templates** | Responsive HTML emails with inline CSS                 |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT REQUEST                           │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      EXPRESS MIDDLEWARE                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ JSON     │→ │ Cookies  │→ │ Arcjet   │→ │ Auth (JWT)       │ │
│  │ Parser   │  │ Parser   │  │ Security │  │ Verification     │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                          ROUTES                                  │
│  /api/v1/auth    /api/v1/users    /api/v1/subscriptions         │
│  /api/v1/workflow                                                │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                       CONTROLLERS                                │
│  ┌────────────────┐  ┌────────────────┐  ┌────────────────────┐ │
│  │ Auth           │  │ Subscriptions  │  │ Workflow           │ │
│  │ - register     │  │ - create       │  │ - sendReminders    │ │
│  │ - login        │  │ - getAll       │  │ - scheduleWorkflow │ │
│  │ - logout       │  │ - update       │  │ - processAll       │ │
│  └────────────────┘  └────────────────┘  └────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                         MODELS                                   │
│  ┌────────────────────────┐  ┌────────────────────────────────┐ │
│  │ User                   │  │ Subscription                   │ │
│  │ - email (unique)       │  │ - name, price, currency        │ │
│  │ - password (hashed)    │  │ - frequency, category          │ │
│  │ - username             │  │ - renewalDate, status          │ │
│  └────────────────────────┘  └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        MONGODB                                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Email Reminder Workflow

The standout feature of this project is the **durable workflow system** for email reminders:

```
┌──────────────────────────────────────────────────────────────────┐
│                    SUBSCRIPTION CREATED                          │
└──────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌──────────────────────────────────────────────────────────────────┐
│              Upstash Workflow Triggered                          │
│         (Durable, survives server restarts)                      │
└──────────────────────────────────────────────────────────────────┘
                                │
            ┌───────────────────┴───────────────────┐
            ▼                                       ▼
    ┌───────────────┐                      ┌───────────────┐
    │ Renewal > 7   │                      │ Renewal ≤ 7   │
    │ days away     │                      │ days away     │
    └───────────────┘                      └───────────────┘
            │                                       │
            ▼                                       ▼
    ┌───────────────┐                      ┌───────────────┐
    │ SLEEP until   │                      │ Send 7-day    │
    │ 7 days before │                      │ reminder      │
    └───────────────┘                      └───────────────┘
            │                                       │
            └───────────────────┬───────────────────┘
                                ▼
                        ┌───────────────┐
                        │ SLEEP 4 days  │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Send 3-day    │
                        │ reminder      │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ SLEEP 2 days  │
                        └───────────────┘
                                │
                                ▼
                        ┌───────────────┐
                        │ Send 1-day    │
                        │ reminder      │
                        └───────────────┘
```

### Why Upstash Workflows?

Traditional approaches (cron jobs + database state) are complex and error-prone. Upstash Workflows provide:

- **Durability**: Workflows survive server restarts
- **Automatic Retries**: Failed steps are retried automatically
- **Long Sleeps**: Can sleep for days/weeks without blocking
- **Simplicity**: No need to manage state manually

---

## 🛠️ Tech Stack

| Technology             | Purpose                        |
| ---------------------- | ------------------------------ |
| **Node.js**            | JavaScript runtime             |
| **Express.js**         | Web framework                  |
| **MongoDB + Mongoose** | Database & ODM                 |
| **JWT (jsonwebtoken)** | Authentication tokens          |
| **bcryptjs**           | Password hashing               |
| **Nodemailer**         | Email sending                  |
| **Upstash Workflow**   | Durable background jobs        |
| **Arcjet**             | Rate limiting & bot protection |
| **dayjs**              | Date manipulation              |
| **cookie-parser**      | Cookie handling                |

---

## 📁 Project Structure

```
subscription_tracker_backend/
├── app.js                 # Express app setup & middleware
├── package.json           # Dependencies & scripts
├── .env.example           # Environment variables template
│
├── config/
│   ├── env.js             # Environment variable exports
│   ├── arcjet.js          # Rate limiting configuration
│   └── upstash.js         # Upstash workflow client
│
├── controllers/
│   ├── auth.controllers.js        # Login, register, logout
│   ├── subscriptions.controllers.js  # CRUD + auto-schedule reminders
│   ├── user.controller.js         # User profile operations
│   └── workflow.controllers.js    # Email reminder workflow logic
│
├── middlewares/
│   ├── auth.middlewares.js    # JWT verification
│   ├── arcjet.middlewares.js  # Rate limiting middleware
│   └── error.middlewares.js   # Global error handler
│
├── models/
│   ├── users.models.js        # User schema & methods
│   └── subscriptions.models.js # Subscription schema
│
├── routes/
│   ├── auth.routes.js         # /api/v1/auth
│   ├── subscription.routes.js # /api/v1/subscriptions
│   ├── user.routes.js         # /api/v1/users
│   └── workflow.routes.js     # /api/v1/workflow
│
└── utils/
    └── sendEmail.js           # Nodemailer + HTML templates
```

---

## 🔌 API Endpoints

### Authentication

| Method | Endpoint                | Description               |
| ------ | ----------------------- | ------------------------- |
| POST   | `/api/v1/auth/register` | Create new user account   |
| POST   | `/api/v1/auth/login`    | Login & receive JWT token |
| POST   | `/api/v1/auth/logout`   | Logout (clear token)      |

### Subscriptions

| Method | Endpoint                             | Description              |
| ------ | ------------------------------------ | ------------------------ |
| GET    | `/api/v1/subscriptions`              | Get all subscriptions    |
| POST   | `/api/v1/subscriptions`              | Create new subscription  |
| GET    | `/api/v1/subscriptions/:id`          | Get subscription by ID   |
| PUT    | `/api/v1/subscriptions/:id`          | Update subscription      |
| DELETE | `/api/v1/subscriptions/:id`          | Delete subscription      |
| GET    | `/api/v1/subscriptions/user/:userId` | Get user's subscriptions |

### Workflow (Email Reminders)

| Method | Endpoint                             | Description               |
| ------ | ------------------------------------ | ------------------------- |
| POST   | `/api/v1/workflow/send-reminders`    | Upstash webhook endpoint  |
| GET    | `/api/v1/workflow/process-reminders` | Process all due reminders |
| POST   | `/api/v1/workflow/trigger/:id`       | Manually trigger reminder |
| POST   | `/api/v1/workflow/send-direct-email` | Test email configuration  |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)
- Gmail account with App Password (for emails)
- Upstash account (for workflows)

### Installation

```bash
# Clone the repository
git clone https://github.com/habibour/subscription_tracker_backend.git
cd subscription_tracker_backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env.development.local

# Configure your environment variables
# (See Environment Variables section below)

# Start the development server
npm run dev
```

### Environment Variables

```env
# Server
PORT=5500
NODE_ENV=development

# Database
DB_URI=mongodb://localhost:27017/subscription_tracker

# Authentication
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=7d

# Email (Gmail SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your_app_password  # No spaces!
EMAIL_FROM="SubDub <your-email@gmail.com>"

# Upstash Workflow
QSTASH_URL=https://qstash.upstash.io
QSTASH_TOKEN=your_qstash_token

# Server URL (for webhook callbacks)
SERVER_URL=http://localhost:5500
```

---

## 📧 Email Template Preview

The reminder emails feature a modern, responsive design with:

- Gradient header with branding
- Clean subscription details card
- Urgency indicator (days until renewal)
- clear call-to-action
- Mobile-responsive design

---

## 🧪 Testing

```bash
# Test email configuration
curl -X POST http://localhost:5500/api/v1/workflow/send-direct-email \
  -H "Content-Type: application/json" \
  -d '{"email": "your-email@gmail.com"}'
```

---

## 🔒 Security Features

- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure, stateless authentication
- **Rate Limiting**: Arcjet protection against abuse
- **Input Validation**: Mongoose schema validation
- **Authorization**: Users can only access their own data

---

## 📚 What I Learned

Building this project taught me:

1. **Durable Workflows** - How to handle long-running tasks that survive restarts
2. **Email Services** - SMTP configuration, HTML email limitations
3. **JWT Authentication** - Token-based auth patterns
4. **MongoDB/Mongoose** - Schema design, population, queries
5. **Error Handling** - Global error middleware patterns
6. **Code Organization** - MVC-like architecture for Express apps

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👤 Author

**Habibour Rahman Akash**

- GitHub: [@habibour](https://github.com/habibour)
- Email: habibourakash@gmail.com

---

<div align="center">
  <p>⭐ Star this repo if you found it helpful!</p>
</div>
