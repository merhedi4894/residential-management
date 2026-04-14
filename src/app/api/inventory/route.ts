import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all inventory (optionally filter by roomId or tenantId)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const tenantId = searchParams.get('tenantId');
    const roomNumber = searchParams.get('roomNumber');

    const where: Record<string, unknown> = {};
    if (roomId) where.roomId = roomId;
    if (tenantId) where.tenantId = tenantId;
    if (roomNumber) where.roomNumber = roomNumber;

    const inventory = await db.inventory.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { tenant: true, room: true },
      orderBy: { addedDate: 'desc' },
    });
    return NextResponse.json(inventory);
  } catch (error) {
    return NextResponse.json({ error: 'ইনভেন্টরি লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST add inventory item
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { itemName, quantity, condition, roomNumber, tenantId, roomId, note } = body;

    const item = await db.inventory.create({
      data: {
        itemName,
        quantity: parseInt(quantity),
        condition: condition || 'ভালো',
        roomNumber,
        tenantId: tenantId || null,
        roomId,
        note: note || null,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'মালামাল যোগ করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PATCH update inventory item
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, itemName, quantity, condition, note } = body;

    const item = await db.inventory.update({
      where: { id },
      data: {
        ...(itemName && { itemName }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) }),
        ...(condition && { condition }),
        ...(note !== undefined && { note }),
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'ইনভেন্টরি আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE inventory item
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.inventory.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'মালামাল মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
