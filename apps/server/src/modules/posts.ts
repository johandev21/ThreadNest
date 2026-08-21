import { Elysia, t } from 'elysia'
import { desc, eq } from 'drizzle-orm'
import { db } from '../db/client'
import { nests, posts, user } from '../db/schema'
import { betterAuthPlugin } from '../plugins/better-auth'
import { clampInt, getSessionUser, hydratePosts } from './helpers'
import { publish } from '../realtime/hub'

function hotScore(post: { score: number; createdAt: string }, now: number) {
  const hoursAge = (now - Date.parse(post.createdAt)) / 3_600_000
  return post.score / Math.pow(hoursAge + 2, 1.5)
}

const postSelection = {
  id: posts.id,
  type: posts.type,
  title: posts.title,
  content: posts.content,
  url: posts.url,
  createdAt: posts.createdAt,
  nestId: posts.nestId,
  nestSlug: nests.slug,
  nestTitle: nests.title,
  authorId: posts.authorId,
  authorName: user.name,
}

export const postRoutes = new Elysia({ prefix: '/api/posts' })
  .use(betterAuthPlugin)
  .get(
    '/',
    async ({ query, request }) => {
      const sort = query.sort ?? 'hot'
      const limit = clampInt(query.limit, 20, 1, 50)
      const cursor = clampInt(query.cursor, 0, 0, Number.MAX_SAFE_INTEGER)
      const viewer = await getSessionUser(request.headers)

      const fetchLimit = sort === 'new' ? limit + 1 : limit * 3
      const rows = await db
        .select(postSelection)
        .from(posts)
        .innerJoin(nests, eq(posts.nestId, nests.id))
        .innerJoin(user, eq(posts.authorId, user.id))
        .where(query.nest ? eq(nests.slug, query.nest) : undefined)
        .orderBy(desc(posts.createdAt))
        .limit(fetchLimit)
        .offset(cursor)

      const hydrated = await hydratePosts(rows, viewer?.id)
      let ranked = hydrated
      if (sort === 'top') {
        ranked = [...hydrated].sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt))
      } else if (sort === 'hot') {
        const now = Date.now()
        ranked = [...hydrated].sort((a, b) => hotScore(b, now) - hotScore(a, now))
      }

      const items = ranked.slice(0, limit)
      return { items, nextCursor: ranked.length > limit ? cursor + limit : null }
    },
    {
      query: t.Object({
        sort: t.Optional(t.Union([t.Literal('hot'), t.Literal('new'), t.Literal('top')])),
        nest: t.Optional(t.String()),
        cursor: t.Optional(t.String()),
        limit: t.Optional(t.String()),
      }),
    },
  )
  .post(
    '/',
    async ({ body, user, status }) => {
      const [nest] = await db.select().from(nests).where(eq(nests.slug, body.nestSlug))
      if (!nest) return status(404, { error: 'Nest not found' })
      if (body.type === 'link') {
        if (!body.url) return status(400, { error: 'Link posts require a url' })
        try {
          new URL(body.url)
        } catch {
          return status(400, { error: 'Invalid url' })
        }
      }
      const [created] = await db
        .insert(posts)
        .values({
          nestId: nest.id,
          authorId: user.id,
          type: body.type,
          title: body.title,
          content: body.type === 'text' ? body.content ?? null : null,
          url: body.type === 'link' ? body.url ?? null : null,
        })
        .returning()
      const [hydrated] = await hydratePosts(
        [{ ...created, nestSlug: nest.slug, nestTitle: nest.title, authorName: user.name }],
        user.id,
      )
      publish(`nest:${nest.slug}`, 'post:new', hydrated)
      return hydrated
    },
    {
      auth: true,
      body: t.Object({
        nestSlug: t.String(),
        type: t.Union([t.Literal('text'), t.Literal('link')]),
        title: t.String({ minLength: 1, maxLength: 300 }),
        content: t.Optional(t.String({ maxLength: 20000 })),
        url: t.Optional(t.String()),
      }),
    },
  )
  .get(
    '/:id',
    async ({ params, request, status }) => {
      const viewer = await getSessionUser(request.headers)
      const [row] = await db
        .select(postSelection)
        .from(posts)
        .innerJoin(nests, eq(posts.nestId, nests.id))
        .innerJoin(user, eq(posts.authorId, user.id))
        .where(eq(posts.id, params.id))
      if (!row) return status(404, { error: 'Post not found' })
      const [hydrated] = await hydratePosts([row], viewer?.id)
      return hydrated
    },
  )
  .delete(
    '/:id',
    async ({ params, user, status }) => {
      const [post] = await db.select({ id: posts.id, authorId: posts.authorId }).from(posts).where(eq(posts.id, params.id))
      if (!post) return status(404, { error: 'Post not found' })
      if (post.authorId !== user.id) return status(403, { error: 'Forbidden' })
      await db.delete(posts).where(eq(posts.id, params.id))
      return { ok: true }
    },
    { auth: true },
  )
