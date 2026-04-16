import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    
    // Test 1: Direct libsql
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url: databaseUrl });
    const result = await client.execute('SELECT 1 as test');
    
    // Test 2: Prisma with adapter + datasourceUrl override
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
    const { PrismaClient } = await import('@prisma/client');
    const libsql = createClient({ url: databaseUrl });
    const adapter = new PrismaLibSQL(libsql);
    const prisma = new PrismaClient({ 
      adapter,
      datasourceUrl: 'file:/tmp/dummy.db',
    });
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    
    return NextResponse.json({
      directLibsql: result.rows,
      prismaUserCount: userCount,
      dbUrl: databaseUrl.substring(0, 40) + '...',
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg.substring(0, 500) }, { status: 500 });
  }
}
