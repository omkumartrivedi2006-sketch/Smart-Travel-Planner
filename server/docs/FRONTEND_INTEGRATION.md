# Frontend-to-Backend Integration Guide

This guide outlines how the React frontend interacts with the Express backend APIs in both development and production environments.

## Development Proxy Configuration

In development, the Vite server runs on `http://localhost:3000` while the backend runs on `http://localhost:5000`. To prevent CORS issues and simplify requests, we use Vite's development server proxy.

### Vite Config (`vite.config.ts`)

The proxy config forwards `/api` requests to `http://localhost:5000`:

```typescript
server: {
  port: 3000,
  proxy: {
    '/api': {
      target: 'http://localhost:5000',
      changeOrigin: true,
      secure: false
    }
  }
}
```

This allows the frontend to call `fetch('/api/auth/login')` directly without hardcoding port numbers.

---

## Authentication & Token Management

The backend uses a dual-JWT strategy:

1. **Access Token** (`accessToken`): Short-lived token (15 mins) passed in the `Authorization` header.
2. **Refresh Token** (`refreshToken`): Long-lived token (7 days) used to retrieve a new Access Token.

### Token Flow

1. **Login/Register**: Upon successful auth, the backend returns both tokens.
2. **Storage**: Store the access token and user object in application state/localStorage. Store the refresh token in localStorage (or an HTTP-only cookie if preferred, but currently our client sends it in the JSON body of `/api/auth/refresh`).
3. **Request Interceptor / Header Utility**: For any protected endpoint, append the header:

   ```typescript
   headers: {
     'Authorization': `Bearer ${accessToken}`,
     'Content-Type': 'application/json'
   }
   ```

4. **Token Expiry (401 Unauthorized)**:
   If a request fails with `401 Unauthorized`, make a POST request to `/api/auth/refresh` containing the stored `refreshToken`.
   - If successful, save the new `accessToken` and retry the original request.
   - If failed, clear local state/localStorage and redirect to the `/login` page.

---

## Endpoint Map & Integration Points

Here is how each page hooks into the backend APIs:

### 1. Auth Pages

- **Login (`/login`)**: Calls `POST /api/auth/login` with email and password. Saves token, sets user session, and redirects to dashboard.
- **Register (`/register`)**: Calls `POST /api/auth/register` with name, email, and password.
- **Forgot Password (`/forgot-pass`)**: Calls `POST /api/auth/forgot-pass` with email.

### 2. Destination Explorer (`/destinations`)

- **Destinations List**: Calls `GET /api/destinations?search=...&category=...&country=...` to query active database records.
- **Destination Details (`/destinations/:id`)**: Calls `GET /api/destinations/:id` to fetch full description, coordinates, average cost, activities, and live weather forecast.

### 3. Weather Forecast (`/weather`)

- **Forecast Lookup**: Calls `GET /api/weather/:destination` which retrieves live forecasted climate arrays (temperature, weather status, wind, humidity, and recommendations).

### 4. Route Planner (`/routes`)

- **Route Calculation**: Calls `POST /api/routes/calculate` with origin coordinates, destination ID, and mode of transport to receive distance, time, and cost estimates.

### 5. Trip Planner & Saved Trips (`/trips`)

- **Create Trip**: Calls `POST /api/trips` with dates, transport/hotel preferences, and destination ID. The backend automatically inserts/calculates the daily itinerary list and a linked budget record.
- **List Saved Trips**: Calls `GET /api/trips` (protected).
- **Delete Trip**: Calls `DELETE /api/trips/:id` (protected) to remove the trip and its associated budget from the database.

### 6. AI Chat Assistant (`/chat`)

- **Send Message**: Calls `POST /api/chat/message` with user message and session identifier.
- **History**: Calls `GET /api/chat/history?session=...`.
- **Clear History**: Calls `DELETE /api/chat/history?session=...`.

