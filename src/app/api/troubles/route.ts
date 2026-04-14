import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all trouble reports (optionally filter by roomId or status)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const status = searchParams.get('status');
    const roomNumber = searchParams.get('roomNumber');

    const where: Record<string, unknown> = {};
    if (roomId) where.roomId = roomId;
    if (status) where.status = status;
    if (roomNumber) where.roomNumber = roomNumber;

    const reports = await db.troubleReport.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      include: { room: true },
      orderBy: { reportedAt: 'desc' },
    });
    return NextResponse.json(reports);
  } catch (error) {
    return NextResponse.json({ error: 'ট্রাবল রিপোর্ট লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST create trouble report
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { roomNumber, roomId, description, reportedBy } = body;

    const report = await db.troubleReport.create({
      data: {
        roomNumber,
        roomId,
        description,
        reportedBy,
        status: 'পেন্ডিং',
      },
    });

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'ট্রাবল রিপোর্ট তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PATCH resolve trouble report
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, resolutionNote, resolvedBy, newItems } = body;

    const report = await db.troubleReport.update({
      where: { id },
      data: {
        status: status || 'সমাধান হয়েছে',
        resolutionNote,
        resolvedBy,
        resolvedAt: new Date(),
      },
    });

    // Auto-add new inventory items if provided (e.g., new items added during repair)
    if (newItems && newItems.length > 0 && report.roomId) {
      const room = await db.room.findUnique({
        where: { id: report.roomId },
        include: { tenants: { where: { isActive: true } } },
      });

      if (room) {
        const activeTenant = room.tenants[0];
        await db.inventory.createMany({
          data: newItems.map((item: { itemName: string; quantity: number; condition?: string; note?: string }) => ({
            itemName: item.itemName,
            quantity: parseInt(item.quantity),
            condition: item.condition || 'ভালো',
            roomNumber: report.roomNumber,
            tenantId: activeTenant?.id || null,
            roomId: report.roomId,
            note: `ট্রাবল রিপোর্ট থেকে যোগ: ${item.note || ''}`,
          })),
        });
      }
    }

    return NextResponse.json(report);
  } catch (error) {
    return NextResponse.json({ error: 'ট্রাবল রিপোর্ট আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE trouble report
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.troubleReport.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'ট্রাবল রিপোর্ট মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
