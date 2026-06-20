import { toast } from "sonner";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  status: string;
  data: {
    user: User;
    accessToken: string;
    refreshToken: string;
  };
}

export function getAccessToken(): string | null {
  return localStorage.getItem("accessToken");
}

export function getRefreshToken(): string | null {
  return localStorage.getItem("refreshToken");
}

export function getSessionUser(): User | null {
  const user = localStorage.getItem("session_user");
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setSession(user: User, accessToken: string, refreshToken: string) {
  localStorage.setItem("session_user", JSON.stringify(user));
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
}

export function clearSession() {
  localStorage.removeItem("session_user");
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user_profile"); // clear cached profile as well
}

let isRefreshing = false;
let refreshSubscribers: ((token: string) => void)[] = [];

function subscribeTokenRefresh(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

function onRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

export async function apiFetch(url: string, options: RequestInit = {}): Promise<any> {
  const token = getAccessToken();
  const headers = new Headers(options.headers || {});
  
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    console.error("Network error fetching API:", err);
    throw new Error("Network error. Please check if backend server is running.");
  }

  if (response.status === 401) {
    const rToken = getRefreshToken();
    if (!rToken) {
      clearSession();
      if (window.location.pathname !== "/login" && window.location.pathname !== "/register") {
        window.location.href = "/login";
      }
      throw new Error("Session expired. Please log in again.");
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshRes = await fetch("/api/auth/refresh", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken: rToken }),
        });

        if (refreshRes.ok) {
          const refreshData = await refreshRes.json();
          const newAccessToken = refreshData.data.accessToken;
          localStorage.setItem("accessToken", newAccessToken);
          isRefreshing = false;
          onRefreshed(newAccessToken);
        } else {
          isRefreshing = false;
          clearSession();
          window.location.href = "/login";
          throw new Error("Session expired. Please log in again.");
        }
      } catch (err) {
        isRefreshing = false;
        clearSession();
        window.location.href = "/login";
        throw err;
      }
    }

    return new Promise((resolve, reject) => {
      subscribeTokenRefresh((newToken) => {
        headers.set("Authorization", `Bearer ${newToken}`);
        fetch(url, { ...options, headers })
          .then((res) => {
            if (!res.ok) {
              return res.json().then((errData) => reject(new Error(errData.message || "Request failed after refresh")));
            }
            resolve(res.json());
          })
          .catch((err) => reject(err));
      });
    });
  }

  const responseJson = await response.json().catch(() => null);

  if (!response.ok) {
    const message = (responseJson && responseJson.message) || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return responseJson;
}
