import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';

// POST - Verify admin password and delete ALL inventory items from all rooms
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json({ error: 'পাসওয়ার্ড দিন' }, { status: 400 });
    }

    // Get the admin user
    const user = await db.user.findFirst({
      select: { id: true, username: true, password: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'কোনো ইউজার পাওয়া যায়নি' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return NextResponse.json({ error: 'ভুল পাসওয়ার্ড' }, { status: 401 });
    }

    // Count before deleting
    const count = await db.inventory.count();

    // Delete ALL inventory items (both current and previous/disconnected)
    const result = await db.inventory.deleteMany();

    return NextResponse.json({
      success: true,
      deletedCount: result.count,
      message: `${result.count}টি মালামাল মুছে ফেলা হয়েছে`,
    });
  } catch (error) {
    console.error('Clear inventory error:', error);
    return NextResponse.json({ error: 'মালামাল মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
