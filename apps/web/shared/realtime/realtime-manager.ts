export type RealtimeEvent<T = unknown> = {
  event: string;
  topic: string;
  payload: T;
};

export type RealtimeEventHandler<T = unknown> = (payload: T, topic: string) => void;

const MAX_RECONNECT_DELAY = 30_000;

export class RealtimeManager {
  private ws: WebSocket | null = null;
  private subscriptions = new Map<string, number>();
  private attempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  private handlers = new Map<string, Set<RealtimeEventHandler<any>>>();

  on<T = unknown>(event: string, handler: RealtimeEventHandler<T>) {
    let set = this.handlers.get(event);
    if (!set) {
      set = new Set();
      this.handlers.set(event, set);
    }
    set.add(handler as RealtimeEventHandler<any>);
    return () => {
      set?.delete(handler as RealtimeEventHandler<any>);
    };
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
    let message: RealtimeEvent;
    try {
      message = JSON.parse(String(event.data)) as RealtimeEvent;
    } catch {
      return;
    }

    const handlers = this.handlers.get(message.event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          handler(message.payload, message.topic);
        } catch {}
      }
    }
  }
}

export const realtime = new RealtimeManager();
