import type { Nest } from "../types/nest.types";

export function filterNests(nests: Nest[] | undefined, query: string): Nest[] {
  if (!nests) return [];
  const normalized = query.trim().toLowerCase();
  if (!normalized) return nests;
  return nests.filter((nest) => nest.slug.toLowerCase().includes(normalized));
}
