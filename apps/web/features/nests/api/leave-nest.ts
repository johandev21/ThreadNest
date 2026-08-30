import { apiClient } from "@/shared/api/api-client";
import type { MembershipState } from "../types/nest.types";

export function leaveNest(slug: string): Promise<MembershipState> {
  return apiClient.delete<MembershipState>(
    `/api/nests/${encodeURIComponent(slug)}/membership`
  );
}
