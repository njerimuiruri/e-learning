import React from "react";

export default function NotFound() {
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
            <h1 style={{ fontSize: 28, marginBottom: 8 }}>Page not found</h1>
            <p style={{ color: "#6b7280" }}>
              We couldn't find the page you're looking for.
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}
