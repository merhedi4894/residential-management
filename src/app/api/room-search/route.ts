import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET /api/room-search?roomId=xxx
// Returns current tenant, previous tenants, current inventory, previous inventory for a room
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

    if (!roomId) {
      return NextResponse.json({ error: 'রুম আইডি দিন' }, { status: 400 });
    }

    // Parallelize all 3 queries — they all only depend on URL param roomId
    const [room, allTenants, allInventory] = await Promise.all([
      db.room.findUnique({
        where: { id: roomId },
        include: {
          floor: {
            include: { building: true },
          },
        },
      }),
      db.tenant.findMany({
        where: { roomId },
        orderBy: { createdAt: 'desc' },
      }),
      db.inventory.findMany({
        where: { roomId },
        include: { tenant: { select: { id: true, name: true } } },
        orderBy: { addedDate: 'desc' },
      }),
    ]);

    if (!room) {
      return NextResponse.json({ error: 'রুম পাওয়া যায়নি' }, { status: 404 });
    }

    // Separate current (active) and previous (inactive) tenants
    const currentTenant = allTenants.find((t) => t.isActive) || null;
    const previousTenants = allTenants.filter((t) => !t.isActive);

    // Separate current and previous inventory
    let currentInventory: typeof allInventory = [];
    let previousInventory: typeof allInventory = [];

    if (currentTenant) {
      currentInventory = allInventory.filter((inv) => inv.tenantId === currentTenant.id);
      previousInventory = allInventory.filter((inv) => inv.tenantId !== currentTenant.id && inv.tenantId !== null);
    } else if (allTenants.length > 0) {
      const latestTenant = allTenants[0];
      currentInventory = allInventory.filter((inv) => inv.tenantId === latestTenant.id);
      previousInventory = allInventory.filter((inv) => inv.tenantId !== latestTenant.id && inv.tenantId !== null);
    } else {
      currentInventory = allInventory.filter((inv) => !inv.tenantId);
      previousInventory = [];
    }

    return NextResponse.json({
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        buildingName: room.floor.building.name,
        floorNumber: room.floor.floorNumber,
      },
      currentTenant: currentTenant
        ? {
            id: currentTenant.id,
            name: currentTenant.name,
            phone: currentTenant.phone,
            startDate: currentTenant.startDate,
            endDate: currentTenant.endDate,
            isActive: currentTenant.isActive,
          }
        : null,
      previousTenants: previousTenants.map((t) => ({
        id: t.id,
        name: t.name,
        phone: t.phone,
        startDate: t.startDate,
        endDate: t.endDate,
        isActive: t.isActive,
      })),
      currentInventory: currentInventory.map((inv) => ({
        id: inv.id,
        itemName: inv.itemName,
        quantity: inv.quantity,
        condition: inv.condition,
        roomNumber: inv.roomNumber,
        tenantId: inv.tenantId,
        roomId: inv.roomId,
        addedDate: inv.addedDate,
        note: inv.note,
        tenant: inv.tenant,
      })),
      previousInventory: previousInventory.map((inv) => ({
        id: inv.id,
        itemName: inv.itemName,
        quantity: inv.quantity,
        condition: inv.condition,
        roomNumber: inv.roomNumber,
        tenantId: inv.tenantId,
        roomId: inv.roomId,
        addedDate: inv.addedDate,
        note: inv.note,
        tenant: inv.tenant,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'রুম তথ্য লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
