import { relations, sql } from "drizzle-orm"
import { sqliteTable, text, integer, index, uniqueIndex, primaryKey, type AnySQLiteColumn } from "drizzle-orm/sqlite-core"

export const user = sqliteTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: integer("email_verified", { mode: "boolean" }).default(false).notNull(),
  image: text("image"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).$onUpdate(() => new Date()).notNull(),
})

export const session = sqliteTable("session", {
  id: text("id").primaryKey(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  token: text("token").notNull().unique(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).$onUpdate(() => new Date()).notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
}, (table) => [index("session_userId_idx").on(table.userId)])

export const account = sqliteTable("account", {
  id: text("id").primaryKey(),
  issuer: text("issuer").notNull(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: integer("access_token_expires_at", { mode: "timestamp_ms" }),
  refreshTokenExpiresAt: integer("refresh_token_expires_at", { mode: "timestamp_ms" }),
  scope: text("scope"),
  password: text("password"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).$onUpdate(() => new Date()).notNull(),
}, (table) => [
  uniqueIndex("account_issuer_accountId_uidx").on(table.issuer, table.accountId),
  index("account_userId_idx").on(table.userId),
])

export const verification = sqliteTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: integer("expires_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).$onUpdate(() => new Date()).notNull(),
}, (table) => [index("verification_identifier_idx").on(table.identifier)])

export const nests = sqliteTable("nests", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(''),
  creatorId: text("creator_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
})

export const memberships = sqliteTable("memberships", {
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  nestId: text("nest_id").notNull().references(() => nests.id, { onDelete: "cascade" }),
  joinedAt: integer("joined_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
}, (table) => [primaryKey({ columns: [table.userId, table.nestId] })])

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  nestId: text("nest_id").notNull().references(() => nests.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  title: text("title").notNull(),
  content: text("content"),
  url: text("url"),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
}, (table) => [index("posts_nestId_createdAt_idx").on(table.nestId, table.createdAt)])

export const comments = sqliteTable("comments", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  postId: text("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  parentId: text("parent_id").references((): AnySQLiteColumn => comments.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" }).default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`).notNull(),
}, (table) => [index("comments_postId_idx").on(table.postId)])

export const votes = sqliteTable("votes", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  value: integer("value").notNull(),
}, (table) => [
  uniqueIndex("votes_user_targetType_targetId_uidx").on(table.userId, table.targetType, table.targetId),
  index("votes_targetType_targetId_idx").on(table.targetType, table.targetId),
])

export const nestsRelations = relations(nests, ({ one, many }) => ({
  creator: one(user, { fields: [nests.creatorId], references: [user.id] }),
  posts: many(posts),
  memberships: many(memberships),
}))

export const postsRelations = relations(posts, ({ one, many }) => ({
  nest: one(nests, { fields: [posts.nestId], references: [nests.id] }),
  author: one(user, { fields: [posts.authorId], references: [user.id] }),
  comments: many(comments),
}))

export const commentsRelations = relations(comments, ({ one }) => ({
  post: one(posts, { fields: [comments.postId], references: [posts.id] }),
  author: one(user, { fields: [comments.authorId], references: [user.id] }),
  parent: one(comments, { fields: [comments.parentId], references: [comments.id], relationName: "comment_parent" }),
}))

export const membershipsRelations = relations(memberships, ({ one }) => ({
  user: one(user, { fields: [memberships.userId], references: [user.id] }),
  nest: one(nests, { fields: [memberships.nestId], references: [nests.id] }),
}))

export const votesRelations = relations(votes, ({ one }) => ({
  user: one(user, { fields: [votes.userId], references: [user.id] }),
}))
