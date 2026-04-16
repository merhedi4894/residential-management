import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''

  // Turso (libsql) connection — only when DATABASE_URL starts with libsql://
  if (databaseUrl.startsWith('libsql://')) {
    try {
      const libsql = createClient({ url: databaseUrl })
      const adapter = new PrismaLibSQL(libsql)
      return new PrismaClient({
        adapter,
        log: ['error'],
      })
    } catch (err) {
      // Build-time fallback: ignore connection errors during static generation
      console.warn('[db] Turso connection failed during build, using fallback')
    }
  }

  // SQLite fallback — safe for build-time and local dev
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
