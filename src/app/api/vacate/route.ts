import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Vacate tenant with inventory editing (optimized with batch operations)
// Body: { tenantId, inventoryItems: [{ id, itemName, quantity, condition, _delete? }] }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { tenantId, inventoryItems } = body;

    if (!tenantId) {
      return NextResponse.json({ error: 'ভাড়াটে আইডি দিন' }, { status: 400 });
    }

    // Get tenant with room info
    const tenant = await db.tenant.findUnique({
      where: { id: tenantId },
      include: {
        room: true,
        inventories: true,
      },
    });

    if (!tenant) {
      return NextResponse.json({ error: 'ভাড়াটে পাওয়া যায়নি' }, { status: 404 });
    }

    if (!tenant.isActive) {
      return NextResponse.json({ error: 'এই ভাড়াটে ইতিমধ্যে অসক্রিয়' }, { status: 400 });
    }

    // Process inventory items
    const processedItems: { itemName: string; quantity: number; condition: string; note?: string | null }[] = [];

    if (inventoryItems && Array.isArray(inventoryItems)) {
      // Separate items into categories for batch processing
      const toDelete: string[] = [];
      const toUpdate: { id: string; itemName: string; quantity: number; condition: string; note?: string | null }[] = [];
      const toCreate: { itemName: string; quantity: number; condition: string; roomNumber: string; tenantId: string; roomId: string; note?: string | null }[] = [];

      for (const item of inventoryItems) {
        if (item._delete && item.id) {
          toDelete.push(item.id);
        } else if (item.id) {
          toUpdate.push({
            id: item.id,
            itemName: item.itemName,
            quantity: parseInt(String(item.quantity)) || 1,
            condition: item.condition || 'ভালো',
            note: item.note || null,
          });
        } else if (item.itemName?.trim()) {
          toCreate.push({
            itemName: item.itemName.trim(),
            quantity: parseInt(String(item.quantity)) || 1,
            condition: item.condition || 'ভালো',
            roomNumber: tenant.room.roomNumber,
            tenantId: tenant.id,
            roomId: tenant.roomId,
            note: item.note || null,
          });
        }
      }

      // Batch delete (ONE query instead of N)
      if (toDelete.length > 0) {
        try {
          await db.inventory.deleteMany({
            where: { id: { in: toDelete } },
          });
        } catch {
          // Some items might not exist, ignore
        }
      }

      // Process updates - batch in parallel where possible
      if (toUpdate.length > 0) {
        await db.$transaction(
          toUpdate.map((item) =>
            db.inventory.update({
              where: { id: item.id },
              data: {
                itemName: item.itemName,
                quantity: item.quantity,
                condition: item.condition,
                note: item.note,
              },
            })
          )
        );
        processedItems.push(...toUpdate);
      }

      // Batch create (ONE query instead of N)
      if (toCreate.length > 0) {
        const newItems = await db.inventory.createMany({
          data: toCreate,
        });
        processedItems.push(...toCreate);
      }
    } else {
      // No inventory items provided, get existing ones
      const existingInv = await db.inventory.findMany({
        where: { tenantId: tenant.id },
      });
      processedItems.push(...existingInv.map(inv => ({
        itemName: inv.itemName,
        quantity: inv.quantity,
        condition: inv.condition,
        note: inv.note,
      })));
    }

    // Mark tenant as inactive
    const updatedTenant = await db.tenant.update({
      where: { id: tenantId },
      data: {
        isActive: false,
        endDate: new Date(),
      },
    });

    // Create vacate record
    const vacateRecord = await db.vacateRecord.create({
      data: {
        tenantId: tenant.id,
        tenantName: tenant.name,
        roomId: tenant.roomId,
        roomNumber: tenant.room.roomNumber,
        inventorySnapshot: JSON.stringify(processedItems),
      },
    });

    // Delete ALL old disconnected inventory items (tenantId=null) for this room
    // This ensures only the latest vacated tenant's items remain as "previous inventory"
    await db.inventory.deleteMany({
      where: {
        roomId: tenant.roomId,
        tenantId: null,
      },
    });

    // Disconnect THIS tenant's inventory items (set tenantId to null)
    // These become the "previous inventory" for the next tenant
    await db.inventory.updateMany({
      where: { tenantId: tenant.id },
      data: { tenantId: null },
    });

    return NextResponse.json({
      tenant: updatedTenant,
      vacateRecord,
    });
  } catch (error) {
    console.error('Vacate error:', error);
    return NextResponse.json({ error: 'রুম ছেড়ে দিতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
