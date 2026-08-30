import type { Comment } from "../types/comment.types";

export interface CommentNode {
  comment: Comment;
  children: CommentNode[];
}

export function buildCommentTree(comments: Comment[]): CommentNode[] {
  const nodes = new Map<string, CommentNode>();
  for (const comment of comments) {
    nodes.set(comment.id, { comment, children: [] });
  }
  const roots: CommentNode[] = [];
  for (const node of nodes.values()) {
    const parent = node.comment.parentId
      ? nodes.get(node.comment.parentId)
      : undefined;
    if (parent) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  }
  const byNewest = (a: CommentNode, b: CommentNode) =>
    new Date(b.comment.createdAt).getTime() - new Date(a.comment.createdAt).getTime();
  roots.sort(byNewest);
  for (const node of nodes.values()) {
    node.children.sort(byNewest);
  }
  return roots;
}

export { buildCommentTree as buildTree };
