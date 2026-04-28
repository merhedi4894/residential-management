import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET room-wise data: current + previous tenants and inventory
// Query params: roomId (single room) OR buildingId (all rooms) [optional floorId]
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    const buildingId = searchParams.get('buildingId');
    const floorId = searchParams.get('floorId');

    // ── Building-wide mode ────────────────────────────────────────────
    if (buildingId && !roomId) {
      // Step 1: Fetch building with nested floors, rooms, tenants in ONE query
      const building = await db.building.findUnique({
        where: { id: buildingId },
        include: {
          floors: {
            include: {
              rooms: {
                include: {
                  tenants: { orderBy: { createdAt: 'desc' } },
                },
              },
            },
            orderBy: { floorNumber: 'asc' },
          },
        },
      });

      if (!building || !building.floors || building.floors.length === 0) {
        return NextResponse.json({ mode: 'allRooms', rooms: [] });
      }

      // Step 2: Collect ALL room IDs in ONE pass
      const allRoomIds: string[] = [];
      for (const floor of building.floors) {
        if (floorId && floor.id !== floorId) continue;
        if (floor.rooms) {
          for (const room of floor.rooms) {
            allRoomIds.push(room.id);
          }
        }
      }

      if (allRoomIds.length === 0) {
        return NextResponse.json({ mode: 'allRooms', rooms: [] });
      }

      // Step 3+4: Fetch inventory and vacate records in parallel
      const [allInventory, allVacateRecords] = await Promise.all([
        db.inventory.findMany({
          where: { roomId: { in: allRoomIds } },
          orderBy: { addedDate: 'desc' },
          include: { tenant: { select: { id: true, name: true } } },
        }),
        db.vacateRecord.findMany({
          where: { roomId: { in: allRoomIds } },
          orderBy: { vacatedAt: 'desc' },
        }),
      ]);

      // Step 5: Group inventory and vacate records by roomId in memory
      const inventoryByRoom = new Map<string, typeof allInventory>();
      for (const inv of allInventory) {
        const list = inventoryByRoom.get(inv.roomId) || [];
        list.push(inv);
        inventoryByRoom.set(inv.roomId, list);
      }

      const vacateByRoom = new Map<string, typeof allVacateRecords>();
      for (const vr of allVacateRecords) {
        const list = vacateByRoom.get(vr.roomId) || [];
        list.push(vr);
        vacateByRoom.set(vr.roomId, list);
      }

      // Step 6: Build response with in-memory grouping (no more DB queries)
      const allRoomData = [];

      for (const floor of building.floors) {
        if (floorId && floor.id !== floorId) continue;
        if (!floor.rooms) continue;

        for (const room of floor.rooms) {
          const allTenants = room.tenants || [];
          const currentTenants = allTenants.filter((t) => t.isActive);
          const previousTenants = allTenants.filter((t) => !t.isActive);

          // Get inventory for this room from the pre-fetched map
          const roomInventory = inventoryByRoom.get(room.id) || [];

          let currentInventory = roomInventory;
          let previousInventory: typeof roomInventory = [];
          if (currentTenants.length > 0) {
            const activeTenantIds = new Set(currentTenants.map((t) => t.id));
            currentInventory = roomInventory.filter((inv) => inv.tenantId && activeTenantIds.has(inv.tenantId));
            // When active tenants exist, previous inventory should be empty
            previousInventory = [];
          } else if (allTenants.length > 0) {
            const latestTenant = allTenants[0];
            currentInventory = roomInventory.filter((inv) => inv.tenantId === latestTenant.id);
            previousInventory = roomInventory.filter((inv) => inv.tenantId !== latestTenant.id);
          }
          if (allTenants.length === 0) { currentInventory = roomInventory; previousInventory = []; }

          // Get vacate records for this room from the pre-fetched map
          const vacateRecords = vacateByRoom.get(room.id) || [];

          allRoomData.push({
            roomId: room.id,
            roomNumber: room.roomNumber,
            floorNumber: floor.floorNumber,
            currentTenants: currentTenants.map((t) => ({ id: t.id, name: t.name, designation: t.designation, phone: t.phone, startDate: t.startDate })),
            previousTenants: previousTenants.map((t) => ({ id: t.id, name: t.name, designation: t.designation, phone: t.phone, startDate: t.startDate, endDate: t.endDate })),
            currentInventory: currentInventory.map((inv) => ({ id: inv.id, itemName: inv.itemName, quantity: inv.quantity, condition: inv.condition, note: inv.note, addedDate: inv.addedDate, tenantId: inv.tenantId, tenantName: inv.tenant?.name || null })),
            previousInventory: previousInventory.map((inv) => ({ id: inv.id, itemName: inv.itemName, quantity: inv.quantity, condition: inv.condition, note: inv.note, addedDate: inv.addedDate, tenantId: inv.tenantId, tenantName: inv.tenant?.name || null })),
            vacateRecords: vacateRecords.map((vr) => ({ id: vr.id, tenantId: vr.tenantId, tenantName: vr.tenantName, vacatedAt: vr.vacatedAt, inventorySnapshot: vr.inventorySnapshot })),
          });
        }
      }

      return NextResponse.json({ mode: 'allRooms', rooms: allRoomData });
    }

    // ── Single room mode ──────────────────────────────────────────────
    if (!roomId) {
      return NextResponse.json({ error: 'রুম আইডি দিন' }, { status: 400 });
    }

    const room = await db.room.findUnique({
      where: { id: roomId },
      include: {
        floor: { select: { floorNumber: true } },
        tenants: { orderBy: { createdAt: 'desc' } },
      },
    });

    if (!room) {
      return NextResponse.json({ error: 'রুম পাওয়া যায়নি' }, { status: 404 });
    }

    const allTenants = room.tenants || [];
    const currentTenants = allTenants.filter((t) => t.isActive);
    const previousTenants = allTenants.filter((t) => !t.isActive);

    // Fetch inventory and vacate records in parallel
    const [allInventory, vacateRecords] = await Promise.all([
      db.inventory.findMany({
        where: { roomId: room.id },
        orderBy: { addedDate: 'desc' },
        include: { tenant: { select: { id: true, name: true } } },
      }),
      db.vacateRecord.findMany({
        where: { roomId: room.id },
        orderBy: { vacatedAt: 'desc' },
      }),
    ]);

    let currentInventory = allInventory;
    let previousInventory: typeof allInventory = [];

    if (currentTenants.length > 0) {
      const activeTenantIds = new Set(currentTenants.map((t) => t.id));
      currentInventory = allInventory.filter(
        (inv) => inv.tenantId && activeTenantIds.has(inv.tenantId)
      );
      // When active tenants exist, previous inventory should be empty
      // (old disconnected items are cleaned up by vacate/tenant creation)
      previousInventory = [];
    } else if (allTenants.length > 0) {
      const latestTenant = allTenants[0];
      currentInventory = allInventory.filter(
        (inv) => inv.tenantId === latestTenant.id
      );
      previousInventory = allInventory.filter(
        (inv) => inv.tenantId !== latestTenant.id
      );
    }

    if (allTenants.length === 0) {
      currentInventory = allInventory;
      previousInventory = [];
    }

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
