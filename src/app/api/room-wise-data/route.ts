import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET room-wise data: current + previous tenants and inventory
// Query params: roomId (single room) OR buildingId (all rooms in building) [optional floorId]
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const buildingId = searchParams.get('buildingId');
    const floorId = searchParams.get('floorId');

    // Building-wide mode: return all rooms data (optionally filtered by floor)
    if (buildingId && !roomId) {
      // Step 1: Get floor IDs (simpler query for Turso compatibility)
      const floorFilter: any = { buildingId };
      if (floorId) {
        floorFilter.id = floorId;
      }
      const floors = await db.floor.findMany({
        where: floorFilter,
        select: { id: true },
      });
      const floorIds = floors.map((f) => f.id);

      if (floorIds.length === 0) {
        return NextResponse.json({ mode: 'allRooms', rooms: [] });
      }

      // Step 2: Get rooms using flat floorId filter
      const rooms = await db.room.findMany({
        where: { floorId: { in: floorIds } },
        include: { floor: { select: { floorNumber: true, buildingId: true } } },
        orderBy: { createdAt: 'asc' },
      });

      console.log(`[room-wise-data] buildingId=${buildingId}, floorId=${floorId || 'all'}, found ${rooms.length} rooms`);

      const allRoomData = await Promise.all(rooms.map(async (room) => {
        const allTenants = await db.tenant.findMany({
          where: { roomId: room.id },
          orderBy: { createdAt: 'desc' },
        });
        const currentTenants = allTenants.filter((t) => t.isActive);
        const previousTenants = allTenants.filter((t) => !t.isActive);

        const allInventory = await db.inventory.findMany({
          where: { roomId: room.id },
          orderBy: { addedDate: 'desc' },
          include: { tenant: { select: { id: true, name: true } } },
        });

        let currentInventory = allInventory;
        let previousInventory: typeof allInventory = [];
        if (currentTenants.length > 0) {
          const activeTenantIds = new Set(currentTenants.map((t) => t.id));
          currentInventory = allInventory.filter((inv) => inv.tenantId && activeTenantIds.has(inv.tenantId));
          previousInventory = allInventory.filter((inv) => !inv.tenantId || !activeTenantIds.has(inv.tenantId));
        } else if (allTenants.length > 0) {
          const latestTenant = allTenants[0];
          currentInventory = allInventory.filter((inv) => inv.tenantId === latestTenant.id);
          previousInventory = allInventory.filter((inv) => inv.tenantId !== latestTenant.id);
        }
        if (allTenants.length === 0) { currentInventory = allInventory; previousInventory = []; }

        const vacateRecords = await db.vacateRecord.findMany({
          where: { roomId: room.id },
          orderBy: { vacatedAt: 'desc' },
        });

        return {
          roomId: room.id,
          roomNumber: room.roomNumber,
          floorNumber: room.floor.floorNumber,
          currentTenants: currentTenants.map((t) => ({ id: t.id, name: t.name, designation: t.designation, phone: t.phone, startDate: t.startDate })),
          previousTenants: previousTenants.map((t) => ({ id: t.id, name: t.name, designation: t.designation, phone: t.phone, startDate: t.startDate, endDate: t.endDate })),
          currentInventory: currentInventory.map((inv) => ({ id: inv.id, itemName: inv.itemName, quantity: inv.quantity, condition: inv.condition, note: inv.note, addedDate: inv.addedDate, tenantId: inv.tenantId, tenantName: inv.tenant?.name || null })),
          previousInventory: previousInventory.map((inv) => ({ id: inv.id, itemName: inv.itemName, quantity: inv.quantity, condition: inv.condition, note: inv.note, addedDate: inv.addedDate, tenantId: inv.tenantId, tenantName: inv.tenant?.name || null })),
          vacateRecords: vacateRecords.map((vr) => ({ id: vr.id, tenantId: vr.tenantId, tenantName: vr.tenantName, vacatedAt: vr.vacatedAt, inventorySnapshot: vr.inventorySnapshot })),
        };
      }));

      return NextResponse.json({ mode: 'allRooms', rooms: allRoomData });
    }

    if (!roomId) {
      return NextResponse.json({ error: 'রুম আইডি দিন' }, { status: 400 });
    }

    // Get the room
    const room = await db.room.findUnique({
      where: { id: roomId },
    });

    if (!room) {
      return NextResponse.json({ error: 'রুম পাওয়া যায়নি' }, { status: 404 });
    }

    // Get all tenants for this room, sorted by createdAt desc (newest first)
    const allTenants = await db.tenant.findMany({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
    });

    // ALL active tenants (supports multiple co-tenants)
    const currentTenants = allTenants.filter((t) => t.isActive);
    const previousTenants = allTenants.filter((t) => !t.isActive);

    // Get all inventory for this room
    const allInventory = await db.inventory.findMany({
      where: { roomId },
      orderBy: { addedDate: 'desc' },
      include: { tenant: { select: { id: true, name: true } } },
    });

    // Current inventory: items belonging to ANY active tenant
    // If no active tenant, items from the most recent tenant
    let currentInventory = allInventory;
    let previousInventory: typeof allInventory = [];

    if (currentTenants.length > 0) {
      const activeTenantIds = new Set(currentTenants.map((t) => t.id));
      currentInventory = allInventory.filter(
        (inv) => inv.tenantId && activeTenantIds.has(inv.tenantId)
      );
      previousInventory = allInventory.filter(
        (inv) => !inv.tenantId || !activeTenantIds.has(inv.tenantId)
      );
    } else if (allTenants.length > 0) {
      // No active tenant - the most recent one is the "current"
      const latestTenant = allTenants[0];
      currentInventory = allInventory.filter(
        (inv) => inv.tenantId === latestTenant.id
      );
      previousInventory = allInventory.filter(
        (inv) => inv.tenantId !== latestTenant.id
      );
    }

    // If there's no tenant at all, all inventory is "current"
    if (allTenants.length === 0) {
      currentInventory = allInventory;
      previousInventory = [];
    }

    // Get vacate records for this room (with inventory snapshots)
    const vacateRecords = await db.vacateRecord.findMany({
      where: { roomId },
      orderBy: { vacatedAt: 'desc' },
    });

    return NextResponse.json({
      roomNumber: room.roomNumber,
      currentTenants: currentTenants.map((t) => ({
        id: t.id,
        name: t.name,
        designation: t.designation,
        phone: t.phone,
        startDate: t.startDate,
      })),
      previousTenants: previousTenants.map((t) => ({
        id: t.id,
        name: t.name,
        designation: t.designation,
        phone: t.phone,
        startDate: t.startDate,
        endDate: t.endDate,
      })),
      currentInventory: currentInventory.map((inv) => ({
        id: inv.id,
        itemName: inv.itemName,
        quantity: inv.quantity,
        condition: inv.condition,
        note: inv.note,
        addedDate: inv.addedDate,
        tenantId: inv.tenantId,
        tenantName: inv.tenant?.name || null,
      })),
      previousInventory: previousInventory.map((inv) => ({
        id: inv.id,
        itemName: inv.itemName,
        quantity: inv.quantity,
        condition: inv.condition,
        note: inv.note,
        addedDate: inv.addedDate,
        tenantId: inv.tenantId,
        tenantName: inv.tenant?.name || null,
      })),
      vacateRecords: vacateRecords.map((vr) => ({
        id: vr.id,
        tenantId: vr.tenantId,
        tenantName: vr.tenantName,
        vacatedAt: vr.vacatedAt,
        inventorySnapshot: vr.inventorySnapshot,
      })),
    });
  } catch (error) {
    console.error('[room-wise-data] Error:', error);
    return NextResponse.json(
      { error: 'তথ্য লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
