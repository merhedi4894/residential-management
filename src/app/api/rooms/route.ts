import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST create room on a floor
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomNumber, floorId } = body;

    const room = await db.room.create({
      data: { roomNumber, floorId },
    });

    return NextResponse.json(room);
  } catch (error) {
    return NextResponse.json({ error: 'রুম তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE room
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.room.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'রুম মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
