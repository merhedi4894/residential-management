import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET comprehensive overview: buildings → floors → rooms → { allTenants, inventories }
export async function GET() {
  try {
    const buildings = await db.building.findMany({
      include: {
        floors: {
          include: {
            rooms: {
              include: {
                tenants: {
                  orderBy: { createdAt: 'desc' },
                },
                inventories: {
                  orderBy: { addedDate: 'desc' },
                },
              },
              orderBy: { roomNumber: 'asc' },
            },
          },
          orderBy: { floorNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // For each room, determine the "current inventory" — items belonging to the latest tenant
    // and build a flat summary
    const overview = buildings.map((b) => ({
      id: b.id,
      name: b.name,
      totalFloors: b.totalFloors,
      floors: b.floors.map((f) => ({
        id: f.id,
        floorNumber: f.floorNumber,
        rooms: f.rooms.map((r) => {
          // Latest active tenant
          const activeTenant = r.tenants.find((t) => t.isActive) || null;
          // All tenants sorted newest first
          const allTenants = r.tenants.map((t) => ({
            id: t.id,
            name: t.name,
            phone: t.phone,
            startDate: t.startDate,
            endDate: t.endDate,
            isActive: t.isActive,
          }));

          // Current inventory: items belonging to the active tenant,
          // or if no active tenant, items from the most recent tenant
          let currentInventories = r.inventories;
          if (activeTenant) {
            currentInventories = r.inventories.filter(
              (inv) => inv.tenantId === activeTenant.id
            );
          } else if (r.tenants.length > 0) {
            const latestTenant = r.tenants[0]; // already sorted desc
            currentInventories = r.inventories.filter(
              (inv) => inv.tenantId === latestTenant.id
            );
          }

          return {
            id: r.id,
            roomNumber: r.roomNumber,
            activeTenant: activeTenant
              ? {
                  id: activeTenant.id,
                  name: activeTenant.name,
                  phone: activeTenant.phone,
                  startDate: activeTenant.startDate,
                }
              : null,
            allTenants,
            inventories: currentInventories.map((inv) => ({
              id: inv.id,
              itemName: inv.itemName,
              quantity: inv.quantity,
              condition: inv.condition,
              note: inv.note,
              addedDate: inv.addedDate,
            })),
            totalInventoryItems: currentInventories.length,
          };
        }),
      })),
    }));

    return NextResponse.json(overview);
  } catch (error) {
    return NextResponse.json(
      { error: 'ওভারভিউ লোড করতে সমস্যা হয়েছে' },
      { status: 500 }
    );
  }
}
