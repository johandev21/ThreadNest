import { apiClient } from "@/shared/api/api-client";

export function deletePost(id: string): Promise<{ ok: true }> {
  return apiClient.delete<{ ok: true }>(`/api/posts/${encodeURIComponent(id)}`);
}
