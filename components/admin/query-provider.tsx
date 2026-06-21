"use client";

import { useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  type QueryClientConfig,
} from "@tanstack/react-query";

const config: QueryClientConfig = {
  defaultOptions: {
    queries: {
      // Admin data is private and changes frequently; keep it fresh on focus
      // but avoid hammering on every mount.
      staleTime: 30_000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
};

/** TanStack Query provider scoped to the admin dashboard. */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(() => new QueryClient(config));
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
