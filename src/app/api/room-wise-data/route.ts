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
      // Use the SAME include pattern as /api/buildings (proven to work)
      // Fetch building with nested floors, rooms, tenants
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
        console.log(`[room-wise-data] No building/floors found for buildingId=${buildingId}`);
        return NextResponse.json({ mode: 'allRooms', rooms: [] });
      }

      const allRoomData = [];

      for (const floor of building.floors) {
        // Skip floors if a specific floor was requested
        if (floorId && floor.id !== floorId) continue;

        if (!floor.rooms) continue;
        for (const room of floor.rooms) {
          const allTenants = room.tenants || [];
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

      console.log(`[room-wise-data] buildingId=${buildingId}, floorId=${floorId || 'all'}, rooms=${allRoomData.length}`);
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

    const allInventory = await db.inventory.findMany({
      where: { roomId: room.id },
      orderBy: { addedDate: 'desc' },
      include: { tenant: { select: { id: true, name: true } } },
    });

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

    const vacateRecords = await db.vacateRecord.findMany({
      where: { roomId: room.id },
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
