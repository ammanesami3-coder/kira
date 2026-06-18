// ─────────────────────────────────────────────────────────────
// Kira — Phase 1 · DB verification harness (no Docker required)
// ─────────────────────────────────────────────────────────────
// Loads every migration + seed into an in-memory Postgres (PGlite,
// real Postgres compiled to WASM) and asserts the Phase 1 guarantees:
//   • DB-level double-booking prevention (exclusion constraints)
//   • is_car_available() correctness
//   • car_unavailable_ranges exposes ranges only (no PII)
//   • RLS: anon cannot read PII / cannot write cars; sees only
//     available cars + the public view
//   • the seed dataset loads and reads back
//
// Run with:  pnpm db:test
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { PGlite } from "@electric-sql/pglite";
import { btree_gist } from "@electric-sql/pglite/contrib/btree_gist";

const here = dirname(fileURLToPath(import.meta.url));
const migrationsDir = join(here, "..", "migrations");
const seedFile = join(here, "..", "seed.sql");

let passed = 0;
let failed = 0;
function ok(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}
function bad(name, detail) {
  failed++;
  console.log(`  ✗ ${name}\n      ${detail}`);
}
async function expectThrows(name, fn) {
  try {
    await fn();
    bad(name, "expected an error but the statement succeeded");
  } catch {
    ok(name);
  }
}
function expectEqual(name, actual, expected) {
  if (actual === expected) ok(name);
  else bad(name, `expected ${expected}, got ${actual}`);
}

const db = new PGlite({ extensions: { btree_gist } });

// Supabase provides these roles in production; create them here so the
// GRANTs and RLS policies in the migrations resolve. service_role
// bypasses RLS, mirroring Supabase.
await db.exec(`
  create role anon nologin;
  create role authenticated nologin;
  create role service_role nologin bypassrls;
`);

// ── Apply migrations in order ──────────────────────────────────────
const files = readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();
for (const f of files) {
  await db.exec(readFileSync(join(migrationsDir, f), "utf8"));
}
console.log(`\nApplied ${files.length} migrations.`);

// ── Apply seed ─────────────────────────────────────────────────────
await db.exec(readFileSync(seedFile, "utf8"));
console.log("Applied seed.\n");

const CAR_LOGAN = "c0000000-0000-0000-0000-000000000001";
const CAR_MERCEDES = "c0000000-0000-0000-0000-000000000005";

// ════════════════════════════════════════════════════════════════════
console.log("1) DB-level double-booking prevention");
// Confirmed booking on Logan exists 2026-07-01..07-05.
await expectThrows("overlapping CONFIRMED booking is rejected", () =>
  db.exec(`insert into bookings (car_id, customer_name, customer_phone, period, total_price, status)
           values ('${CAR_LOGAN}','Overlap','+212600000001',daterange('2026-07-03','2026-07-06','[)'),500,'confirmed');`),
);
await db.exec(
  `insert into bookings (car_id, customer_name, customer_phone, period, total_price, status)
   values ('${CAR_LOGAN}','BackToBack','+212600000002',daterange('2026-07-05','2026-07-09','[)'),700,'confirmed');`,
);
ok("adjacent (back-to-back) CONFIRMED booking is allowed");

// Two pending requests for the same slot are allowed (only confirmed reserve).
await db.exec(
  `insert into bookings (car_id, customer_name, customer_phone, period, total_price, status)
   values ('${CAR_MERCEDES}','Pending2','+212600000003',daterange('2026-06-25','2026-06-28','[)'),4500,'pending');`,
);
ok("two PENDING bookings on the same slot are allowed");

// Blocked period overlap (Logan blocked 2026-08-01..08-05).
await expectThrows("overlapping blocked_period is rejected", () =>
  db.exec(`insert into blocked_periods (car_id, period, reason)
           values ('${CAR_LOGAN}',daterange('2026-08-03','2026-08-06','[)'),'maintenance');`),
);

