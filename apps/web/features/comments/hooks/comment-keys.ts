export const commentKeys = {
  all: ["comments"] as const,
  list: (postId: string) => ["comments", postId] as const,
};
