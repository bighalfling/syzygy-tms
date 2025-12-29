import { PrismaClient } from "@prisma/client";

/**
 * DB -> DB migration helper for Prisma.
 *
 * Required env:
 *  - OLD_DATABASE_URL (source)
 *  - DATABASE_URL     (target)
 *
 * Notes:
 *  - Uses createMany({ skipDuplicates: true }) so you can re-run safely.
 *  - Inserts in chunks to avoid query / parameter limits.
 */

const OLD_DB = process.env.OLD_DATABASE_URL;
const NEW_DB = process.env.DATABASE_URL;

if (!OLD_DB) throw new Error("Missing OLD_DATABASE_URL");
if (!NEW_DB) throw new Error("Missing DATABASE_URL");

const oldDb = new PrismaClient({ datasources: { db: { url: OLD_DB } } });
const newDb = new PrismaClient({ datasources: { db: { url: NEW_DB } } });

/** Tune if you have very large tables */
const CHUNK_SIZE = Number(process.env.MIGRATE_CHUNK_SIZE ?? 1000);

function chunk<T>(arr: T[], size: number): T[][] {
  if (size <= 0) return [arr];
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function copyModel<T extends Record<string, any>>(
  name: string,
  readFn: () => Promise<T[]>,
  // IMPORTANT: writeFn may return PrismaPromise<BatchPayload> (createMany), not only Promise<void>
  writeFn: (rows: T[]) => Promise<unknown>
) {
  const rows = await readFn();
  console.log(`${name}: found ${rows.length}`);

  if (!rows.length) return;

  const parts = chunk(rows, CHUNK_SIZE);
  for (let i = 0; i < parts.length; i++) {
    const batch = parts[i];
    await writeFn(batch);
    console.log(`${name}: copied batch ${i + 1}/${parts.length} (${batch.length})`);
  }
}

async function main() {
  await oldDb.$connect();
  await newDb.$connect();

  // 1) справочники / master data
  await copyModel("User", () => oldDb.user.findMany(), (rows) =>
    newDb.user.createMany({ data: rows, skipDuplicates: true })
  );

  await copyModel("Client", () => oldDb.client.findMany(), (rows) =>
    newDb.client.createMany({ data: rows, skipDuplicates: true })
  );

  await copyModel("Driver", () => oldDb.driver.findMany(), (rows) =>
    newDb.driver.createMany({ data: rows, skipDuplicates: true })
  );

  await copyModel("Vehicle", () => oldDb.vehicle.findMany(), (rows) =>
    newDb.vehicle.createMany({ data: rows, skipDuplicates: true })
  );

  // 2) бизнес-данные
  await copyModel("Order", () => oldDb.order.findMany(), (rows) =>
    newDb.order.createMany({ data: rows, skipDuplicates: true })
  );

  await copyModel("Trip", () => oldDb.trip.findMany(), (rows) =>
    newDb.trip.createMany({ data: rows, skipDuplicates: true })
  );

  // 3) инвойсы
  await copyModel("Invoice", () => oldDb.invoice.findMany(), (rows) =>
    newDb.invoice.createMany({ data: rows, skipDuplicates: true })
  );

  await copyModel("InvoiceItem", () => oldDb.invoiceItem.findMany(), (rows) =>
    newDb.invoiceItem.createMany({ data: rows, skipDuplicates: true })
  );

  console.log("✅ DONE");
}

main()
  .catch((e) => {
    console.error("❌ FAILED:", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await oldDb.$disconnect();
    await newDb.$disconnect();
  });
