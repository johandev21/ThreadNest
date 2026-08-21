import { db } from './client'
import { account, comments, memberships, nests, posts, session, user, verification, votes } from './schema'

const now = Date.now()

await db.delete(votes)
await db.delete(comments)
await db.delete(posts)
await db.delete(memberships)
await db.delete(nests)
await db.delete(verification)
await db.delete(session)
await db.delete(account)
await db.delete(user)

const seedUsers = [
  { id: crypto.randomUUID(), name: 'alice', email: 'alice@threadnest.dev' },
  { id: crypto.randomUUID(), name: 'bob', email: 'bob@threadnest.dev' },
  { id: crypto.randomUUID(), name: 'carol', email: 'carol@threadnest.dev' },
].map((u) => ({ ...u, emailVerified: true, createdAt: new Date(now - 30 * 86_400_000), updatedAt: new Date(now) }))

await db.insert(user).values(seedUsers)
const [alice, bob, carol] = seedUsers

const nestRows = await db
  .insert(nests)
  .values([
    { slug: 'bun', title: 'Bun', description: 'All things Bun — the fast all-in-one JavaScript runtime.', creatorId: alice.id, createdAt: new Date(now - 20 * 86_400_000) },
    { slug: 'webdev', title: 'Web Development', description: 'Frontend, backend and everything in between.', creatorId: bob.id, createdAt: new Date(now - 18 * 86_400_000) },
    { slug: 'askthreadnest', title: 'Ask ThreadNest', description: 'Ask questions, get answers from the community.', creatorId: carol.id, createdAt: new Date(now - 15 * 86_400_000) },
    { slug: 'showerthoughts', title: 'Shower Thoughts', description: 'Random musings that arrive at odd moments.', creatorId: alice.id, createdAt: new Date(now - 10 * 86_400_000) },
  ])
  .returning()

const nestBySlug = new Map(nestRows.map((n) => [n.slug, n]))

await db.insert(memberships).values(
  seedUsers.flatMap((u) => nestRows.map((n) => ({ userId: u.id, nestId: n.id }))),
)

const postSeeds = [
  { nestSlug: 'bun', type: 'text', authorId: alice.id, title: 'Bun 1.2 feels instant compared to Node', content: 'Switched our CI to Bun and the test suite went from 90s to 11s. The built-in watch mode alone is worth it.' },
  { nestSlug: 'bun', type: 'link', authorId: bob.id, title: 'Bun docs: built-in SQLite driver', url: 'https://bun.com/docs/api/sqlite' },
  { nestSlug: 'bun', type: 'text', authorId: carol.id, title: 'Migrating a REST API from Express to Elysia', content: 'Wrote up the whole journey: end-to-end types, way less boilerplate, and validation basically for free.' },
  { nestSlug: 'webdev', type: 'text', authorId: bob.id, title: 'Container queries finally changed how I write CSS', content: 'No more component-width hacks with ResizeObserver. Media queries for page layout, containers for components.' },
  { nestSlug: 'webdev', type: 'link', authorId: alice.id, title: 'Drizzle ORM — SQL-like TypeScript ORM', url: 'https://orm.drizzle.team' },
  { nestSlug: 'webdev', type: 'text', authorId: carol.id, title: 'Is anyone else exhausted by the build tool churn?', content: 'Webpack to esbuild to Vite to Turbopack. I just want my bundler to be boring again.' },
  { nestSlug: 'askthreadnest', type: 'text', authorId: bob.id, title: "What's a terminal tool you wish you knew about earlier?", content: 'Mine is fzf. Genuinely changed how I navigate repos.' },
  { nestSlug: 'askthreadnest', type: 'text', authorId: alice.id, title: 'How do you stay focused during long debugging sessions?', content: 'I lose track of time and suddenly it is 2am. Tips welcome.' },
  { nestSlug: 'askthreadnest', type: 'link', authorId: carol.id, title: 'The twelve-factor app, revisited for 2026', url: 'https://12factor.net' },
  { nestSlug: 'showerthoughts', type: 'text', authorId: alice.id, title: 'A map is just a flattened globe', content: 'And somehow we all agreed on where to put the seams.' },
  { nestSlug: 'showerthoughts', type: 'text', authorId: bob.id, title: 'Your phone battery is a progress bar for the day', content: 'Except nobody agrees on what it is progressing towards.' },
  { nestSlug: 'showerthoughts', type: 'link', authorId: carol.id, title: "The word 'noun' is a noun", url: 'https://example.com/noun' },
]

