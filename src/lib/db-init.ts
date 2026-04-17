// Database table initialization utility
// Uses @libsql/client directly to create tables if they don't exist
// This is needed because Prisma can't create tables at runtime

import { createClient, Client } from '@libsql/client';
import bcrypt from 'bcryptjs';

let _client: Client | null = null;

function getLibsqlClient(): Client | null {
  const url = process.env.DATABASE_URL || '';
  if (!url.startsWith('libsql://')) return null;
  if (!_client) {
    _client = createClient({ url });
  }
  return _client;
}

export async function ensureTablesExist(): Promise<boolean> {
  const client = getLibsqlClient();
  if (!client) {
    console.log('[db-init] Not a Turso URL, skipping table creation');
    return false;
  }

  try {
    console.log('[db-init] Checking/creating tables...');

    // Create tables in order (respecting foreign key dependencies)
    const statements = [
      // User table
      `CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "username" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "securityQuestion" TEXT NOT NULL,
        "securityAnswer" TEXT NOT NULL,
        "sessionToken" TEXT,
        "isSetup" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
      `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,

      // Building table
      `CREATE TABLE IF NOT EXISTS "Building" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "totalFloors" INTEGER NOT NULL,
        "capacityPerRoom" INTEGER NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,

      // Floor table
      `CREATE TABLE IF NOT EXISTS "Floor" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "floorNumber" INTEGER NOT NULL,
        "buildingId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("buildingId") REFERENCES "Building"("id") ON DELETE CASCADE
      )`,

      // Room table
      `CREATE TABLE IF NOT EXISTS "Room" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "roomNumber" TEXT NOT NULL,
        "floorId" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("floorId") REFERENCES "Floor"("id") ON DELETE CASCADE
      )`,

      // Tenant table
      `CREATE TABLE IF NOT EXISTS "Tenant" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "designation" TEXT,
        "phone" TEXT,
        "roomId" TEXT NOT NULL,
        "startDate" DATETIME NOT NULL,
        "endDate" DATETIME,
        "isActive" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE
      )`,

      // Inventory table
      `CREATE TABLE IF NOT EXISTS "Inventory" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "itemName" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "condition" TEXT NOT NULL DEFAULT 'ভালো',
        "roomNumber" TEXT NOT NULL,
        "tenantId" TEXT,
        "roomId" TEXT NOT NULL,
        "addedDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "note" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE,
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE SET NULL
      )`,

      // TroubleReport table
      `CREATE TABLE IF NOT EXISTS "TroubleReport" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "roomNumber" TEXT NOT NULL,
        "roomId" TEXT NOT NULL,
        "description" TEXT NOT NULL,
        "reportedBy" TEXT NOT NULL,
        "reportedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "status" TEXT NOT NULL DEFAULT 'পেন্ডিং',
        "resolvedAt" DATETIME,
        "resolutionNote" TEXT,
        "resolvedBy" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL,
        FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE
      )`,

      // VacateRecord table
      `CREATE TABLE IF NOT EXISTS "VacateRecord" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "tenantId" TEXT NOT NULL,
        "tenantName" TEXT NOT NULL,
        "roomId" TEXT NOT NULL,
        "roomNumber" TEXT NOT NULL,
        "vacatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "inventorySnapshot" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
        FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE
      )`,

      // Guest table
      `CREATE TABLE IF NOT EXISTS "Guest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "name" TEXT NOT NULL,
        "address" TEXT,
        "mobile" TEXT,
        "referredBy" TEXT,
        "checkInDate" DATETIME NOT NULL,
        "checkOutDate" DATETIME,
        "totalBill" TEXT,
        "note" TEXT,
        "isPaid" BOOLEAN NOT NULL DEFAULT 1,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" DATETIME NOT NULL
      )`,
    ];

    for (const sql of statements) {
      try {
        await client.execute(sql);
      } catch (err: any) {
        console.warn('[db-init] Statement warning:', err?.message || err);
      }
    }

    // Migrations: add columns if they don't exist
    try {
      // Add capacityPerRoom to Building if missing
      const buildingCols = await client.execute({
        sql: `PRAGMA table_info("Building")`,
      });
      const hasCapacityCol = buildingCols.rows.some((r: any) => r.name === 'capacityPerRoom');
      if (!hasCapacityCol) {
        await client.execute({
          sql: `ALTER TABLE "Building" ADD COLUMN "capacityPerRoom" INTEGER NOT NULL DEFAULT 1`,
        });
        console.log('[db-init] Added capacityPerRoom column to Building');
      }
    } catch (err: any) {
      console.warn('[db-init] Migration warning:', err?.message || err);
    }

    // Migration: recreate VacateRecord with ON DELETE CASCADE
    // SQLite does not support ALTER TABLE to change FK constraints,
    // so we must recreate the table
    try {
      const fkInfo = await client.execute({
        sql: `PRAGMA foreign_key_list("VacateRecord")`,
      });
      const hasCascadeOnTenant = fkInfo.rows.some(
        (r: any) => r.table === 'Tenant' && (r.on_delete || '').toUpperCase() === 'CASCADE'
      );
      const hasCascadeOnRoom = fkInfo.rows.some(
        (r: any) => r.table === 'Room' && (r.on_delete || '').toUpperCase() === 'CASCADE'
      );

      if (!hasCascadeOnTenant || !hasCascadeOnRoom) {
        console.log('[db-init] Migrating VacateRecord table to add ON DELETE CASCADE...');
        await client.execute(`PRAGMA foreign_keys = OFF`);
        await client.execute(`
          CREATE TABLE "VacateRecord_new" (
            "id" TEXT NOT NULL PRIMARY KEY,
            "tenantId" TEXT NOT NULL,
            "tenantName" TEXT NOT NULL,
            "roomId" TEXT NOT NULL,
            "roomNumber" TEXT NOT NULL,
            "vacatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "inventorySnapshot" TEXT NOT NULL,
            "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE,
            FOREIGN KEY ("roomId") REFERENCES "Room"("id") ON DELETE CASCADE
          )
        `);
        await client.execute(`
          INSERT INTO "VacateRecord_new" ("id","tenantId","tenantName","roomId","roomNumber","vacatedAt","inventorySnapshot","createdAt")
          SELECT "id","tenantId","tenantName","roomId","roomNumber","vacatedAt","inventorySnapshot","createdAt" FROM "VacateRecord"
        `);
        await client.execute(`DROP TABLE "VacateRecord"`);
        await client.execute(`ALTER TABLE "VacateRecord_new" RENAME TO "VacateRecord"`);
        await client.execute(`PRAGMA foreign_keys = ON`);
        console.log('[db-init] VacateRecord table migrated with ON DELETE CASCADE');
      }
    } catch (err: any) {
      await client.execute(`PRAGMA foreign_keys = ON`).catch(() => {});
      console.warn('[db-init] VacateRecord migration warning:', err?.message || err);
    }

    // Migration: add designation to Tenant if missing
    try {
      const tenantCols = await client.execute({
        sql: `PRAGMA table_info("Tenant")`,
      });
      const hasDesignationCol = tenantCols.rows.some((r: any) => r.name === 'designation');
      if (!hasDesignationCol) {
        await client.execute({
          sql: `ALTER TABLE "Tenant" ADD COLUMN "designation" TEXT`,
        });
        console.log('[db-init] Added designation column to Tenant');
      }
    } catch (err: any) {
      console.warn('[db-init] Tenant designation migration warning:', err?.message || err);
    }

    console.log('[db-init] Table check/creation completed');
    return true;
  } catch (err: any) {
    console.error('[db-init] Failed to create tables:', err?.message || err);
    return false;
  }
}

export async function updateSecurityQuestion(): Promise<void> {
  const client = getLibsqlClient();
  if (!client) return;

  try {
    // Only update if the current security question is different
    const result = await client.execute({
      sql: `SELECT "securityQuestion" FROM "User" LIMIT 1`,
    });

    if (result.rows.length === 0) return;
    const currentQuestion = result.rows[0]['securityQuestion'] as string;
    if (currentQuestion === 'What was your birth place?') return;

    const hashedAnswer = await bcrypt.hash('bhatsala', 10);
    const newQuestion = 'What was your birth place?';

    await client.execute({
      sql: `UPDATE "User" SET "securityQuestion" = ?, "securityAnswer" = ?, "updatedAt" = datetime('now') WHERE "securityQuestion" != ?`,
      args: [newQuestion, hashedAnswer, newQuestion],
    });

    console.log('[db-init] Security question updated successfully');
  } catch (err: any) {
    console.error('[db-init] Failed to update security question:', err?.message || err);
  }
}
