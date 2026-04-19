import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';
import bcrypt from 'bcryptjs';

// GET all buildings
export async function GET() {
  try {
    const buildings = await db.building.findMany({
      include: {
        floors: {
          include: {
            rooms: {
              include: {
                tenants: { where: { isActive: true }, select: { id: true, name: true, isActive: true } },
              },
            },
          },
          orderBy: { floorNumber: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(buildings);
  } catch (error) {
    return NextResponse.json({ error: 'বিল্ডিং লোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// POST create building
export async function POST(req: NextRequest) {
  try {
    await ensureTablesExist();
    const body = await req.json();
    const { name, totalFloors } = body;

    const building = await db.building.create({
      data: {
        name,
        totalFloors: parseInt(totalFloors),
        capacityPerRoom: parseInt(body.capacityPerRoom) || 1,
      },
    });

    // Auto-create floors in ONE batch operation
    const floorCount = parseInt(totalFloors);
    await db.floor.createMany({
      data: Array.from({ length: floorCount }, (_, i) => ({
        floorNumber: i + 1,
        buildingId: building.id,
      })),
    });

    // Fetch created floors for response
    const floors = await db.floor.findMany({
      where: { buildingId: building.id },
      orderBy: { floorNumber: 'asc' },
    });

    return NextResponse.json({ ...building, floors });
  } catch (error) {
    return NextResponse.json({ error: 'বিল্ডিং তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// PATCH update building name and capacity
export async function PATCH(req: NextRequest) {
  try {
    const { id, name, capacityPerRoom } = await req.json();

    if (!id || !name?.trim()) {
      return NextResponse.json({ error: 'বিল্ডিং এর নাম দিন' }, { status: 400 });
    }

    const data: any = { name: name.trim() };
    if (capacityPerRoom !== undefined && capacityPerRoom !== null) {
      const cap = parseInt(capacityPerRoom);
      if (isNaN(cap) || cap < 1) {
        return NextResponse.json({ error: 'সিট সংখ্যা ১ বা তার বেশি হতে হবে' }, { status: 400 });
      }
      data.capacityPerRoom = cap;
    }

    const building = await db.building.update({
      where: { id },
      data,
    });

    return NextResponse.json(building);
  } catch (error) {
    return NextResponse.json({ error: 'বিল্ডিং আপডেট করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE building (requires admin password verification)
export async function DELETE(req: NextRequest) {
  try {
    await ensureTablesExist();
    const { id, adminPassword } = await req.json();

    if (!adminPassword) {
      return NextResponse.json({ error: 'এডমিন পাসওয়ার্ড দিন' }, { status: 400 });
    }

    // Verify admin password
    const adminUser = await db.user.findFirst({ where: { isSetup: true } });
    if (!adminUser) {
      return NextResponse.json({ error: 'এডমিন ইউজার পাওয়া যায়নি' }, { status: 400 });
    }

    const isValid = await bcrypt.compare(adminPassword, adminUser.password);
    if (!isValid) {
      return NextResponse.json({ error: 'পাসওয়ার্ড ভুল হয়েছে' }, { status: 401 });
    }

    await db.building.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'বিল্ডিং মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
