import { and, eq, inArray, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { comments, votes } from '../db/schema'
import { auth } from '../auth'

export type PostRow = {
  id: string
  type: string
  title: string
  content: string | null
  url: string | null
  createdAt: Date
  nestId: string
  nestSlug: string
  nestTitle: string
  authorId: string
  authorName: string
}

export type PostDTO = {
  id: string
  type: string
  title: string
  content: string | null
  url: string | null
  createdAt: string
  nestId: string
  nestSlug: string
  nestTitle: string
  authorId: string
  authorName: string
  score: number
  commentCount: number
  myVote: number
}

export async function postScores(ids: string[], userId?: string) {
  const map = new Map<string, { score: number; myVote: number; commentCount: number }>()
  if (ids.length === 0) return map
  for (const id of ids) map.set(id, { score: 0, myVote: 0, commentCount: 0 })

  const scoreRows = await db
    .select({ targetId: votes.targetId, score: sql<number>`coalesce(sum(${votes.value}), 0)` })
    .from(votes)
    .where(and(eq(votes.targetType, 'post'), inArray(votes.targetId, ids)))
    .groupBy(votes.targetId)
  for (const row of scoreRows) {
    const entry = map.get(row.targetId)
    if (entry) entry.score = Number(row.score)
  }

  if (userId) {
    const myRows = await db
      .select({ targetId: votes.targetId, value: votes.value })
      .from(votes)
      .where(and(eq(votes.targetType, 'post'), eq(votes.userId, userId), inArray(votes.targetId, ids)))
    for (const row of myRows) {
      const entry = map.get(row.targetId)
      if (entry) entry.myVote = row.value
    }
  }

  const countRows = await db
    .select({ postId: comments.postId, count: sql<number>`count(*)` })
    .from(comments)
    .where(inArray(comments.postId, ids))
    .groupBy(comments.postId)
  for (const row of countRows) {
    const entry = map.get(row.postId)
    if (entry) entry.commentCount = Number(row.count)
  }

  return map
}

export async function commentScores(ids: string[], userId?: string) {
  const map = new Map<string, { score: number; myVote: number }>()
  if (ids.length === 0) return map
  for (const id of ids) map.set(id, { score: 0, myVote: 0 })

  const scoreRows = await db
    .select({ targetId: votes.targetId, score: sql<number>`coalesce(sum(${votes.value}), 0)` })
    .from(votes)
    .where(and(eq(votes.targetType, 'comment'), inArray(votes.targetId, ids)))
    .groupBy(votes.targetId)
  for (const row of scoreRows) {
    const entry = map.get(row.targetId)
    if (entry) entry.score = Number(row.score)
  }

  if (userId) {
    const myRows = await db
      .select({ targetId: votes.targetId, value: votes.value })
      .from(votes)
      .where(and(eq(votes.targetType, 'comment'), eq(votes.userId, userId), inArray(votes.targetId, ids)))
    for (const row of myRows) {
      const entry = map.get(row.targetId)
      if (entry) entry.myVote = row.value
    }
  }

  return map
}

export async function targetScore(targetType: 'post' | 'comment', targetId: string) {
  const [row] = await db
    .select({ score: sql<number>`coalesce(sum(${votes.value}), 0)` })
    .from(votes)
    .where(and(eq(votes.targetType, targetType), eq(votes.targetId, targetId)))
  return Number(row?.score ?? 0)
}

export async function getSessionUser(headers: Headers) {
  const session = await auth.api.getSession({ headers })
  return session?.user ?? null
}

export async function hydratePosts(rows: PostRow[], userId?: string | null): Promise<PostDTO[]> {
  const scores = await postScores(
    rows.map((row) => row.id),
    userId ?? undefined,
  )
  return rows.map((row) => {
    const s = scores.get(row.id) ?? { score: 0, myVote: 0, commentCount: 0 }
    return {
      id: row.id,
      type: row.type,
      title: row.title,
      content: row.content,
      url: row.url,
      createdAt: row.createdAt.toISOString(),
      nestId: row.nestId,
      nestSlug: row.nestSlug,
      nestTitle: row.nestTitle,
      authorId: row.authorId,
      authorName: row.authorName,
      score: s.score,
      commentCount: s.commentCount,
      myVote: s.myVote,
    }
  })
}

export function clampInt(raw: string | undefined, fallback: number, min: number, max: number) {
  const n = raw === undefined ? NaN : Number(raw)
  if (!Number.isFinite(n)) return fallback
  return Math.min(Math.max(Math.trunc(n), min), max)
}
