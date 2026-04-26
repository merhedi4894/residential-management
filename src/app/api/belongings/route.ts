import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';

// GET - Fetch belonging templates for a building
export async function GET(req: NextRequest) {
  try {
    await ensureTablesExist();
    const buildingId = req.nextUrl.searchParams.get('buildingId');
    if (!buildingId) {
      return NextResponse.json({ error: 'বিল্ডিং আইডি দরকার' }, { status: 400 });
    }

    const templates = await db.belongingTemplate.findMany({
      where: { buildingId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Belongings GET error:', error);
    return NextResponse.json({ error: 'মালামাল লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST - Create a new belonging template
export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { buildingId, itemName, quantity } = await req.json();

    if (!buildingId || !itemName?.trim()) {
      return NextResponse.json({ error: 'বিল্ডিং ও মালামালের নাম দিন' }, { status: 400 });
    }

    const template = await db.belongingTemplate.create({
      data: {
        buildingId,
        itemName: itemName.trim(),
        quantity: parseInt(quantity) || 1,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Belongings POST error:', error);
    return NextResponse.json({ error: 'মালামাল যোগ করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PATCH - Update a belonging template
export async function PATCH(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { id, itemName, quantity } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'আইডি দরকার' }, { status: 400 });
    }

    const template = await db.belongingTemplate.update({
      where: { id },
      data: {
        ...(itemName !== undefined ? { itemName: itemName.trim() } : {}),
        ...(quantity !== undefined ? { quantity: parseInt(quantity) || 1 } : {}),
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Belongings PATCH error:', error);
    return NextResponse.json({ error: 'মালামাল আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE - Remove a belonging template
export async function DELETE(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'আইডি দরকার' }, { status: 400 });
    }

    await db.belongingTemplate.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Belongings DELETE error:', error);
    return NextResponse.json({ error: 'মালামাল মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
