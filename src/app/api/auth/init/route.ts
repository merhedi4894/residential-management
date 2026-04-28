import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist, getLibsqlClient } from '@/lib/db-init';
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

  const trimmedUsername = username.trim();
  const trimmedQuestion = securityQuestion.trim();

  try {
    // Step 1: Hash credentials in parallel with table check
    const [hashedPassword, hashedAnswer] = await Promise.all([
      bcrypt.hash(password, 10),
      bcrypt.hash(securityAnswer.toLowerCase().trim(), 10),
      ensureTablesExist(),
    ]);

    // Step 2: Try direct SQL approach (more reliable with Turso)
    const client = getLibsqlClient();
    if (client) {
      try {
        // Check if any user already exists
        const existing = await client.execute({
          sql: `SELECT "id", "username" FROM "User" LIMIT 1`,
        });
        if (existing.rows.length > 0) {
          return NextResponse.json({ error: 'ইউজার ইতিমধ্যে তৈরি হয়েছে' }, { status: 400 });
        }

        // Insert user
        const id = crypto.randomUUID();
        await client.execute({
          sql: `INSERT INTO "User" ("id","username","password","securityQuestion","securityAnswer","isSetup","createdAt","updatedAt") VALUES (?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
          args: [id, trimmedUsername, hashedPassword, trimmedQuestion, hashedAnswer],
        });

        return NextResponse.json({ success: true, message: 'এডমিন ইউজার তৈরি হয়েছে' });
      } catch (sqlError: any) {
        console.error('[init] Direct SQL FAILED:', sqlError?.message || sqlError);
        return NextResponse.json({
          error: 'ইউজার তৈরি করতে সমস্যা হয়েছে',
          debug: sqlError?.message || String(sqlError)
        }, { status: 500 });
      }
    }

    // Step 3: Fallback for non-Turso (local SQLite)
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

      return NextResponse.json({ success: true, message: 'এডমিন ইউজার তৈরি হয়েছে' });
    } catch (prismaError: any) {
      console.error('[init] Prisma FAILED:', prismaError?.message || prismaError);
      return NextResponse.json({
        error: 'ইউজার তৈরি করতে সমস্যা হয়েছে',
        debug: prismaError?.message || String(prismaError)
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error('[init] Unexpected error:', error?.message || error);
    return NextResponse.json({
      error: 'ইউজার তৈরি করতে সমস্যা হয়েছে',
      debug: error?.message || String(error)
    }, { status: 500 });
  }
}

// GET - Check if init is needed (no users exist)
export async function GET() {
  try {
    // Fast check: just count users without full table creation
    const client = getLibsqlClient();
    if (client) {
      try {
        const result = await client.execute({ sql: `SELECT COUNT(*) as cnt FROM "User"` });
        return NextResponse.json({ needsInit: (result.rows[0]?.cnt as number) === 0 });
      } catch {
        return NextResponse.json({ needsInit: true });
      }
    }

    // Local fallback
    const userCount = await db.user.count();
    return NextResponse.json({ needsInit: userCount === 0 });
  } catch (error: any) {
    console.error('Init GET error:', error?.message || error);
    return NextResponse.json({ needsInit: true, debug: error?.message || String(error) });
  }
}
