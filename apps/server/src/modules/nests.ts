import { Elysia, t } from 'elysia'
import { and, desc, eq, sql } from 'drizzle-orm'
import { db } from '../db/client'
import { memberships, nests } from '../db/schema'
import { betterAuthPlugin } from '../plugins/better-auth'

const memberCountSql = sql<number>`(select count(*) from "memberships" where "memberships"."nest_id" = "nests"."id")`
const postCountSql = sql<number>`(select count(*) from "posts" where "posts"."nest_id" = "nests"."id")`

function serializeNest(row: {
  id: string
  slug: string
  title: string
  description: string
  creatorId: string
  createdAt: Date
  memberCount: number | string
  postCount: number | string
}) {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    creatorId: row.creatorId,
    createdAt: row.createdAt.toISOString(),
    memberCount: Number(row.memberCount),
    postCount: Number(row.postCount),
  }
}

export const nestRoutes = new Elysia({ prefix: '/api/nests' })
  .use(betterAuthPlugin)
  .get(
    '/',
    async () => {
      const rows = await db
        .select({
          id: nests.id,
          slug: nests.slug,
          title: nests.title,
          description: nests.description,
          creatorId: nests.creatorId,
          createdAt: nests.createdAt,
          memberCount: memberCountSql,
          postCount: postCountSql,
        })
        .from(nests)
        .orderBy(desc(memberCountSql))
      return rows.map(serializeNest)
    },
  )
  .post(
    '/',
    async ({ body, user, status }) => {
      const [existing] = await db.select({ id: nests.id }).from(nests).where(eq(nests.slug, body.slug))
      if (existing) return status(409, { error: 'Slug taken' })
      try {
        const [nest] = await db
          .insert(nests)
          .values({ slug: body.slug, title: body.title, description: body.description, creatorId: user.id })
          .returning()
        await db.insert(memberships).values({ userId: user.id, nestId: nest.id }).onConflictDoNothing()
        return serializeNest({ ...nest, memberCount: 1, postCount: 0 })
      } catch {
        return status(409, { error: 'Slug taken' })
      }
    },
    {
      auth: true,
      body: t.Object({
        slug: t.String({ pattern: '^[a-z0-9][a-z0-9-]{1,29}$' }),
        title: t.String({ minLength: 1, maxLength: 80 }),
        description: t.String({ minLength: 0, maxLength: 500 }),
      }),
    },
  )
  .get(
    '/:slug',
    async ({ params, status }) => {
      const [row] = await db
        .select({
          id: nests.id,
          slug: nests.slug,
          title: nests.title,
          description: nests.description,
          creatorId: nests.creatorId,
          createdAt: nests.createdAt,
          memberCount: memberCountSql,
          postCount: postCountSql,
        })
        .from(nests)
        .where(eq(nests.slug, params.slug))
      if (!row) return status(404, { error: 'Nest not found' })
      return serializeNest(row)
    },
  )
  .put(
    '/:slug/membership',
    async ({ params, user, status }) => {
      const [nest] = await db.select({ id: nests.id }).from(nests).where(eq(nests.slug, params.slug))
      if (!nest) return status(404, { error: 'Nest not found' })
      await db.insert(memberships).values({ userId: user.id, nestId: nest.id }).onConflictDoNothing()
      return { joined: true }
    },
    { auth: true },
  )
  .delete(
    '/:slug/membership',
    async ({ params, user, status }) => {
      const [nest] = await db.select({ id: nests.id }).from(nests).where(eq(nests.slug, params.slug))
      if (!nest) return status(404, { error: 'Nest not found' })
      await db
        .delete(memberships)
        .where(and(eq(memberships.userId, user.id), eq(memberships.nestId, nest.id)))
      return { joined: false }
    },
    { auth: true },
  )
