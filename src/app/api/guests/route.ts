import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

function toEnglishDigits(str: string): string {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return str.replace(/[০-৯]/g, (d) => String(bengaliDigits.indexOf(d)));
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const all = searchParams.get("all");
    const month = searchParams.get("month");
    const year = searchParams.get("year");
    const roomId = searchParams.get("roomId");
    const active = searchParams.get("active");

    const where: Record<string, unknown> = {};

    if (!all && (month || year)) {
      const dateFilter: Record<string, unknown> = {};
      const engYear = year ? parseInt(toEnglishDigits(year)) : null;
      const engMonth = month ? parseInt(toEnglishDigits(month)) : null;

      if (engYear && !isNaN(engYear)) {
        if (engMonth && !isNaN(engMonth) && engMonth >= 1 && engMonth <= 12) {
          dateFilter.gte = new Date(engYear, engMonth - 1, 1);
          dateFilter.lt = new Date(engYear, engMonth, 1);
        } else {
          dateFilter.gte = new Date(engYear, 0, 1);
          dateFilter.lt = new Date(engYear + 1, 0, 1);
        }
      } else if (engMonth && !isNaN(engMonth) && engMonth >= 1 && engMonth <= 12) {
        const cy = new Date().getFullYear();
        dateFilter.gte = new Date(cy, engMonth - 1, 1);
        dateFilter.lt = new Date(cy, engMonth, 1);
      }
      where.checkInDate = dateFilter;
    }

    if (roomId) where.roomId = roomId;
    if (active === "true") where.isBooked = true;

    const guests = await db.guest.findMany({
      where: Object.keys(where).length > 0 ? where : undefined,
      orderBy: { checkInDate: "desc" },
    });

    return NextResponse.json(guests);
  } catch (error) {
    console.error("Guest GET error:", error);
    return NextResponse.json({ error: "গেস্ট লোড করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, address, mobile, referredBy, checkInDate, checkInTime, checkOutDate, checkOutTime, totalBill, note, isPaid, roomId, roomNumber, isBooked } = body;

    if (!name?.trim() || !checkInDate) {
      return NextResponse.json({ error: "নাম এবং চেক-ইন তারিখ দিন" }, { status: 400 });
    }

    const parsedCheckIn = new Date(checkInDate);
    if (isNaN(parsedCheckIn.getTime())) {
      return NextResponse.json({ error: "চেক-ইন তারিখ সঠিক নয়" }, { status: 400 });
    }

    let parsedCheckOut: Date | null = null;
    if (checkOutDate) {
      parsedCheckOut = new Date(checkOutDate);
      if (isNaN(parsedCheckOut.getTime())) {
        return NextResponse.json({ error: "চেক-আউট তারিখ সঠিক নয়" }, { status: 400 });
      }
    }

    const guest = await db.guest.create({
      data: {
        name: name.trim(),
        address: address?.trim() || null,
        mobile: mobile?.trim() || null,
        referredBy: referredBy?.trim() || null,
        checkInDate: parsedCheckIn,
        checkOutDate: parsedCheckOut,
        totalBill: totalBill?.trim() || null,
        note: note?.trim() || null,
        isPaid: isPaid === true,
        checkInTime: checkInTime?.trim() || null,
        checkOutTime: checkOutTime?.trim() || null,
        roomId: roomId || null,
        roomNumber: roomNumber?.trim() || null,
        isBooked: isBooked === true,
      },
    });

    return NextResponse.json(guest);
  } catch (error) {
    console.error("Guest POST error:", error);
    return NextResponse.json({ error: "গেস্ট তৈরি করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, address, mobile, referredBy, checkInDate, checkOutDate, checkInTime, checkOutTime, totalBill, note, isPaid, roomId, roomNumber, isBooked } = body;

    if (!id) {
      return NextResponse.json({ error: "গেস্ট ID প্রয়োজন" }, { status: 400 });
    }

    const updateData: Record<string, unknown> = {};
    if (name !== undefined) updateData.name = name.trim();
    if (address !== undefined) updateData.address = address?.trim() || null;
    if (mobile !== undefined) updateData.mobile = mobile?.trim() || null;
    if (referredBy !== undefined) updateData.referredBy = referredBy?.trim() || null;
    if (checkInTime !== undefined) updateData.checkInTime = checkInTime?.trim() || null;
    if (checkOutTime !== undefined) updateData.checkOutTime = checkOutTime?.trim() || null;
    if (roomId !== undefined) updateData.roomId = roomId || null;
    if (roomNumber !== undefined) updateData.roomNumber = roomNumber?.trim() || null;
    if (isBooked !== undefined) updateData.isBooked = isBooked;
    if (checkInDate) {
      const p = new Date(checkInDate);
      if (!isNaN(p.getTime())) updateData.checkInDate = p;
    }
    if (checkOutDate !== undefined) {
      if (checkOutDate) {
        const p = new Date(checkOutDate);
        if (!isNaN(p.getTime())) updateData.checkOutDate = p;
      } else {
        updateData.checkOutDate = null;
      }
    }
    if (totalBill !== undefined) updateData.totalBill = totalBill?.trim() || null;
    if (note !== undefined) updateData.note = note?.trim() || null;
    if (isPaid !== undefined) updateData.isPaid = isPaid;

    const guest = await db.guest.update({ where: { id }, data: updateData });
    return NextResponse.json(guest);
  } catch (error) {
    console.error("Guest PATCH error:", error);
    return NextResponse.json({ error: "গেস্ট আপডেট করতে সমস্যা হয়েছে" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) {
      return NextResponse.json({ error: "গেস্ট ID প্রয়োজন" }, { status: 400 });
    }
    await db.guest.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Guest DELETE error:", error);
    return NextResponse.json({ error: "গেস্ট মুছে ফেলতে সমস্যা হয়েছে" }, { status: 500 });
  }
}
