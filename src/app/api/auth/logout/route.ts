import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Logout (clear session)
export async function POST(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (sessionToken) {
      await db.user.updateMany({
        where: { sessionToken },
        data: { sessionToken: null },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.set('session_token', '', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch {
    return NextResponse.json({ error: 'লগআউট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
