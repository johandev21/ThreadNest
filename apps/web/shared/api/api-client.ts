import { ApiError } from "./api-error";

export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const headers = new Headers(init?.headers);
  if (init?.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  const res = await fetch(path, { ...init, headers });
  if (!res.ok) {
    let message = `Request failed with status ${res.status}`;
    try {
      const body = (await res.json()) as { error?: unknown };
      if (typeof body.error === "string" && body.error.length > 0) {
        message = body.error;
      }
    } catch {}
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

export const apiClient = {
  get<T>(path: string, init?: Omit<RequestInit, "method">) {
    return request<T>(path, { ...init, method: "GET" });
  },
  post<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">) {
    return request<T>(path, {
      ...init,
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  put<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">) {
    return request<T>(path, {
      ...init,
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
  delete<T>(path: string, body?: unknown, init?: Omit<RequestInit, "method" | "body">) {
    return request<T>(path, {
      ...init,
      method: "DELETE",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  },
};
