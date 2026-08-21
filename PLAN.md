# ThreadNest 🪺

A lightweight Reddit clone. Communities are called **"nests"**, posts live inside nests, threads nest inside posts.

> Workspace note: this folder (`threadnest/`) is self-contained — agent skills live in `.agents/skills/` here, not on the Desktop.

## Stack (verified via Context7 docs)

| Layer      | Tech                                                                 |
| ---------- | -------------------------------------------------------------------- |
| Runtime    | Bun                                                                  |
| Backend    | Elysia.js                                                            |
| Auth       | Better Auth — mounted via `auth.handler`, Drizzle sqlite adapter     |
| Database   | SQLite via Bun's built-in `bun:sqlite` driver                        |
| ORM        | Drizzle ORM — adapter: `drizzle-orm/bun-sqlite`, toolkit: `drizzle-kit` |
| Type safety| `@elysiajs/eden` (Eden Treaty) — end-to-end typed API client          |
| Frontend   | Next.js 16 (App Router)                                              |
| UI         | shadcn/ui — init'd with preset `b6ae1bIS8`, **all** components pre-installed in `components/ui/` |
| Data state | TanStack Query v5                                                    |
| Realtime   | Elysia native WebSockets (`.ws()` endpoints)                          |

### Key API notes from docs

```ts
// Drizzle + bun:sqlite
import { drizzle } from 'drizzle-orm/bun-sqlite'
import { Database } from 'bun:sqlite'
const db = drizzle({ client: new Database('sqlite.db') })

// Better Auth instance (server/auth.ts)
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
})

// Elysia: mount handler + auth macro (official Elysia integration pattern)
const betterAuth = new Elysia({ name: 'better-auth' })
  .mount(auth.handler) // serves /api/auth/*
  .macro({
    auth: {
      async resolve({ status, request: { headers } }) {
        const session = await auth.api.getSession({ headers })
        if (!session) return status(401)
        return { user: session.user, session: session.session }
      }
    }
  })

// Protected route: opt-in via macro flag
new Elysia().use(betterAuth).get('/me', ({ user }) => user, { auth: true })

// Client (Next.js): better-auth/react gives hooks like useSession
import { createAuthClient } from 'better-auth/react'
export const authClient = createAuthClient() // same-origin /api/auth
```

---

## 1. Repository layout (Bun workspaces monorepo)

```
threadnest/
├── package.json              # workspaces: ["apps/*"], scripts
├── PLAN.md
├── .agents/skills/           # find-skills etc. (already installed here)
├── apps/
│   ├── server/               # Elysia.js API
│   │   ├── src/
│   │   │   ├── index.ts          # app assembly + .listen()
│   │   │   ├── auth.ts           # betterAuth() instance (drizzleAdapter, sqlite)
│   │   │   ├── plugins/better-auth.ts  # mount + macro (user/session injection)
│   │   │   ├── db/
│   │   │   │   ├── schema.ts     # better-auth tables + domain tables
│   │   │   │   ├── client.ts     # bun:sqlite + drizzle instance
│   │   │   │   └── seed.ts
│   │   │   ├── modules/          # nests/, posts/, comments/, votes/
│   │   │   └── realtime/hub.ts   # topic registry + broadcast helpers
│   │   ├── drizzle.config.ts
│   │   └── package.json
│   └── web/                  # Next.js App Router
│       ├── app/
│       │   ├── layout.tsx        # Providers (QueryClientProvider)
│       │   ├── page.tsx          # home feed
│       │   ├── n/[slug]/page.tsx # nest page
│       │   ├── p/[id]/page.tsx   # post detail + comments
│       │   ├── login/, register/
│       │   └── submit/page.tsx   # create post
│       ├── components/           # app components (PostCard, VoteButtons, CommentTree...)
│       │   └── ui/               # shadcn components (pre-installed, all of them)
│       ├── lib/
│       │   ├── auth-client.ts    # createAuthClient() from better-auth/react
│       │   ├── api.ts            # treaty<App> client factory
│       │   ├── queries/          # query keys + useQuery/useMutation hooks
│       │   └── realtime.ts       # WS singleton -> patches query cache
│       └── package.json
```

Dev proxy: Next.js rewrites `/api/*` → `http://localhost:3001/api/*` so browser traffic is same-origin — Better Auth cookies work without CORS gymnastics; treaty points at `/api`.

---

## 2. Data model (Drizzle / SQLite)

### Better Auth managed tables (generated)

Generate with `bunx @better-auth/cli generate` → merges into `schema.ts`:

```
user           id, name, email (unique), emailVerified, image, createdAt, updatedAt
session        id, token (unique), userId → user, expiresAt, ipAddress, userAgent
account        id, issuer, accountId, providerId, userId → user, password? (credential)
verification   id, identifier, value, expiresAt
```

### Domain tables (ours, FK → `user.id`)

