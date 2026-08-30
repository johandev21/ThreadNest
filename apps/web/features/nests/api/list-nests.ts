import { apiClient } from "@/shared/api/api-client";
import type { Nest } from "../types/nest.types";

export function listNests(): Promise<Nest[]> {
  return apiClient.get<Nest[]>("/api/nests");
}
