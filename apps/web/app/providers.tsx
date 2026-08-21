"use client";

import { useEffect, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import { initRealtime } from "@/lib/realtime";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    initRealtime(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delay={0}>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
