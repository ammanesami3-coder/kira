"use client";

import { useEffect } from "react";

/**
 * Last-resort error boundary. It only renders when the root layout itself
 * fails, which means NO providers, theme, fonts or globals.css are available.
 * It must therefore render its own <html>/<body> and rely on inline styles
 * only, and cannot use next-intl — so the copy is bilingual (ar + fr) static
 * text, defaulting to the Arabic-first market direction.
 */
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
    <html lang="ar" dir="rtl">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.75rem",
          padding: "2rem",
          textAlign: "center",
          fontFamily:
            "system-ui, -apple-system, Segoe UI, Tahoma, Arial, sans-serif",
          background: "#ffffff",
          color: "#0b1220",
        }}
      >
        <p style={{ fontSize: "3.5rem", fontWeight: 700, color: "#0f3d3e" }}>
          500
        </p>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 600, margin: 0 }}>
          حدث خطأ ما
        </h1>
        <p style={{ color: "#5b6b6b", margin: 0 }}>
          واجهنا مشكلة غير متوقعة. حاول مرة أخرى.
        </p>
        <p style={{ color: "#5b6b6b", margin: 0 }} lang="fr" dir="ltr">
          Un problème inattendu est survenu. Veuillez réessayer.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "1rem",
            cursor: "pointer",
            border: "none",
            borderRadius: "0.5rem",
            padding: "0.6rem 1.4rem",
            fontSize: "0.95rem",
            fontWeight: 500,
            color: "#f7faf9",
            background: "#0f3d3e",
          }}
        >
          إعادة المحاولة · Réessayer
        </button>
      </body>
    </html>
  );
}
