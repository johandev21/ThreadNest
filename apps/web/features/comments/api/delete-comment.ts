import { apiClient } from "@/shared/api/api-client";

export function deleteComment(id: string): Promise<{ ok: true }> {
  return apiClient.delete<{ ok: true }>(
    `/api/comments/${encodeURIComponent(id)}`
  );
}