const postRows = await db
  .insert(posts)
  .values(
    postSeeds.map((p, i) => ({
      nestId: nestBySlug.get(p.nestSlug)!.id,
      authorId: p.authorId,
      type: p.type,
      title: p.title,
      content: p.content ?? null,
      url: p.url ?? null,
      createdAt: new Date(now - (i + 1) * 3 * 3_600_000),
    })),
  )
  .returning()

const cid = () => crypto.randomUUID()
const minutesAgo = (m: number) => new Date(now - m * 60_000)

const commentValues: (typeof comments.$inferInsert)[] = []

const c1 = cid()
commentValues.push({ id: c1, postId: postRows[0].id, authorId: bob.id, parentId: null, content: 'Which watch mode — `bun test --watch` or `bun --watch run`?', createdAt: minutesAgo(880) })
const c2 = cid()
commentValues.push({ id: c2, postId: postRows[0].id, authorId: alice.id, parentId: c1, content: 'The latter — it restarts the whole process on file change.', createdAt: minutesAgo(850) })
const c3 = cid()
commentValues.push({ id: c3, postId: postRows[0].id, authorId: carol.id, parentId: c2, content: 'Plus it keeps a warm SQLite connection, so integration tests fly.', createdAt: minutesAgo(820) })
commentValues.push({ id: cid(), postId: postRows[0].id, authorId: carol.id, parentId: null, content: 'Did you measure cold start too? Curious how it compares.', createdAt: minutesAgo(800) })

const c5 = cid()
commentValues.push({ id: c5, postId: postRows[3].id, authorId: carol.id, parentId: null, content: 'Container queries plus :has() removed half of my utility classes.', createdAt: minutesAgo(700) })
commentValues.push({ id: cid(), postId: postRows[3].id, authorId: alice.id, parentId: c5, content: 'Same here. The cascade finally feels usable again.', createdAt: minutesAgo(690) })

const c7 = cid()
commentValues.push({ id: c7, postId: postRows[6].id, authorId: alice.id, parentId: null, content: 'zoxide. It is cd but it guesses where you meant.', createdAt: minutesAgo(500) })
commentValues.push({ id: cid(), postId: postRows[6].id, authorId: bob.id, parentId: c7, content: 'Came here to say zoxide. Pair it with eza and thank me later.', createdAt: minutesAgo(480) })
commentValues.push({ id: cid(), postId: postRows[6].id, authorId: carol.id, parentId: null, content: 'direnv for me — per-project env vars without thinking.', createdAt: minutesAgo(460) })

commentValues.push({ id: cid(), postId: postRows[9].id, authorId: bob.id, parentId: null, content: 'This broke my brain more than it should have.', createdAt: minutesAgo(200) })

const commentRows = await db.insert(comments).values(commentValues).returning()

const voteValues: (typeof votes.$inferInsert)[] = []
postRows.forEach((p, i) => {
  seedUsers.forEach((u, j) => {
    const r = (i * 7 + j * 13 + i * j) % 3
    if (r === 0) return
    voteValues.push({ userId: u.id, targetType: 'post', targetId: p.id, value: r === 1 ? 1 : -1 })
  })
})
commentRows.forEach((c, i) => {
  seedUsers.forEach((u, j) => {
    if (u.id === c.authorId) return
    const r = (i * 5 + j * 11) % 3
    if (r === 0) return
    voteValues.push({ userId: u.id, targetType: 'comment', targetId: c.id, value: r === 1 ? 1 : -1 })
  })
})
await db.insert(votes).values(voteValues)

console.log(`Seeded: ${seedUsers.length} users, ${nestRows.length} nests, ${seedUsers.length * nestRows.length} memberships, ${postRows.length} posts, ${commentRows.length} comments, ${voteValues.length} votes`)
