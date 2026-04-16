// Database table initialization utility
// Uses @libsql/client directly to create tables if they don't exist
// This is needed because Prisma can't create tables at runtime

import { createClient, Client } from '@libsql/client';

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
        FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id"),
        FOREIGN KEY ("roomId") REFERENCES "Room"("id")
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

    console.log('[db-init] Table check/creation completed');
    return true;
  } catch (err: any) {
    console.error('[db-init] Failed to create tables:', err?.message || err);
    return false;
  }
}
