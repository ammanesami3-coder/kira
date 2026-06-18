"use client";

import * as React from "react";
import { Toaster as Sonner, type ToasterProps } from "sonner";

// Standalone Toaster (no next-themes dependency in Phase 0). Theme can be
// wired to a theme provider later. Colors come from CSS variables so it
// matches the brand palette automatically.
function Toaster({ ...props }: ToasterProps) {
  return (
    <Sonner
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
