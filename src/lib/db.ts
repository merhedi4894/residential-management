import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient(): PrismaClient {
  const databaseUrl = process.env.DATABASE_URL || ''
  console.log('[db] DATABASE_URL:', databaseUrl ? databaseUrl.substring(0, 40) + '...' : 'EMPTY/UNDEFINED')
  console.log('[db] NODE_ENV:', process.env.NODE_ENV)

  // Turso (libsql) connection
  if (databaseUrl.startsWith('libsql://')) {
    try {
      const libsql = createClient({ url: databaseUrl })
      const adapter = new PrismaLibSQL(libsql)
      console.log('[db] Using Turso adapter successfully')
      return new PrismaClient({
        adapter,
        log: ['error'],
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[db] Turso connection failed:', msg)
    }
  }

  // SQLite fallback
  console.log('[db] Using SQLite fallback')
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

export const db: PrismaClient =
  globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
