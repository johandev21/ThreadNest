import { apiClient } from "@/shared/api/api-client";
import type { CreateNestInput, Nest } from "../types/nest.types";

export function createNest(input: CreateNestInput): Promise<Nest> {
  return apiClient.post<Nest>("/api/nests", input);
}
