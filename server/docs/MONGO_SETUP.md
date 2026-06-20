# MongoDB Setup Guide

This guide details how to set up your MongoDB Database (local or MongoDB Atlas cloud cluster) for the Smart Travel Planner application.

## Prerequisites

- Node.js (v18+)
- MongoDB Atlas Account OR a local MongoDB instance.

## Step 1: Get MongoDB URI

### Option A: MongoDB Atlas (Cloud - Recommended)

1. Sign in to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a free shared cluster (M0) and select your region.
3. In the security settings, create a database user (e.g. `planner_user` with a strong password).
4. Add `0.0.0.0/0` (allow all IP addresses) to the IP Access List during development, or add your specific server IP address.
5. Click **Connect** on your Database Cluster, choose **Drivers**, and copy the Connection String. It should look like:

   ```text
   mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/smart-travel-planner?retryWrites=true&w=majority
   ```

### Option B: Local MongoDB Installation

1. Install MongoDB Community Edition on your machine.
2. Start the local MongoDB service.
3. Your local connection URI will usually be:

   ```text
   mongodb://localhost:27017/smart-travel-planner
   ```

---

## Step 2: Configure Environment Variables

Create a file named `.env` in the root of the project directory (or update the existing one) with the following details:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/smart-travel-planner?retryWrites=true&w=majority
JWT_SECRET=supersecretjwtkey12345!
JWT_REFRESH_SECRET=supersecretrefreshjwtkey98765!
ACCESS_TOKEN_EXPIRE=15m
REFRESH_TOKEN_EXPIRE=7d
GEMINI_API_KEY=AIzaSyYourGeminiAPIKeyHere
NODE_ENV=development
```

Replace `<username>` and `<password>` with your database credentials.

---

## Step 3: Run Database Seeder

To populate the database with initial destination and weather cache records (at least 50 detailed destinations), execute the seed script:

```bash
# From the root directory, run:
npx tsx server/seed.ts
```

This script will:

1. Connect to the MongoDB instance defined in `MONGODB_URI`.
2. Clear any existing destinations, users, and weather records.
3. Seed 50+ beautiful destinations from India and around the globe.
4. Add user and admin accounts for testing.
5. Create default weather records to support local fallback APIs.

