import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST - Login with username and password
export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json({ error: 'ইউজারনেম ও পাসওয়ার্ড দিন' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'ভুল ইউজারনেম বা পাসওয়ার্ড' }, { status: 401 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'ভুল ইউজারনেম বা পাসওয়ার্ড' }, { status: 401 });
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Store session token
    await db.user.update({
      where: { id: user.id },
      data: { sessionToken },
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: { id: user.id, username: user.username },
      needsSetup: !user.isSetup,
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'লগইন করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
