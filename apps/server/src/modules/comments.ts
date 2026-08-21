import { Elysia, t } from 'elysia'
import { asc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { comments, posts, user } from '../db/schema'
import { betterAuthPlugin } from '../plugins/better-auth'
import { commentScores, getSessionUser } from './helpers'
import { publish } from '../realtime/hub'

export const commentRoutes = new Elysia({ name: 'comments' })
  .use(betterAuthPlugin)
  .get(
    '/api/posts/:id/comments',
    async ({ params, request, status }) => {
      const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, params.id))
      if (!post) return status(404, { error: 'Post not found' })
      const viewer = await getSessionUser(request.headers)
      const rows = await db
        .select({
          id: comments.id,
          postId: comments.postId,
          parentId: comments.parentId,
          content: comments.content,
          createdAt: comments.createdAt,
          authorId: comments.authorId,
          authorName: user.name,
        })
        .from(comments)
        .innerJoin(user, eq(comments.authorId, user.id))
        .where(eq(comments.postId, params.id))
        .orderBy(asc(comments.createdAt))
      const scores = await commentScores(
        rows.map((row) => row.id),
        viewer?.id,
      )
      return rows.map((row) => {
        const s = scores.get(row.id) ?? { score: 0, myVote: 0 }
        return {
          id: row.id,
          postId: row.postId,
          parentId: row.parentId,
          content: row.content,
          createdAt: row.createdAt.toISOString(),
          authorId: row.authorId,
          authorName: row.authorName,
          score: s.score,
          myVote: s.myVote,
        }
      })
    },
  )
  .post(
    '/api/posts/:id/comments',
    async ({ params, body, user, status }) => {
      const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.id, params.id))
      if (!post) return status(404, { error: 'Post not found' })
      if (body.parentId) {
        const [parent] = await db
          .select({ postId: comments.postId })
          .from(comments)
          .where(eq(comments.id, body.parentId))
        if (!parent) return status(400, { error: 'Parent comment not found' })
        if (parent.postId !== params.id) return status(400, { error: 'Parent comment belongs to another post' })
      }
      const [created] = await db
        .insert(comments)
        .values({ postId: params.id, authorId: user.id, parentId: body.parentId ?? null, content: body.content })
        .returning()
      const scores = await commentScores([created.id], user.id)
      const s = scores.get(created.id) ?? { score: 0, myVote: 0 }
      const hydrated = {
        id: created.id,
        postId: created.postId,
        parentId: created.parentId,
        content: created.content,
        createdAt: created.createdAt.toISOString(),
        authorId: created.authorId,
        authorName: user.name,
        score: s.score,
        myVote: s.myVote,
      }
      publish(`post:${params.id}`, 'comment:new', hydrated)
      return hydrated
    },
    {
      auth: true,
      body: t.Object({
        content: t.String({ minLength: 1, maxLength: 10000 }),
        parentId: t.Optional(t.String()),
      }),
    },
  )
  .delete(
    '/api/comments/:id',
    async ({ params, user, status }) => {
      const [comment] = await db.select({ id: comments.id, authorId: comments.authorId }).from(comments).where(eq(comments.id, params.id))
      if (!comment) return status(404, { error: 'Comment not found' })
      if (comment.authorId !== user.id) return status(403, { error: 'Forbidden' })
      await db.delete(comments).where(eq(comments.id, params.id))
      return { ok: true }
    },
    { auth: true },
  )
