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

    const currentTenant = allTenants.find((t) => t.isActive) || null;
    const previousTenants = allTenants.filter((t) => !t.isActive);

    // Get all inventory for this room
    const allInventory = await db.inventory.findMany({
      where: { roomId },
      orderBy: { addedDate: 'desc' },
      include: { tenant: { select: { id: true, name: true } } },
    });

    // Current inventory: items belonging to the active tenant
    // If no active tenant, items from the most recent tenant
    let currentInventory = allInventory;
    let previousInventory: typeof allInventory = [];

    if (currentTenant) {
      currentInventory = allInventory.filter(
        (inv) => inv.tenantId === currentTenant.id
      );
      previousInventory = allInventory.filter(
        (inv) => inv.tenantId !== currentTenant.id
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

    return NextResponse.json({
      roomNumber: room.roomNumber,
      currentTenant: currentTenant
        ? {
            id: currentTenant.id,
            name: currentTenant.name,
            phone: currentTenant.phone,
            startDate: currentTenant.startDate,
          }
        : null,
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
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'তথ্য লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
