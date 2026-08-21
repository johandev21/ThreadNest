import { Elysia } from 'elysia'
import { betterAuthPlugin } from './plugins/better-auth'
import { nestRoutes } from './modules/nests'
import { postRoutes } from './modules/posts'
import { commentRoutes } from './modules/comments'
import { voteRoutes } from './modules/votes'
import { realtimeRoutes } from './realtime/hub'

const app = new Elysia()
  .get('/api/health', () => ({ ok: true }))
  .use(betterAuthPlugin)
  .use(nestRoutes)
  .use(postRoutes)
  .use(commentRoutes)
  .use(voteRoutes)
  .use(realtimeRoutes)
  .listen(3001)

console.log(`🦊 ThreadNest API on ${app.server?.port}`)

export type App = typeof app
