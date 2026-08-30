"use client";

import { useEffect } from "react";
import { realtime } from "./realtime-manager";

export function useRealtimeTopics(topics: string[]) {
  const key = topics.join(",");
  useEffect(() => {
    if (!key) return;
    const list = key.split(",");
    realtime.subscribe(list);
    return () => realtime.unsubscribe(list);
  }, [key]);
}
