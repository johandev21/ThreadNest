import { apiClient } from "@/shared/api/api-client";
import type { MembershipState } from "../types/nest.types";

export function joinNest(slug: string): Promise<MembershipState> {
  return apiClient.put<MembershipState>(
    `/api/nests/${encodeURIComponent(slug)}/membership`
  );
}
