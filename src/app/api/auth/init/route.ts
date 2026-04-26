import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST - Create initial admin user (only works if no users exist)
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'অবৈধ অনুরোধ' }, { status: 400 });
  }

  const { username, password, securityQuestion, securityAnswer } = body;

  if (!username || !password || !securityQuestion || !securityAnswer) {
    return NextResponse.json({ error: 'সব তথ্য দিন' }, { status: 400 });
  }

  // Ensure database tables exist
  await ensureTablesExist();

  // Hash credentials
  const hashedPassword = await bcrypt.hash(password, 10);
  const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);
  const trimmedUsername = username.trim();
  const trimmedQuestion = securityQuestion.trim();

  // Try using direct SQL first (more reliable with Turso)
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('libsql://')) {
    try {
      const { createClient } = await import('@libsql/client');
      const authToken = process.env.TURSO_AUTH_TOKEN || '';
      const config: Record<string, string> = { url };
      if (authToken) config.authToken = authToken;
      const client = createClient(config as any);

      // Check if any user already exists
      const existing = await client.execute({
        sql: `SELECT "id" FROM "User" LIMIT 1`,
      });
      if (existing.rows.length > 0) {
        return NextResponse.json({ error: 'ইউজার ইতিমধ্যে তৈরি হয়েছে' }, { status: 400 });
      }

      const id = crypto.randomUUID();
      await client.execute({
        sql: `INSERT INTO "User" ("id","username","password","securityQuestion","securityAnswer","isSetup","createdAt","updatedAt") VALUES (?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
        args: [id, trimmedUsername, hashedPassword, trimmedQuestion, hashedAnswer],
      });

      console.log('[init] Admin user created via direct SQL');
      return NextResponse.json({ success: true, message: 'এডমিন ইউজার তৈরি হয়েছে' });
    } catch (error: any) {
      console.error('[init] Direct SQL error:', error?.message || error);
      // Fall through to Prisma approach
    }
  }

  // Fallback: Use Prisma ORM
  try {
    const existingUser = await db.user.findFirst();
    if (existingUser) {
      return NextResponse.json({ error: 'ইউজার ইতিমধ্যে তৈরি হয়েছে' }, { status: 400 });
    }

    await db.user.create({
      data: {
        username: trimmedUsername,
        password: hashedPassword,
        securityQuestion: trimmedQuestion,
        securityAnswer: hashedAnswer,
        isSetup: true,
      },
    });

    console.log('[init] Admin user created via Prisma');
    return NextResponse.json({ success: true, message: 'এডমিন ইউজার তৈরি হয়েছে' });
  } catch (error: any) {
    console.error('[init] Prisma create error:', error?.message || error);
    return NextResponse.json({
      error: 'ইউজার তৈরি করতে সমস্যা হয়েছে',
      debug: error?.message || String(error)
    }, { status: 500 });
  }
}

// GET - Check if init is needed (no users exist)
export async function GET() {
  try {
    // Ensure database tables exist before querying
    await ensureTablesExist();

    const userCount = await db.user.count();
    return NextResponse.json({ needsInit: userCount === 0 });
  } catch (error: any) {
    console.error('Init GET error:', error?.message || error);
    return NextResponse.json({ needsInit: true, debug: error?.message || String(error) });
  }
}
