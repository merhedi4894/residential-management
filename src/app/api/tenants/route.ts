import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all tenants (optionally filter by roomId)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const roomId = searchParams.get('roomId');
    
    // Single deep query instead of 3 sequential queries
    const tenants = await db.tenant.findMany({
      where: roomId ? { roomId } : undefined,
      include: {
        room: {
          include: {
            floor: {
              include: { building: { select: { id: true, name: true } } }
            }
          }
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const tenantsWithBuilding = tenants.map(t => ({
      ...t,
      buildingName: t.room?.floor?.building?.name || "",
    }));

    return NextResponse.json(tenantsWithBuilding, {
      headers: { 'Cache-Control': 'private, max-age=5, stale-while-revalidate=10' },
    });
  } catch (error) {
    return NextResponse.json({ error: 'ভাড়াটে লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST create tenant
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, designation, phone, roomId, startDate, inventoryItems } = body;

    // Create new tenant (no auto-deactivation; use vacate endpoint to deactivate)
    const tenant = await db.tenant.create({
      data: {
        name,
        designation: designation || null,
        phone: phone || null,
        roomId,
        startDate: new Date(startDate),
        isActive: true,
      },
    });

    // Always delete old disconnected (previous) inventory items for this room
    // They are being replaced by the new tenant (even if no inventory sent)
    await db.inventory.deleteMany({
      where: { roomId, tenantId: null },
    });

    // Create initial inventory items
    if (inventoryItems && inventoryItems.length > 0) {
      // Get roomNumber from room if not provided
      let roomNumber = body.roomNumber || '';
      if (!roomNumber) {
        const room = await db.room.findUnique({ where: { id: roomId } });
        if (room) roomNumber = room.roomNumber;
      }

      await db.inventory.createMany({
        data: inventoryItems.map((item: { itemName: string; quantity: number; condition: string; note?: string }) => ({
          itemName: item.itemName,
          quantity: parseInt(String(item.quantity)) || 1,
          condition: item.condition || 'ভালো',
          roomNumber,
          tenantId: tenant.id,
          roomId,
          note: item.note || null,
        })),
      });
    }

    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: 'ভাড়াটে তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PATCH vacate tenant OR update tenant info
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, action, name, designation, phone } = body;

    if (action === "updateInfo") {
      // Update tenant name, designation and/or phone
      const updateData: Record<string, unknown> = {};
      if (name !== undefined) updateData.name = name;
      if (designation !== undefined) updateData.designation = designation || null;
      if (phone !== undefined) updateData.phone = phone || null;

      const tenant = await db.tenant.update({
        where: { id },
        data: updateData,
      });
      return NextResponse.json(tenant);
    }

    // Default: vacate tenant
    const tenant = await db.tenant.update({
      where: { id },
      data: { isActive: false, endDate: new Date() },
    });

    return NextResponse.json(tenant);
  } catch (error) {
    return NextResponse.json({ error: 'ভাড়াটে আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE tenant
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.tenant.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'ভাড়াটে মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
