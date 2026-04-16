import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Direct test of libsql client
    const { createClient } = await import('@libsql/client');
    const databaseUrl = process.env.DATABASE_URL || '';
    
    const client = createClient({ url: databaseUrl });
    const result = await client.execute('SELECT 1 as test');
    
    // Test Prisma adapter
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
    const libsql = createClient({ url: databaseUrl });
    const adapter = new PrismaLibSQL(libsql);
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient({ adapter });
    const userCount = await prisma.user.count();
    
    return NextResponse.json({
      directLibsql: result.rows,
      prismaUserCount: userCount,
      dbUrl: databaseUrl.substring(0, 40) + '...',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message + '\n' + err.stack : String(err);
    return NextResponse.json({ error: msg.substring(0, 1000) }, { status: 500 });
  }
}
