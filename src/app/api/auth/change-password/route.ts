import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST - Change password (requires current password)
export async function POST(req: NextRequest) {
  try {
    const { currentPassword, newPassword } = await req.json();
    const sessionToken = req.cookies.get('session_token')?.value;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'বর্তমান ও নতুন পাসওয়ার্ড দিন' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে' }, { status: 400 });
    }

    // Find user by session
    const user = await db.user.findFirst({
      where: { sessionToken },
    });

    if (!user) {
      return NextResponse.json({ error: 'অনুমতি নেই' }, { status: 401 });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'বর্তমান পাসওয়ার্ড ভুল' }, { status: 401 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return NextResponse.json({ success: true, message: 'পাসওয়ার্ড পরিবর্তন হয়েছে' });
  } catch (error) {
    return NextResponse.json({ error: 'পাসওয়ার্ড পরিবর্তন করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
