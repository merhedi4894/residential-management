import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

function getLibsqlConfig(): { url: string; authToken?: string } | null {
  const databaseUrl = process.env.DATABASE_URL || '';
  const authToken = process.env.TURSO_AUTH_TOKEN || '';
  if (!databaseUrl.startsWith('libsql://')) return null;
  const config: { url: string; authToken?: string } = { url: databaseUrl };
  if (authToken && !databaseUrl.includes('authToken')) {
    config.authToken = authToken;
  }
  return config;
}

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
    // Step 1: Ensure database tables exist
    const tablesOk = await ensureTablesExist();
    console.log('[init] ensureTablesExist returned:', tablesOk);

    // Step 2: Hash credentials
    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

    // Step 3: Try direct SQL approach (more reliable with Turso)
    const libsqlConfig = getLibsqlConfig();
    if (libsqlConfig) {
      try {
        const { createClient } = await import('@libsql/client');
        const client = createClient(libsqlConfig as any);

        // Verify connection works
        const testResult = await client.execute(`SELECT 1 as test`);
        console.log('[init] SQL connection test OK, rows:', testResult.rows.length);

        // Check if any user already exists
        const existing = await client.execute({
          sql: `SELECT "id", "username" FROM "User" LIMIT 1`,
        });
        console.log('[init] Existing users check:', existing.rows.length);
        if (existing.rows.length > 0) {
          return NextResponse.json({ error: 'ইউজার ইতিমধ্যে তৈরি হয়েছে' }, { status: 400 });
        }

        // Check if User table exists
        const tableCheck = await client.execute({
          sql: `SELECT name FROM sqlite_master WHERE type='table' AND name='User'`,
        });
        if (tableCheck.rows.length === 0) {
          console.error('[init] User table does not exist in database!');
          // Try to create it manually
          await client.execute(`CREATE TABLE IF NOT EXISTS "User" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "username" TEXT NOT NULL,
            "password" TEXT NOT NULL,
            "securityQuestion" TEXT NOT NULL,
            "securityAnswer" TEXT NOT NULL,
            "sessionToken" TEXT,
            "isSetup" BOOLEAN NOT NULL DEFAULT 1,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
          )`);
          await client.execute(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`);
          console.log('[init] Manually created User table');
        }

        // Check table structure
        const colInfo = await client.execute({ sql: `PRAGMA table_info("User")` });
        console.log('[init] User table columns:', colInfo.rows.map((r: any) => r.name));

        // Insert user with explicit CURRENT_TIMESTAMP
        const id = crypto.randomUUID();
        await client.execute({
          sql: `INSERT INTO "User" ("id","username","password","securityQuestion","securityAnswer","isSetup","createdAt","updatedAt") VALUES (?,?,?,?,?,1,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP)`,
          args: [id, trimmedUsername, hashedPassword, trimmedQuestion, hashedAnswer],
        });

        console.log('[init] Admin user created successfully via SQL, id:', id);
        return NextResponse.json({ success: true, message: 'এডমিন ইউজার তৈরি হয়েছে' });
      } catch (sqlError: any) {
        console.error('[init] Direct SQL FAILED:', sqlError?.message || sqlError);
        // Don't fall through - return the actual error so we can debug
        return NextResponse.json({
          error: 'ইউজার তৈরি করতে সমস্যা হয়েছে',
          debug: sqlError?.message || String(sqlError)
        }, { status: 500 });
      }
    }

    // Step 4: Fallback for non-Turso (local SQLite)
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

      console.log('[init] Admin user created via Prisma (local)');
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
    await ensureTablesExist();

    const userCount = await db.user.count();
    return NextResponse.json({ needsInit: userCount === 0 });
  } catch (error: any) {
    console.error('Init GET error:', error?.message || error);
    return NextResponse.json({ needsInit: true, debug: error?.message || String(error) });
  }
}
