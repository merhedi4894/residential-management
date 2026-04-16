import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    
    // Direct libsql test
    const { createClient } = await import('@libsql/client');
    const client = createClient({ url: databaseUrl });
    const directResult = await client.execute('SELECT 1 as test');
    
    // Prisma adapter test (no datasourceUrl)
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
    const { PrismaClient } = await import('@prisma/client');
    const libsql = createClient({ url: databaseUrl });
    const adapter = new PrismaLibSQL(libsql);
    const prisma = new PrismaClient({ adapter });
    const userCount = await prisma.user.count();
    await prisma.$disconnect();
    
    return NextResponse.json({
      directLibsql: directResult.rows,
      prismaUserCount: userCount,
      success: true,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message.substring(0, 500) : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
