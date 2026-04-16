import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const databaseUrl = process.env.DATABASE_URL || '';
    
    // Prisma adapter test with config object (not pre-created client)
    const { PrismaLibSQL } = await import('@prisma/adapter-libsql');
    const { PrismaClient } = await import('@prisma/client');
    const adapter = new PrismaLibSQL({ url: databaseUrl });
    const prisma = new PrismaClient({ adapter });
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({ select: { username: true } });
    await prisma.$disconnect();
    
    return NextResponse.json({
      success: true,
      userCount,
      users,
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message.substring(0, 500) : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
