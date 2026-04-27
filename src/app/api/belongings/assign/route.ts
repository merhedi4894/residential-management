import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';

// POST - Assign belonging templates to all rooms in a building (optimized batch)
export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { buildingId } = await req.json();

    if (!buildingId) {
      return NextResponse.json({ error: 'বিল্ডিং আইডি দরকার' }, { status: 400 });
    }

    // Get templates and floors in parallel
    const [templates, floors] = await Promise.all([
      db.belongingTemplate.findMany({ where: { buildingId } }),
      db.floor.findMany({
        where: { buildingId },
        include: { rooms: true },
      }),
    ]);

    if (templates.length === 0) {
      return NextResponse.json({ error: 'এই বিল্ডিংয়ে কোনো মালামাল টেমপ্লেট নেই' }, { status: 400 });
    }

    const allRooms = floors.flatMap((f) => f.rooms);
    if (allRooms.length === 0) {
      return NextResponse.json({ error: 'এই বিল্ডিংয়ে কোনো রুম নেই' }, { status: 400 });
    }

    // Batch check: Fetch ALL existing inventory items for ALL rooms in ONE query
    const roomIds = allRooms.map((r) => r.id);
    const templateNames = templates.map((t) => t.itemName);

    const existingItems = await db.inventory.findMany({
      where: {
        roomId: { in: roomIds },
        itemName: { in: templateNames },
        tenantId: null,
      },
      select: { id: true, roomId: true, itemName: true },
    });

    // Build a Set of "roomId-itemName" for fast lookup
    const existingKeys = new Set(existingItems.map((i) => `${i.roomId}::${i.itemName}`));

    // Prepare all items to create in one batch
    const itemsToCreate: { itemName: string; quantity: number; condition: string; roomNumber: string; roomId: string; tenantId: null }[] = [];

    for (const room of allRooms) {
      for (const template of templates) {
        const key = `${room.id}::${template.itemName}`;
        if (!existingKeys.has(key)) {
          itemsToCreate.push({
            itemName: template.itemName,
            quantity: template.quantity,
            condition: 'ভালো',
            roomNumber: room.roomNumber,
            roomId: room.id,
            tenantId: null,
          });
        }
      }
    }

    // Create all items in ONE batch operation
    if (itemsToCreate.length > 0) {
      // createMany has a limit in some DBs, so batch by 100
      const BATCH_SIZE = 100;
      for (let i = 0; i < itemsToCreate.length; i += BATCH_SIZE) {
        const batch = itemsToCreate.slice(i, i + BATCH_SIZE);
        await db.inventory.createMany({ data: batch });
      }
    }

    return NextResponse.json({
      success: true,
      assignedCount: itemsToCreate.length,
      roomCount: allRooms.length,
      itemCount: templates.length,
    });
  } catch (error) {
    console.error('Belongings assign error:', error);
    return NextResponse.json({ error: 'মালামাল বণ্টন করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
