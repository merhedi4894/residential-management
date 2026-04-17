import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET room-wise data: current + previous tenants and inventory
// Query params: roomId (required)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');

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
        phone: t.phone,
        startDate: t.startDate,
      })),
      previousTenants: previousTenants.map((t) => ({
        id: t.id,
        name: t.name,
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
    return NextResponse.json(
      { error: 'তথ্য লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
