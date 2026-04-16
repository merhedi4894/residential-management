import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

// POST - Recover password using security question
export async function POST(req: NextRequest) {
  try {
    const { username, securityAnswer, newPassword } = await req.json();

    if (!username || !securityAnswer || !newPassword) {
      return NextResponse.json({ error: 'সব তথ্য দিন' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json({ error: 'ইউজারনেম পাওয়া যায়নি' }, { status: 404 });
    }

    // Verify security answer
    const isValidAnswer = await bcrypt.compare(
      securityAnswer.toLowerCase().trim(),
      user.securityAnswer
    );

    if (!isValidAnswer) {
      return NextResponse.json({ error: 'নিরাপত্তা প্রশ্নের উত্তর ভুল' }, { status: 401 });
    }

    // Update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const sessionToken = crypto.randomBytes(32).toString('hex');

    await db.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        sessionToken,
      },
    });

    // Set cookie so user is logged in after recovery
    const response = NextResponse.json({
      success: true,
      message: 'পাসওয়ার্ড পুনরুদ্ধার সফল হয়েছে',
    });

    response.cookies.set('session_token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'পাসওয়ার্ড পুনরুদ্ধার করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// GET - Get security question for a username
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'ইউজারনেম দিন' }, { status: 400 });
    }

    const user = await db.user.findUnique({
      where: { username },
      select: { securityQuestion: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'ইউজারনেম পাওয়া যায়নি' }, { status: 404 });
    }

    return NextResponse.json({ securityQuestion: user.securityQuestion });
  } catch {
    return NextResponse.json({ error: 'তথ্য পেতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
