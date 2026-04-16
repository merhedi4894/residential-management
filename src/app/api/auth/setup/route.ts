import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST - Security setup (change username, password, security question)
// Body: { currentUsername, newUsername, newPassword, securityQuestion, securityAnswer }
export async function POST(req: NextRequest) {
  try {
    const { currentUsername, newUsername, newPassword, securityQuestion, securityAnswer } = await req.json();

    if (!currentUsername || !newUsername || !newPassword || !securityQuestion || !securityAnswer) {
      return NextResponse.json({ error: 'সব তথ্য দিন' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' }, { status: 400 });
    }

    // Find user by current username
    const user = await db.user.findUnique({
      where: { username: currentUsername },
    });

    if (!user) {
      return NextResponse.json({ error: 'ইউজার পাওয়া যায়নি' }, { status: 404 });
    }

    // Check if new username is already taken (by another user)
    if (newUsername !== currentUsername) {
      const existingUser = await db.user.findUnique({
        where: { username: newUsername },
      });
      if (existingUser) {
        return NextResponse.json({ error: 'এই ইউজারনেম আগে থেকেই আছে' }, { status: 400 });
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Generate new session token
    const sessionToken = crypto.randomBytes(32).toString('hex');

    // Update user
    const updatedUser = await db.user.update({
      where: { id: user.id },
      data: {
        username: newUsername,
        password: hashedPassword,
        securityQuestion,
        securityAnswer,
        isSetup: true,
        sessionToken,
      },
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: { id: updatedUser.id, username: updatedUser.username },
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
    console.error('Setup error:', error);
    return NextResponse.json({ error: 'সেটআপ করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
