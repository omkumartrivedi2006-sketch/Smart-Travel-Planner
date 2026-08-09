# Smart Travel Planner

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-v18%2B-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v19.0-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-v5.6-blue)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-v7.1-purple)](https://vitejs.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas%20%2F%20In--Memory-brightgreen)](https://www.mongodb.com/)

**Smart Travel Planner** is a full-stack, AI-powered web application designed to help travelers discover destinations, create personalized itineraries, estimate trip budgets, check live weather forecasts, and plan interactive routes with ease.

---

## 🌟 Key Features

-  **AI-Powered Itinerary Generator**: Powered by Groq AI LLM for ultra-fast, customized day-by-day travel plans based on user preferences, trip duration, budget, and travel style.
-  **Interactive Route Planner & Maps**: Integrated with Leaflet and Geoapify for place search, turn-by-turn routing, and interactive maps.
-  **Live Weather Forecasts**: Powered by OpenWeatherMap API with built-in caching for instant weather insights for over 100+ destinations.
-  **Budget Calculator**: Plan and track estimated travel expenses across accommodation, transport, food, activities, and emergency funds.
-  **AI Travel Assistant**: Embedded real-time chat widget and full-page chat assistant to help answer trip questions, recommend local hotspots, and suggest packing lists.
-  **Rich Destination Exploration**: Dynamic search, filtering, and high-resolution imagery via Pexels API integration.
-  **User Authentication & Profiles**: Secure JWT authentication with registration, login, password recovery, profile management, and saved trips history.
-  **Admin Dashboard**: System administration interface for managing destinations, viewing usage metrics, and user management.
-  **Zero-Config Database Resilience**: Supports cloud MongoDB Atlas as well as an automated, zero-config in-memory MongoDB fallback with 108 auto-seeded destinations.
-  **Swagger API Documentation**: Built-in OpenAPI documentation served at `/api/docs`.

---

##  Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript
- **Bundler**: Vite 7
- **Styling**: Tailwind CSS + Radix UI components + Lucide Icons
- **Animations**: Framer Motion
- **Routing**: Wouter
- **Maps**: Leaflet + React-Leaflet

### Backend
- **Runtime**: Node.js + Express.js (ESM / TypeScript via `tsx`)
- **Database**: MongoDB (Mongoose ORM) + `mongodb-memory-server` fallback
- **Authentication**: JSON Web Tokens (JWT) + `bcryptjs` password hashing
- **API Documentation**: Swagger UI Express

### Live APIs & Services
- **AI Core**: Groq AI (Llama-3 models)
- **Map & Geocoding**: Geoapify API & Leaflet
- **Weather Data**: OpenWeatherMap API
- **Dynamic Photography**: Pexels API

---

##  Project Structure

```text
Smart-Travel-Planner/
├── client/                     # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components & navigation
│   │   ├── contexts/           # React Context (Auth, Location, Theme)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── pages/              # Main application pages
│   │   ├── services/           # Frontend API client services
│   │   ├── App.tsx             # Main router configuration
│   │   └── main.tsx            # React entry point
│   └── index.html
├── server/                     # Node.js Express backend application
│   ├── config/                 # Database & environment configuration
│   ├── controllers/            # API request handlers
│   ├── middleware/             # Auth, error handling & validation middleware
│   ├── models/                 # Mongoose schemas (User, Trip, Destination, etc.)
│   ├── routes/                 # Express API routes
│   ├── services/               # External API services (Groq, Weather, Pexels)
│   └── index.ts                # Express server entry point
├── scripts/                    # Development startup scripts
├── .env.example                # Template for environment variables
├── package.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.0.0 or higher)
- **npm** (v9.0.0 or higher) or **pnpm**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/omkumartrivedi2006-sketch/Smart-Travel-Planner.git
   cd Smart-Travel-Planner
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to create `.env`:
   ```bash
   cp .env.example .env
   ```
   *Note: Pre-configured development API keys are supplied in `.env` for local testing.*

4. **Start the Development Server:**
   ```bash
   npm run dev
   ```
   This will start both:
   - **Frontend (Vite Dev Server)**: [http://localhost:3000](http://localhost:3000)
   - **Backend (Express API)**: [http://localhost:5000](http://localhost:5000)

---

##  Database Configuration

The application is engineered to work out of the box with zero database setup required:

- **Local / In-Memory Mode (Default)**: If `MONGODB_URI` is unset or unreachable, the server automatically spins up an in-memory MongoDB instance and seeds **108 global destination records** into memory.
- **MongoDB Atlas Cloud Mode**: To use persistent cloud storage, set `MONGODB_URI` in `.env` to your MongoDB Atlas connection string and ensure your current IP address is whitelisted in MongoDB Atlas Network Access.

---

##  Available Scripts

| Script | Description |
| :--- | :--- |
| `npm run dev` | Runs both Vite frontend (port 3000) and Express server (port 5000) concurrently in watch mode. |
| `npm run vite-only` | Runs only the Vite dev server on port 3000. |
| `npm run build` | Builds the client bundle and compiles the TypeScript server for production. |
| `npm start` | Launches the compiled production server. |
| `npm run check` | Runs TypeScript type checker (`tsc --noEmit`). |
| `npm run format` | Formats code across the workspace using Prettier. |

---

##  API Documentation

Interactive OpenAPI / Swagger documentation is generated automatically and accessible when the server is running:

- **Swagger UI**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

### Key API Endpoints

- **Auth**: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/profile`
- **Destinations**: `GET /api/destinations`, `GET /api/destinations/:id`
- **AI Trips**: `POST /api/trips/generate`, `GET /api/trips`, `GET /api/trips/:id`
- **Weather**: `GET /api/weather/:city`
- **Route Planning**: `GET /api/routes/plan`
- **AI Chat**: `POST /api/chat`

---

##  License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
