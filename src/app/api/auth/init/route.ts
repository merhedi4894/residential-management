import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';
import bcrypt from 'bcryptjs';

// POST - Create initial admin user (only works if no users exist)
export async function POST(req: NextRequest) {
  try {
    // Ensure database tables exist before querying
    await ensureTablesExist();

    const { username, password, securityQuestion, securityAnswer } = await req.json();

    if (!username || !password || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ error: 'সব তথ্য দিন' }, { status: 400 });
    }

    // Check if any user already exists
    const existingUser = await db.user.findFirst();
    if (existingUser) {
      return NextResponse.json({ error: 'ইউজার ইতিমধ্যে তৈরি হয়েছে' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const hashedAnswer = await bcrypt.hash(securityAnswer.toLowerCase().trim(), 10);

    const user = await db.user.create({
      data: {
        username,
        password: hashedPassword,
        securityQuestion,
        securityAnswer: hashedAnswer,
        isSetup: true,
      },
    });

    return NextResponse.json({ success: true, message: 'এডমিন ইউজার তৈরি হয়েছে' });
  } catch (error: any) {
    console.error('Init POST error:', error?.message || error);
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
