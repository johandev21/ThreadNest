import { useEffect } from "react";
import type { QueryClient } from "@tanstack/react-query";

import { type Comment, type Post } from "@/lib/api";
import { applyScorePatch, qk } from "@/lib/queries";

type RealtimeEvent =
  | { event: "post:new"; topic: string; payload: Post }
  | { event: "comment:new"; topic: string; payload: Comment }
  | {
      event: "vote:update";
      topic: string;
      payload: { targetType: string; targetId: string; score: number };
    };

const MAX_RECONNECT_DELAY = 30_000;

class RealtimeManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, number>();
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  private queryClient: QueryClient | null = null;

  init(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  subscribe(topics: string[]) {
    let added = false;
    for (const topic of topics) {
      const count = this.subscriptions.get(topic) ?? 0;
      this.subscriptions.set(topic, count + 1);
      if (count === 0) added = true;
    }
    if (!added || topics.length === 0) return;
    if (this.isOpen()) {
      this.send({ action: "subscribe", topics });
    } else {
      this.connect();
    }
  }

  unsubscribe(topics: string[]) {
    const removed: string[] = [];
    for (const topic of topics) {
      const count = this.subscriptions.get(topic) ?? 0;
      if (count <= 1) {
        this.subscriptions.delete(topic);
        removed.push(topic);
      } else {
        this.subscriptions.set(topic, count - 1);
      }
    }
    if (removed.length > 0 && this.isOpen()) {
      this.send({ action: "unsubscribe", topics: removed });
    }
  }

  private isOpen() {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  private send(message: { action: "subscribe" | "unsubscribe"; topics: string[] }) {
    this.ws?.send(JSON.stringify(message));
  }

  private connect() {
    if (typeof window === "undefined") return;
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }
    const topics = [...this.subscriptions.keys()];
    if (topics.length === 0) return;

    clearTimeout(this.reconnectTimer);
    const ws = new WebSocket(
      `ws://localhost:3001/realtime?topics=${topics.join(",")}`
    );
    this.ws = ws;

    ws.onopen = () => {
      this.attempts = 0;
      this.send({ action: "subscribe", topics });
    };
    ws.onmessage = (event) => this.handleMessage(event);
    ws.onclose = () => {
      this.ws = null;
      this.scheduleReconnect();
    };
    ws.onerror = () => {
      ws.close();
    };
  }

  private scheduleReconnect() {
    if (this.subscriptions.size === 0) return;
    const delay = Math.min(MAX_RECONNECT_DELAY, 1000 * 2 ** this.attempts);
    this.attempts += 1;
    this.reconnectTimer = setTimeout(() => this.connect(), delay);
  }

  private handleMessage(event: MessageEvent) {
    const queryClient = this.queryClient;
    if (!queryClient) return;

    let message: RealtimeEvent;
    try {
      message = JSON.parse(String(event.data)) as RealtimeEvent;
    } catch {
      return;
    }

    if (message.event === "post:new") {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    } else if (message.event === "comment:new") {
      const comment = message.payload;
      if (!comment?.id || !comment.postId) return;
      queryClient.setQueryData<Comment[]>(qk.comments(comment.postId), (existing) => {
        if (!existing) return existing;
        if (existing.some((item) => item.id === comment.id)) return existing;
        return [...existing, comment];
      });
    } else if (message.event === "vote:update") {
      const payload = message.payload;
      if (!payload?.targetId || typeof payload.score !== "number") return;
      applyScorePatch(queryClient, payload.targetId, payload.score);
    }
  }
}

export const realtime = new RealtimeManager();

export function initRealtime(queryClient: QueryClient) {
  realtime.init(queryClient);
}

export function useRealtimeTopics(topics: string[]) {
  const key = topics.join(",");
  useEffect(() => {
    if (!key) return;
    const list = key.split(",");
    realtime.subscribe(list);
    return () => realtime.unsubscribe(list);
  }, [key]);
}