// ════════════════════════════════════════════════════════════════════
console.log("\n2) is_car_available()");
async function avail(car, s, e) {
  const r = await db.query(`select is_car_available($1,$2,$3) as a`, [
    car,
    s,
    e,
  ]);
  return r.rows[0].a;
}
expectEqual(
  "overlaps confirmed → false",
  await avail(CAR_LOGAN, "2026-07-02", "2026-07-04"),
  false,
);
expectEqual(
  "adjacent to confirmed → true",
  await avail(CAR_LOGAN, "2026-07-09", "2026-07-12"),
  true,
);
expectEqual(
  "overlaps blocked → false",
  await avail(CAR_LOGAN, "2026-08-02", "2026-08-04"),
  false,
);
expectEqual(
  "free window → true",
  await avail(CAR_LOGAN, "2026-09-01", "2026-09-05"),
  true,
);
expectEqual(
  "pending does NOT block → true",
  await avail(CAR_MERCEDES, "2026-06-25", "2026-06-28"),
  true,
);
expectEqual(
  "invalid range (end<=start) → false",
  await avail(CAR_LOGAN, "2026-07-05", "2026-07-05"),
  false,
);

// ════════════════════════════════════════════════════════════════════
console.log("\n3) car_unavailable_ranges — ranges only, no PII");
const cols = await db.query(
  `select column_name from information_schema.columns
   where table_name = 'car_unavailable_ranges' order by ordinal_position`,
);
const colNames = cols.rows.map((r) => r.column_name).join(",");
expectEqual(
  "view columns are exactly car_id,start_date,end_date",
  colNames,
  "car_id,start_date,end_date",
);
// 2 confirmed (seed) + 1 added back-to-back = 3 confirmed ranges, + 2 blocked = 5. Pending excluded.
const vcount = await db.query(
  `select count(*)::int as c from car_unavailable_ranges`,
);
expectEqual(
  "view excludes pending; counts confirmed + blocked",
  vcount.rows[0].c,
  5,
);

// ════════════════════════════════════════════════════════════════════
console.log("\n4) RLS — anon is locked down");
await db.exec(`set role anon;`);
await expectThrows("anon CANNOT read bookings (PII)", () =>
  db.query(`select * from bookings`),
);
await expectThrows("anon CANNOT read blocked_periods", () =>
  db.query(`select * from blocked_periods`),
);
await expectThrows("anon CANNOT insert into cars", () =>
  db.query(`insert into cars (slug,name,brand,model,year,category,transmission,fuel_type,seats,doors,price_per_day)
            values ('x','x','x','x',2024,'economy','manual','diesel',5,4,100)`),
);
const anonCars = await db.query(`select count(*)::int as c from cars`);
expectEqual("anon sees only AVAILABLE cars (6 of 7)", anonCars.rows[0].c, 6);
const anonView = await db.query(
  `select count(*)::int as c from car_unavailable_ranges`,
);
expectEqual("anon CAN read the PII-free view", anonView.rows[0].c, 5);
const anonAvail = await db.query(`select is_car_available($1,$2,$3) as a`, [
  CAR_LOGAN,
  "2026-07-02",
  "2026-07-04",
]);
expectEqual("anon CAN call is_car_available", anonAvail.rows[0].a, false);
await db.exec(`reset role;`);

// ════════════════════════════════════════════════════════════════════
console.log("\n5) Seed dataset reads back");
const carCount = await db.query(`select count(*)::int as c from cars`);
expectEqual("7 cars seeded", carCount.rows[0].c, 7);
const imgCount = await db.query(`select count(*)::int as c from car_images`);
expectEqual("8 images seeded", imgCount.rows[0].c, 8);
const ref = await db.query(
  `select reference from bookings where id = 'b0000000-0000-0000-0000-000000000001'`,
);
expectEqual(
  "booking reference seeded",
  ref.rows[0].reference,
  "KR-2026-000001",
);
const gen = await db.query(
  `select start_date::text s, end_date::text e, total_days from bookings where id='b0000000-0000-0000-0000-000000000001'`,
);
expectEqual("generated start_date", gen.rows[0].s, "2026-07-01");
expectEqual("generated end_date", gen.rows[0].e, "2026-07-05");
expectEqual("generated total_days", gen.rows[0].total_days, 4);

// ════════════════════════════════════════════════════════════════════
console.log(`\n──────────────\n${passed} passed, ${failed} failed`);
await db.close();
process.exit(failed === 0 ? 0 : 1);
