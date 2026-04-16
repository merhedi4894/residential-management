import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// POST - Vacate tenant with inventory editing
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
      for (const item of inventoryItems) {
        if (item._delete) {
          // Delete inventory item
          try {
            await db.inventory.delete({ where: { id: item.id } });
          } catch {
            // Item might already be deleted, ignore
          }
        } else if (item.id) {
          // Update existing inventory item
          try {
            await db.inventory.update({
              where: { id: item.id },
              data: {
                itemName: item.itemName,
                quantity: parseInt(String(item.quantity)) || 1,
                condition: item.condition || 'ভালো',
                note: item.note || null,
              },
            });
            processedItems.push({
              itemName: item.itemName,
              quantity: parseInt(String(item.quantity)) || 1,
              condition: item.condition || 'ভালো',
              note: item.note || null,
            });
          } catch {
            // Item might not exist, create it instead
            const newInv = await db.inventory.create({
              data: {
                itemName: item.itemName,
                quantity: parseInt(String(item.quantity)) || 1,
                condition: item.condition || 'ভালো',
                roomNumber: tenant.room.roomNumber,
                tenantId: tenant.id,
                roomId: tenant.roomId,
                note: item.note || null,
              },
            });
            processedItems.push({
              itemName: newInv.itemName,
              quantity: newInv.quantity,
              condition: newInv.condition,
              note: newInv.note,
            });
          }
        } else if (item.itemName?.trim()) {
          // New item (no id)
          const newInv = await db.inventory.create({
            data: {
              itemName: item.itemName.trim(),
              quantity: parseInt(String(item.quantity)) || 1,
              condition: item.condition || 'ভালো',
              roomNumber: tenant.room.roomNumber,
              tenantId: tenant.id,
              roomId: tenant.roomId,
              note: item.note || null,
            },
          });
          processedItems.push({
            itemName: newInv.itemName,
            quantity: newInv.quantity,
            condition: newInv.condition,
            note: newInv.note,
          });
        }
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

    // Disconnect inventory from tenant (set tenantId to null for remaining items)
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
