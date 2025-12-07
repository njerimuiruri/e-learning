"use client";

import React from "react";

export default function GlobalError({ error, reset }) {
  return (
    <html>
      <body>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
          }}
        >
          <div style={{ maxWidth: 720, width: "100%", textAlign: "center" }}>
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>
              Something went wrong
            </h1>
            <p style={{ color: "#6b7280", marginBottom: 16 }}>
              {error?.message || "An unexpected error occurred."}
            </p>
            <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
              <button
                onClick={() => reset && reset()}
                style={{
                  padding: "8px 14px",
                  background: "#111827",
                  color: "#fff",
                  borderRadius: 8,
                }}
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
