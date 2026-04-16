import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''
  const authToken = process.env.TURSO_AUTH_TOKEN || ''

  if (databaseUrl.startsWith('libsql://')) {
    try {
      const config: Record<string, string> = { url: databaseUrl }
      // If authToken is provided separately and not already in URL, add it
      if (authToken && !databaseUrl.includes('authToken')) {
        config.authToken = authToken
      }
      console.log('[db] Connecting to Turso:', databaseUrl.replace(/authToken=[^&]+/, 'authToken=***'))
      const adapter = new PrismaLibSQL(config as any)
      return new PrismaClient({
        adapter,
        log: ['error'],
      })
    } catch (err) {
      console.error('[db] Turso adapter failed:', err)
    }
  }

  // Local SQLite fallback
  console.log('[db] Using local SQLite')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
