import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET() {
  try {
    const buildingCount = await db.building.count();
    const roomCount = await db.room.count();
    const tenantCount = await db.tenant.count({ where: { isActive: true } });
    return NextResponse.json({ buildingCount, roomCount, tenantCount });
  } catch {
    return NextResponse.json({ buildingCount: 0, roomCount: 0, tenantCount: 0 });
  }
}
