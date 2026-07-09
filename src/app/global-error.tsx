"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fafafa",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          padding: "24px",
        }}
      >
        <div style={{ maxWidth: 420, textAlign: "center" }}>
          <p
            style={{
              fontSize: 12,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              color: "#888888",
              marginBottom: 8,
            }}
          >
            Critical error
          </p>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 12px" }}>
            AuraPTE hit an unexpected error
          </h1>
          <p style={{ fontSize: 14, color: "#a3a3a3", lineHeight: 1.6, margin: "0 0 24px" }}>
            Something went wrong while loading the app. Please try again — if it keeps
            happening, refresh the page or come back later.
          </p>
          {error.digest && (
            <p style={{ fontSize: 11, fontFamily: "monospace", color: "#6b6b6b", marginBottom: 24 }}>
              Error ID: {error.digest}
            </p>
          )}
          <button
            onClick={() => reset()}
            style={{
              height: 44,
              padding: "0 24px",
              borderRadius: 8,
              background: "#fafafa",
              color: "#0a0a0a",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
