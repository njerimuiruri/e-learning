import axios from "axios";

// Create axios instance with default config
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true, // Enable sending cookies with requests
});

// Request interceptor - attach Bearer token when available
api.interceptors.request.use(
  (config) => {
    // Grab token from localStorage on the client; skip on the server
    if (typeof window !== "undefined") {
      const token = window.localStorage.getItem("token");
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle errors globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle specific error cases
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // Unauthorized - clear cookies and redirect to login
          // Cookies are cleared by backend, we just redirect
          if (
            typeof window !== "undefined" &&
            !window.location.pathname.includes("/login") &&
            !window.location.pathname.includes("/register")
          ) {
            // Clear user cookie on client side
            document.cookie =
              "user=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
            window.location.href = "/login";
          }
          break;

        case 403:
          // Forbidden
          console.error("Access forbidden");
          break;

        case 404:
          console.error("Resource not found");
          break;

        case 500:
          console.error("Server error");
          break;
      }
    } else if (error.request) {
      // Request made but no response
      console.error("Network error - no response from server");
    } else {
      // Something else happened
      console.error("Error:", error.message);
    }

    return Promise.reject(error);
  }
);

export default api;
