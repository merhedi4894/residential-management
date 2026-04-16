import { PrismaClient } from '@prisma/client'
import { PrismaLibSQL } from '@prisma/adapter-libsql'
import { createClient } from '@libsql/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

function createPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL || ''

  // Turso (libsql) connection — used when DATABASE_URL starts with libsql://
  if (databaseUrl.startsWith('libsql://')) {
    const libsql = createClient({
      url: databaseUrl,
    })
    const adapter = new PrismaLibSQL(libsql)
    return new PrismaClient({
      adapter,
      log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    })
  }

  // Local SQLite fallback — used when DATABASE_URL starts with file:
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })
}

function getDbClient(): PrismaClient {
  // During build time, DATABASE_URL might not be available
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    // Return a minimal client that won't fail during build/static generation
    return new PrismaClient({
      log: ['error'],
      datasourceUrl: 'file:./dev.db',
    })
  }
  return globalForPrisma.prisma ?? createPrismaClient()
}

export const db = getDbClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
