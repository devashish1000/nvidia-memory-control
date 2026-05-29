import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "./client";

/**
 * Subscribes to all Postgres changes in the `public` schema and invalidates the
 * React Query cache so every page reflects new data in real time (Supabase
 * Realtime). Invalidation is debounced because a single seed/scenario run emits
 * many row events — we only need one refresh once the burst settles.
 *
 * Renders nothing; mount once near the app root inside QueryClientProvider.
 */
export function RealtimeSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let timer: ReturnType<typeof setTimeout> | undefined;
    const scheduleInvalidate = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        queryClient.invalidateQueries();
      }, 600);
    };

    const channel = supabase
      .channel("public-db-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public" },
        scheduleInvalidate,
      )
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return null;
}
