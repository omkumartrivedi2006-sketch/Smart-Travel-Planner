# Production Deployment Guide

This guide details how to build, bundle, and deploy the Smart Travel Planner application to cloud providers like Render, Heroku, Vercel, or VPS platforms.

## Production Build Workflow

The project uses a mono-repo structure where Vite is used to build the client static pages and `esbuild` is used to bundle the backend Express script.

### 1. Build Command

Run the build script from the root directory:

```bash
npm run build
```

This command triggers two processes:

1. `vite build`: Compiles the React/TS frontend code and outputs static assets into the `dist/public` folder.
2. `esbuild server/index.ts ...`: Bundles the Express server into `dist/index.js` as an ES module.

### 2. Startup Command

To run the production-built bundle:

```bash
npm start
```

This runs the compiled node script in `dist/index.js`. The Express server automatically serves the frontend static assets from `dist/public` and handles client-side route fallback.

---

## Deployment Platforms

### Option A: Render or Heroku (Unified Deployment)

Since the backend serves the frontend static files in production, you can deploy the entire application as a single web service.

1. **Build Command**: `npm install && npm run build`
2. **Start Command**: `npm start`
3. **Environment Variables**:
   - `NODE_ENV`: `production`
   - `PORT`: `3000` (or leave empty as Render/Heroku assigns this automatically)
   - `MONGODB_URI`: The connection string to your production database
   - `JWT_SECRET`: A secure cryptographically random string
   - `JWT_REFRESH_SECRET`: A separate secure random string
   - `GEMINI_API_KEY`: Your Google Gemini API key

### Option B: Split Deployments (Frontend on Vercel/Netlify, Backend on Render)

If you prefer to deploy the static frontend separately from the backend server:

#### 1. Backend Service (Express)

- **Repo root path**: Run the server bundling.
- **Port**: Set `PORT=3000` or whatever the environment provides.
- **Root routing**: Ensure you remove the wildcard static serving or leave it as a fallback.

#### 2. Frontend Service (Vite Static Site)

- **Build Command**: `npm run build`
- **Output Directory**: `dist` (if Vercel/Netlify builds just the front end, update build settings to point to Vite outputs)
- **Vite Proxy**: In production, the client needs to talk to the backend domain directly. Set `VITE_API_URL` environment variable to point to your live Express backend domain (e.g. `https://api.smarttravelplanner.com`), and ensure client requests utilize this base URL when making requests.
