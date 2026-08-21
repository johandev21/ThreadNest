import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { db } from './db/client'

export const auth = betterAuth({
  secret: process.env.BETTER_AUTH_SECRET ?? 'threadnest-dev-secret-do-not-use-in-prod',
  baseURL: process.env.BETTER_AUTH_URL ?? 'http://localhost:3001',
  trustedOrigins: ['http://localhost:3000', 'http://localhost:3001'],
  database: drizzleAdapter(db, { provider: 'sqlite' }),
  emailAndPassword: { enabled: true },
})

export type Session = typeof auth.$Infer.Session
