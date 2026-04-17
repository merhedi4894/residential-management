import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ensureTablesExist } from '@/lib/db-init';
import ExcelJS from 'exceljs';

export async function GET(req: NextRequest) {
  try {
    await ensureTablesExist();
    const buildingId = req.nextUrl.searchParams.get('buildingId');

    if (!buildingId) {
      return NextResponse.json({ error: 'বিল্ডিং আইডি দরকার' }, { status: 400 });
    }

    // Get building info
    const building = await db.building.findUnique({
      where: { id: buildingId },
    });

    if (!building) {
      return NextResponse.json({ error: 'বিল্ডিং পাওয়া যায়নি' }, { status: 404 });
    }

    // Get all rooms in this building with inventories
    const floors = await db.floor.findMany({
      where: { buildingId },
      include: {
        rooms: {
          include: {
            inventories: {
              orderBy: { createdAt: 'asc' },
            },
          },
          orderBy: { roomNumber: 'asc' },
        },
      },
      orderBy: { floorNumber: 'asc' },
    });

    // Create workbook
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'আবাসিক ম্যানেজমেন্ট';
    workbook.created = new Date();

    // Main sheet - all rooms
    const sheet = workbook.addWorksheet(`${building.name} - মালামাল তালিকা`);

    // Title row
    sheet.mergeCells('A1', 'E1');
    const titleCell = sheet.getCell('A1');
    titleCell.value = `${building.name} - সকল রুমের মালামাল তালিকা`;
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    sheet.getRow(1).height = 30;

    // Date row
    sheet.mergeCells('A2', 'E2');
    const dateCell = sheet.getCell('A2');
    dateCell.value = `তারিখ: ${new Date().toLocaleDateString('bn-BD')}`;
    dateCell.alignment = { horizontal: 'center' };

    // Header row
    const headerRow = sheet.addRow(['তলা', 'রুম নং', 'মালামালের নাম', 'পরিমাণ', 'অবস্থা']);
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF10B981' },
    };
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    // Set column widths
    sheet.getColumn(1).width = 12;
    sheet.getColumn(2).width = 12;
    sheet.getColumn(3).width = 25;
    sheet.getColumn(4).width = 12;
    sheet.getColumn(5).width = 12;

    let currentRow = 3;
    const floorNames: Record<number, string> = {
      1: '১ম তলা', 2: '২য় তলা', 3: '৩য় তলা', 4: '৪র্থ তলা', 5: '৫ম তলা',
    };

    for (const floor of floors) {
      const floorName = floorNames[floor.floorNumber] || `${floor.floorNumber} তলা`;

      for (const room of floor.rooms) {
        if (room.inventories.length === 0) {
          const row = sheet.getRow(currentRow);
          row.getCell(1).value = floorName;
          row.getCell(2).value = room.roomNumber;
          row.getCell(3).value = 'কোনো মালামাল নেই';
          row.getCell(4).value = '-';
          row.getCell(5).value = '-';
          row.alignment = { horizontal: 'center' };
          currentRow++;
        } else {
          for (let i = 0; i < room.inventories.length; i++) {
            const inv = room.inventories[i];
            const row = sheet.getRow(currentRow);
            row.getCell(1).value = i === 0 ? floorName : '';
            row.getCell(2).value = i === 0 ? room.roomNumber : '';
            row.getCell(3).value = inv.itemName;
            row.getCell(4).value = inv.quantity;
            row.getCell(5).value = inv.condition;
            row.alignment = { horizontal: 'center' };
            currentRow++;
          }
        }
      }
    }

    // Add thin borders to all cells
    for (let i = 1; i < currentRow; i++) {
      const row = sheet.getRow(i);
      for (let j = 1; j <= 5; j++) {
        const cell = row.getCell(j);
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      }
    }

    // Generate buffer
    const buffer = await workbook.xlsx.writeBuffer();

    // Return as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(building.name)}_মালামাল_তালিকা.xlsx"`,
      },
    });
  } catch (error) {
    console.error('Belongings download error:', error);
    return NextResponse.json({ error: 'ডাউনলোড করতে সমস্যা হয়েছে' }, { status: 500 });
  }
}
