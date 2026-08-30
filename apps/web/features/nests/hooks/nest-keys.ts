export const nestKeys = {
  all: ["nests"] as const,
  detail: (slug: string) => ["nest", slug] as const,
};