```
nests        id, slug (unique), title, description, creatorId → user, createdAt
memberships  userId + nestId (composite pk), joinedAt
posts        id, nestId → nests, authorId → user, type ('text'|'link'),
             title, content?, url?, createdAt
comments     id, postId → posts, authorId → user,
             parentId → comments (nullable, self-ref threading),
             content, createdAt
votes        id, userId → user, targetType ('post'|'comment'), targetId, value (-1|+1)
             UNIQUE(userId, targetType, targetId)
```

Scores computed via grouped `SUM(value)` queries — no denormalized counters. Indexes: `posts(nestId, createdAt)`, `comments(postId)`, `votes(targetType, targetId)`.

Migrations: `bunx drizzle-kit generate` + `bunx drizzle-kit migrate`.

---

## 3. API surface

### Auth — handled entirely by Better Auth (mounted at `/api/auth/*`)
- `POST /api/auth/sign-up/email` `{name, email, password}`
- `POST /api/auth/sign-in/email` → sets httpOnly session cookie
- `POST /api/auth/sign-out`
- `GET /api/auth/get-session` → session + user (cookie-cached)

No custom auth routes to write or secure. Server routes declare `{ auth: true }` (the macro) to require a session and receive `user` in context.

### Nests
- `GET /nests` — list w/ member & post counts
- `POST /nests` `{slug, title, description}` (auth)
- `GET /nests/:slug`
- `PUT/DELETE /nests/:slug/membership` — join/leave (auth)

### Posts
- `GET /posts?sort=new|top|hot&nest=slug&cursor=` — paginated feed
- `POST /posts` `{nestSlug, type, title, content?, url?}` (auth)
- `GET /posts/:id` — post + author + caller's vote state
- `DELETE /posts/:id` (author only)

### Comments
- `GET /posts/:id/comments` — flat list; tree assembled client-side
- `POST /posts/:id/comments` `{content, parentId?}` (auth)
- `DELETE /comments/:id` (author only)

### Votes
- `PUT /votes` `{targetType, targetId, value: 1|-1}` (auth, upsert)
- `DELETE /votes` `{targetType, targetId}` (auth)

### Realtime
- `WS /realtime?topics=post:<id>,nest:<slug>`
- Envelope: `{ event: 'post:new' | 'comment:new' | 'vote:update', topic, payload }`
- Hub keeps `Map<topic, Set<ws>>`; services call `hub.publish(...)` after commit.

---

## 4. Frontend auth & data flow

- **UI**: build exclusively from pre-installed shadcn components (`@/components/ui/*`) — Button, Card, Input, Textarea, Avatar, Badge, Tabs, DropdownMenu, Dialog, Skeleton, etc. Follow the official shadcn skill (`.agents/skills/shadcn/SKILL.md`) for composition patterns. `TooltipProvider` wraps the app in the root layout.
- `lib/auth-client.ts`: `createAuthClient()` from `better-auth/react` — `useSession()` hook drives header UI (login/logout), login/register pages call `authClient.signIn.email()` / `signUp.email()`.
- TanStack Query handles all *domain* data (nests/posts/comments/votes); Better Auth's own hooks handle session state — no duplication.
- Optimistic mutations per TanStack Query v5 pattern: `onMutate` cancelQueries → snapshot → setQueryData → rollback onError → invalidate onSettled.
- SSR: prefetch home feed in server component + `HydrationBoundary` (staleTime > 0).

## 5. Realtime ↔ TanStack Query bridge

1. `lib/realtime.ts`: lazy WebSocket singleton managing topics + auto-reconnect.
2. On message, targeted cache patches:
   - `comment:new` → append to `['posts', id, 'comments']`
   - `vote:update` → adjust `score` in cached post/list objects
   - `post:new` → prepend to `['posts', 'feed', sort]`
3. WS connection is public; events carry no private data.

---

## 6. Build phases

| Phase | Deliverable | Done when |
| ----- | ----------- | --------- |
| 0 | Monorepo scaffold | `bun install` works, both apps boot, `/api/health` reachable via proxy |
| 1 | DB layer | better-auth tables generated + domain schema committed, migrations run, seed script works |
| 2 | Better Auth | sign-up/sign-in/sign-out work through mounted handler; `{ auth: true }` macro rejects anonymous writes with 401 |
| 3 | Nests | create/join/list nests through typed Eden client |
| 4 | Posts | feed with sort + cursor pagination, create/delete post |
| 5 | Comments | threaded display, create/delete |
| 6 | Votes | up/down toggling, scores correct everywhere |
| 7 | Realtime | two browsers see new comments/votes without refresh |
| 8 | Frontend polish | optimistic votes, loading/error states, responsive-ish layout |
| 9 | Hardening | rate-limit plugin on votes/posts, input length limits, consistent error envelope |

## 7. Explicit non-goals (v1)

No image uploads, no user profiles, no mod tools, no search, no DMs, no email verification flows, no OAuth providers (email/password only for now — Better Auth makes adding social login trivial later).
