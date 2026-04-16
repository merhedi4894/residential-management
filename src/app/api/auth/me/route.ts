import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET - Check current session
export async function GET(req: NextRequest) {
  try {
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const user = await db.user.findFirst({
      where: { sessionToken },
      select: { id: true, username: true, isSetup: true },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: { id: user.id, username: user.username },
      needsSetup: !user.isSetup,
    });
  } catch {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
