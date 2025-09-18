"use client";

// Force dynamic rendering to prevent SSR issues with Wagmi hooks
export const dynamic = 'force-dynamic';

import React from "react";
import Container from "@/components/layout/Container";

export default function TestContainersPage() {
  const variants = [
    "standard",
    "wide",
    "narrow",
    "full",
    "full-bleed",
    "touch-optimized",
  ] as const;

  return (
    <div
      style={{ background: "#0a0a0a", minHeight: "100vh", padding: "20px 0" }}
    >
      <h1 style={{ textAlign: "center", color: "white", marginBottom: "40px" }}>
        Container Architecture Test
      </h1>

      {variants.map((variant) => (
        <div key={variant} style={{ marginBottom: "40px" }}>
          <h2
            style={{
              color: "#8A2BE2",
              textAlign: "center",
              marginBottom: "20px",
              fontSize: "1.5rem",
            }}
          >
            {variant} variant
          </h2>

          <Container variant={variant}>
            <div
              style={{
                background: "rgba(138, 43, 226, 0.1)",
                border: "2px solid #8A2BE2",
                borderRadius: "8px",
                padding: "20px",
                color: "white",
                textAlign: "center",
              }}
            >
              <h3>Container: {variant}</h3>
              <p>This is a test of the {variant} container variant.</p>
              <p>
                Max-width and padding should be applied according to the
                architecture specification.
              </p>
            </div>
          </Container>
        </div>
      ))}
    </div>
  );
}
