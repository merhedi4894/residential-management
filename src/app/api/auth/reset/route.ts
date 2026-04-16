import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';
import bcrypt from 'bcryptjs';

// DELETE - Reset all users (create mehedi4894 with default credentials)
export async function DELETE() {
  try {
    await ensureTablesExist();
    
    // Delete all existing users
    const count = await db.user.count();
    if (count > 0) {
      await db.user.deleteMany({});
    }
    
    // Create mehedi4894 with default credentials
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    const hashedAnswer = await bcrypt.hash('সবুজ', 10);
    
    await db.user.create({
      data: {
        username: 'mehedi4894',
        password: hashedPassword,
        securityQuestion: 'প্রিয় রং কি?',
        securityAnswer: hashedAnswer,
        isSetup: true,
      },
    });
    
    return NextResponse.json({ success: true, message: 'ইউজার রিসেট হয়েছে: mehedi4894' });
  } catch (error: any) {
    console.error('Reset error:', error?.message || error);
    return NextResponse.json({ error: 'রিসেট করতে সমস্যা', debug: error?.message }, { status: 500 });
  }
}
