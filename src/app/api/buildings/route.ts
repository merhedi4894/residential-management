import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

// GET all buildings
export async function GET() {
  try {
    const buildings = await db.building.findMany({
      include: {
        floors: {
          include: {
            rooms: {
              include: {
                tenants: { where: { isActive: true } },
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
    const body = await req.json();
    const { name, totalFloors } = body;

    const building = await db.building.create({
      data: {
        name,
        totalFloors: parseInt(totalFloors),
      },
    });

    // Auto-create floors
    const floors = [];
    for (let i = 1; i <= parseInt(totalFloors); i++) {
      const floor = await db.floor.create({
        data: {
          floorNumber: i,
          buildingId: building.id,
        },
      });
      floors.push(floor);
    }

    return NextResponse.json({ ...building, floors });
  } catch (error) {
    return NextResponse.json({ error: 'বিল্ডিং তৈরি করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}

// DELETE building
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    await db.building.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'বিল্ডিং মুছে ফেলতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
