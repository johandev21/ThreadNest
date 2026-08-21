import { Elysia, t } from 'elysia'
import { and, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { comments, nests, posts, votes } from '../db/schema'
import { betterAuthPlugin } from '../plugins/better-auth'
import { targetScore } from './helpers'
import { publish } from '../realtime/hub'

const voteBody = t.Object({
  targetType: t.Union([t.Literal('post'), t.Literal('comment')]),
  targetId: t.String(),
})

export const voteRoutes = new Elysia({ prefix: '/api/votes' })
  .use(betterAuthPlugin)
  .put(
    '/',
    async ({ body, user, status }) => {
      const { targetType, targetId, value } = body
      let postId = targetId
      let nestSlug: string | undefined

      if (targetType === 'post') {
        const [post] = await db
          .select({ id: posts.id, nestSlug: nests.slug })
          .from(posts)
          .innerJoin(nests, eq(posts.nestId, nests.id))
          .where(eq(posts.id, targetId))
        if (!post) return status(404, { error: 'Post not found' })
        postId = post.id
        nestSlug = post.nestSlug
      } else {
        const [comment] = await db.select({ id: comments.id, postId: comments.postId }).from(comments).where(eq(comments.id, targetId))
        if (!comment) return status(404, { error: 'Comment not found' })
        postId = comment.postId
      }

      const [existing] = await db
        .select({ id: votes.id })
        .from(votes)
        .where(and(eq(votes.userId, user.id), eq(votes.targetType, targetType), eq(votes.targetId, targetId)))
      if (existing) {
        await db.update(votes).set({ value }).where(eq(votes.id, existing.id))
      } else {
        await db.insert(votes).values({ userId: user.id, targetType, targetId, value })
      }

      const score = await targetScore(targetType, targetId)
      const payload = { targetType, targetId, score }
      publish(`post:${postId}`, 'vote:update', payload)
      if (targetType === 'post' && nestSlug) publish(`nest:${nestSlug}`, 'vote:update', payload)
      return { score, myVote: value }
    },
    {
      auth: true,
      body: t.Object({
        targetType: t.Union([t.Literal('post'), t.Literal('comment')]),
        targetId: t.String(),
        value: t.Union([t.Literal(1), t.Literal(-1)]),
      }),
    },
  )
  .delete(
    '/',
    async ({ body, user, status }) => {
      const { targetType, targetId } = body
      let postId = targetId
      let nestSlug: string | undefined

      if (targetType === 'post') {
        const [post] = await db
          .select({ id: posts.id, nestSlug: nests.slug })
          .from(posts)
          .innerJoin(nests, eq(posts.nestId, nests.id))
          .where(eq(posts.id, targetId))
        if (!post) return status(404, { error: 'Post not found' })
        postId = post.id
        nestSlug = post.nestSlug
      } else {
        const [comment] = await db.select({ id: comments.id, postId: comments.postId }).from(comments).where(eq(comments.id, targetId))
        if (!comment) return status(404, { error: 'Comment not found' })
        postId = comment.postId
      }

      await db
        .delete(votes)
        .where(and(eq(votes.userId, user.id), eq(votes.targetType, targetType), eq(votes.targetId, targetId)))

      const score = await targetScore(targetType, targetId)
      const payload = { targetType, targetId, score }
      publish(`post:${postId}`, 'vote:update', payload)
      if (targetType === 'post' && nestSlug) publish(`nest:${nestSlug}`, 'vote:update', payload)
      return { score, myVote: 0 }
    },
    { auth: true, body: voteBody },
  )
