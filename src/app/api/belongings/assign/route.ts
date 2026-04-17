import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';

// POST - Assign belonging templates to all rooms in a building
export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { buildingId } = await req.json();

    if (!buildingId) {
      return NextResponse.json({ error: 'বিল্ডিং আইডি দরকার' }, { status: 400 });
    }

    // Get all belonging templates for this building
    const templates = await db.belongingTemplate.findMany({
      where: { buildingId },
    });

    if (templates.length === 0) {
      return NextResponse.json({ error: 'এই বিল্ডিংয়ে কোনো মালামাল টেমপ্লেট নেই' }, { status: 400 });
    }

    // Get all rooms in this building
    const floors = await db.floor.findMany({
      where: { buildingId },
      include: { rooms: true },
    });

    const allRooms = floors.flatMap((f) => f.rooms);
    if (allRooms.length === 0) {
      return NextResponse.json({ error: 'এই বিল্ডিংয়ে কোনো রুম নেই' }, { status: 400 });
    }

    let assignedCount = 0;

    // For each room, create inventory items from templates
    for (const room of allRooms) {
      for (const template of templates) {
        // Check if this item already exists for this room (without tenant)
        const existing = await db.inventory.findFirst({
          where: {
            roomId: room.id,
            itemName: template.itemName,
            tenantId: null,
          },
        });

        if (!existing) {
          await db.inventory.create({
            data: {
              itemName: template.itemName,
              quantity: template.quantity,
              condition: 'ভালো',
              roomNumber: room.roomNumber,
              roomId: room.id,
              tenantId: null,
            },
          });
          assignedCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      assignedCount,
      roomCount: allRooms.length,
      itemCount: templates.length,
    });
  } catch (error) {
    console.error('Belongings assign error:', error);
    return NextResponse.json({ error: 'মালামাল বণ্টন করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
