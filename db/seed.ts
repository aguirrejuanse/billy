/* eslint-disable no-console */
import "dotenv/config";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { inArray, isNull, and, eq } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

const isoDate = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const today = new Date();
today.setHours(0, 0, 0, 0);

const daysAgo = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - n);
  return isoDate(d);
};

const daysFromNow = (n: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() + n);
  return isoDate(d);
};

async function main() {
  console.log("🌱 Seeding database...");

  // ── Users ──────────────────────────────────────────────────────────────────
  const userDefs = [
    {
      clerkId: "user_3Djl6jdsuiMGYyJE7gEqdCRplqB",
      name: "Juan Aguirre",
      email: "juanseagui@gmail.com",
    },
    {
      clerkId: "user_3DyEtyScDW1J95UGCM2kU4V0hby",
      name: "Billy Demo",
      email: "demo@billy.app",
    },
  ];

  const resolvedUsers: Record<string, string> = {};

  for (const def of userDefs) {
    const [inserted] = await db.insert(schema.users).values(def).onConflictDoNothing().returning();

    if (inserted) {
      resolvedUsers[def.clerkId] = inserted.id;
    } else {
      const existing = await db.query.users.findFirst({
        where: (u, { eq }) => eq(u.clerkId, def.clerkId),
      });
      if (!existing) throw new Error(`Could not resolve user ${def.clerkId}`);
      resolvedUsers[def.clerkId] = existing.id;
    }
  }

  const juanId = resolvedUsers["user_3Djl6jdsuiMGYyJE7gEqdCRplqB"];
  const demoId = resolvedUsers["user_3DyEtyScDW1J95UGCM2kU4V0hby"];
  console.log("Users ready");

  // ── Global vendors ─────────────────────────────────────────────────────────
  const globalVendorDefs: schema.NewVendor[] = [
    { name: "Acme Corp", email: "billing@acme.com" },
    { name: "Globex Inc", email: "ap@globex.com" },
    { name: "Initech LLC", email: "invoices@initech.com" },
    { name: "Umbrella Co", email: "ap@umbrella.com" },
    { name: "Cyberdyne Systems", email: "billing@cyberdyne.io" },
    { name: "Soylent Corp", email: "finance@soylent.com" },
    { name: "Weyland-Yutani", email: "ap@weyland.corp" },
  ];

  const existingGlobal = await db.query.vendors.findMany({
    where: (v, { inArray, isNull, and }) =>
      and(
        inArray(
          v.name,
          globalVendorDefs.map((vv) => vv.name)
        ),
        isNull(v.ownerId)
      ),
  });

  const toInsert = globalVendorDefs.filter((vv) => !existingGlobal.find((v) => v.name === vv.name));
  const newGlobal =
    toInsert.length > 0 ? await db.insert(schema.vendors).values(toInsert).returning() : [];

  const allGlobal = [...existingGlobal, ...newGlobal];
  const byName = (name: string) => allGlobal.find((v) => v.name === name)!;

  const acme = byName("Acme Corp");
  const globex = byName("Globex Inc");
  const initech = byName("Initech LLC");
  const umbrella = byName("Umbrella Co");
  const cyberdyne = byName("Cyberdyne Systems");
  const soylent = byName("Soylent Corp");
  const weyland = byName("Weyland-Yutani");

  // ── Payment methods ────────────────────────────────────────────────────────
  const pmDefs: { name: string; methods: schema.VendorPaymentMethod["method"][] }[] = [
    { name: "Acme Corp", methods: ["ach", "wire"] },
    { name: "Globex Inc", methods: ["wire"] },
    { name: "Initech LLC", methods: ["check", "ach"] },
    { name: "Umbrella Co", methods: ["wire", "card"] },
    { name: "Cyberdyne Systems", methods: ["ach"] },
    { name: "Soylent Corp", methods: ["check"] },
    { name: "Weyland-Yutani", methods: ["wire", "ach"] },
  ];

  await db.delete(schema.vendorPaymentMethods).where(
    inArray(
      schema.vendorPaymentMethods.vendorId,
      allGlobal.map((v) => v.id)
    )
  );

  await db.insert(schema.vendorPaymentMethods).values(
    pmDefs.flatMap(({ name, methods }) => {
      const vendor = byName(name);
      return methods.map((method) => ({ vendorId: vendor.id, method }));
    })
  );

  console.log("Vendors + payment methods ready");

  // ── Seed bills for a given user ────────────────────────────────────────────
  await seedBillsForUser(juanId, "JUAN");
  await seedBillsForUser(demoId, "DEMO");

  console.log("✅ Seed complete!");
}

async function seedBillsForUser(ownerId: string, prefix: string) {
  const allGlobal = await db.query.vendors.findMany({
    where: (v, { isNull }) => isNull(v.ownerId),
  });

  const byName = (name: string) => allGlobal.find((v) => v.name === name)!;
  const acme = byName("Acme Corp");
  const globex = byName("Globex Inc");
  const initech = byName("Initech LLC");
  const umbrella = byName("Umbrella Co");
  const cyberdyne = byName("Cyberdyne Systems");
  const soylent = byName("Soylent Corp");
  const weyland = byName("Weyland-Yutani");

  // Delete existing data for this user (payments first to avoid FK violation)
  const existingBills = await db
    .select({ id: schema.bills.id })
    .from(schema.bills)
    .where(eq(schema.bills.ownerId, ownerId));
  if (existingBills.length > 0) {
    await db.delete(schema.payments).where(
      inArray(
        schema.payments.billId,
        existingBills.map((b) => b.id)
      )
    );
  }
  await db.delete(schema.bills).where(eq(schema.bills.ownerId, ownerId));

  const billsData: schema.NewBill[] = [
    // ── Current (due in future) ──────────────────────────────────────────────
    {
      vendorId: acme.id,
      ownerId,
      number: `${prefix}-001`,
      amount: "1200.00",
      status: "draft",
      invoiceDate: daysAgo(3),
      dueDate: daysFromNow(27),
      description: "Office supplies Q3",
      paymentType: "ach",
    },
    {
      vendorId: globex.id,
      ownerId,
      number: `${prefix}-002`,
      amount: "8500.00",
      status: "approved",
      invoiceDate: daysAgo(8),
      dueDate: daysFromNow(22),
      description: "Consulting services June",
      paymentType: "wire",
    },
    {
      vendorId: initech.id,
      ownerId,
      number: `${prefix}-003`,
      amount: "4750.00",
      status: "approved",
      invoiceDate: daysAgo(12),
      dueDate: daysFromNow(18),
      description: "Cloud infrastructure May",
      paymentType: "ach",
    },
    {
      vendorId: umbrella.id,
      ownerId,
      number: `${prefix}-004`,
      amount: "2300.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(5),
      dueDate: daysFromNow(10),
      description: "Security licensing Q2",
      paymentType: "wire",
    },
    {
      vendorId: cyberdyne.id,
      ownerId,
      number: `${prefix}-005`,
      amount: "960.00",
      status: "draft",
      invoiceDate: daysAgo(2),
      dueDate: daysFromNow(45),
      description: "AI model API access",
      paymentType: "ach",
    },
    // ── 1–30 days overdue ────────────────────────────────────────────────────
    {
      vendorId: globex.id,
      ownerId,
      number: `${prefix}-006`,
      amount: "3400.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(20),
      dueDate: daysAgo(5),
      description: "Data pipeline support",
      paymentType: "wire",
    },
    {
      vendorId: acme.id,
      ownerId,
      number: `${prefix}-007`,
      amount: "1850.00",
      status: "approved",
      invoiceDate: daysAgo(25),
      dueDate: daysAgo(10),
      description: "Printer maintenance contract",
      paymentType: "ach",
    },
    {
      vendorId: soylent.id,
      ownerId,
      number: `${prefix}-008`,
      amount: "720.50",
      status: "awaiting_approval",
      invoiceDate: daysAgo(30),
      dueDate: daysAgo(15),
      description: "Catering services April",
      paymentType: "check",
    },
    {
      vendorId: weyland.id,
      ownerId,
      number: `${prefix}-009`,
      amount: "5100.00",
      status: "approved",
      invoiceDate: daysAgo(28),
      dueDate: daysAgo(3),
      description: "R&D equipment lease",
      paymentType: "wire",
    },
    {
      vendorId: initech.id,
      ownerId,
      number: `${prefix}-010`,
      amount: "2200.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(35),
      dueDate: daysAgo(20),
      description: "ERP modules update",
      paymentType: "ach",
    },
    // ── 31–60 days overdue ───────────────────────────────────────────────────
    {
      vendorId: acme.id,
      ownerId,
      number: `${prefix}-011`,
      amount: "6300.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(55),
      dueDate: daysAgo(35),
      description: "Hardware refresh — workstations",
      paymentType: "ach",
    },
    {
      vendorId: globex.id,
      ownerId,
      number: `${prefix}-012`,
      amount: "3200.50",
      status: "awaiting_approval",
      invoiceDate: daysAgo(60),
      dueDate: daysAgo(40),
      description: "Software licenses batch",
      paymentType: "wire",
    },
    {
      vendorId: umbrella.id,
      ownerId,
      number: `${prefix}-013`,
      amount: "1475.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(52),
      dueDate: daysAgo(32),
      description: "Compliance audit Q1",
      paymentType: "wire",
    },
    {
      vendorId: cyberdyne.id,
      ownerId,
      number: `${prefix}-014`,
      amount: "8900.00",
      status: "approved",
      invoiceDate: daysAgo(58),
      dueDate: daysAgo(45),
      description: "ML infrastructure setup",
      paymentType: "ach",
    },
    // ── 61–90 days overdue ───────────────────────────────────────────────────
    {
      vendorId: acme.id,
      ownerId,
      number: `${prefix}-015`,
      amount: "650.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(85),
      dueDate: daysAgo(65),
      description: "Hardware maintenance",
      paymentType: "ach",
    },
    {
      vendorId: soylent.id,
      ownerId,
      number: `${prefix}-016`,
      amount: "2800.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(88),
      dueDate: daysAgo(70),
      description: "Office catering annual",
      paymentType: "check",
    },
    {
      vendorId: weyland.id,
      ownerId,
      number: `${prefix}-017`,
      amount: "11200.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(90),
      dueDate: daysAgo(75),
      description: "Lab equipment rental Q4",
      paymentType: "wire",
    },
    {
      vendorId: initech.id,
      ownerId,
      number: `${prefix}-018`,
      amount: "3650.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(82),
      dueDate: daysAgo(62),
      description: "Database migration phase 2",
      paymentType: "ach",
    },
    // ── 90+ days overdue ─────────────────────────────────────────────────────
    {
      vendorId: globex.id,
      ownerId,
      number: `${prefix}-019`,
      amount: "15000.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(130),
      dueDate: daysAgo(100),
      description: "Annual support contract",
      paymentType: "wire",
    },
    {
      vendorId: acme.id,
      ownerId,
      number: `${prefix}-020`,
      amount: "4400.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(125),
      dueDate: daysAgo(95),
      description: "Network infrastructure",
      paymentType: "ach",
    },
    {
      vendorId: cyberdyne.id,
      ownerId,
      number: `${prefix}-021`,
      amount: "22000.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(150),
      dueDate: daysAgo(120),
      description: "T-800 prototype lease",
      paymentType: "wire",
    },
    {
      vendorId: umbrella.id,
      ownerId,
      number: `${prefix}-022`,
      amount: "7800.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(140),
      dueDate: daysAgo(110),
      description: "Biohazard containment SLA",
      paymentType: "wire",
    },
    // ── Rejected / Archived ──────────────────────────────────────────────────
    {
      vendorId: acme.id,
      ownerId,
      number: `${prefix}-023`,
      amount: "990.00",
      status: "rejected",
      invoiceDate: daysAgo(15),
      dueDate: daysAgo(5),
      description: "Duplicate invoice",
      paymentType: "check",
    },
    {
      vendorId: soylent.id,
      ownerId,
      number: `${prefix}-024`,
      amount: "340.00",
      status: "archived",
      invoiceDate: daysAgo(60),
      dueDate: daysAgo(30),
      description: "Cancelled catering order",
      paymentType: "check",
    },
    // ── With payments (approved, will get payment records) ───────────────────
    {
      vendorId: acme.id,
      ownerId,
      number: `${prefix}-025`,
      amount: "3300.00",
      status: "approved",
      invoiceDate: daysAgo(20),
      dueDate: daysFromNow(10),
      description: "Security audit Q2",
      paymentType: "wire",
    },
    {
      vendorId: globex.id,
      ownerId,
      number: `${prefix}-026`,
      amount: "1800.00",
      status: "approved",
      invoiceDate: daysAgo(45),
      dueDate: daysAgo(15),
      description: "Data migration services",
      paymentType: "ach",
    },
    {
      vendorId: initech.id,
      ownerId,
      number: `${prefix}-027`,
      amount: "5600.00",
      status: "approved",
      invoiceDate: daysAgo(35),
      dueDate: daysAgo(5),
      description: "ERP integration phase 1",
      paymentType: "ach",
    },
    {
      vendorId: weyland.id,
      ownerId,
      number: `${prefix}-028`,
      amount: "9200.00",
      status: "approved",
      invoiceDate: daysAgo(10),
      dueDate: daysFromNow(20),
      description: "Xenomorph containment units",
      paymentType: "wire",
    },
  ];

  const insertedBills = await db.insert(schema.bills).values(billsData).returning();
  console.log(`  ${insertedBills.length} bills created for ${prefix}`);

  // ── Line items ─────────────────────────────────────────────────────────────
  const lineItems: schema.NewBillLineItem[] = insertedBills.flatMap((bill) => {
    const amount = Number(bill.amount);
    const half = (amount / 2).toFixed(2);
    const rest = (amount - Number(half)).toFixed(2);
    return [
      {
        billId: bill.id,
        description: `${bill.description} — line 1`,
        amount: half,
        accountCode: "7000",
      },
      {
        billId: bill.id,
        description: `${bill.description} — line 2`,
        amount: rest,
        accountCode: "7000",
      },
    ];
  });

  await db.insert(schema.billLineItems).values(lineItems);
  console.log(`  ${lineItems.length} line items created for ${prefix}`);

  // ── Payments ───────────────────────────────────────────────────────────────
  const b = (num: string) => insertedBills.find((b) => b.number === `${prefix}-${num}`)!;

  await db.insert(schema.payments).values([
    {
      billId: b("025").id,
      vendorId: acme.id,
      amount: b("025").amount,
      status: "initiated",
      scheduledDate: daysAgo(2),
      initiatedAt: new Date(),
      paymentMethod: "wire",
      notes: "Released — awaiting confirmation",
    },
    {
      billId: b("026").id,
      vendorId: globex.id,
      amount: b("026").amount,
      status: "paid",
      scheduledDate: daysAgo(20),
      initiatedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      paidAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      paymentMethod: "ach",
      notes: "Confirmed by bank",
    },
    {
      billId: b("027").id,
      vendorId: initech.id,
      amount: b("027").amount,
      status: "failed",
      scheduledDate: daysAgo(10),
      initiatedAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
      paymentMethod: "ach",
      notes: "Insufficient funds — retry when resolved",
    },
    {
      billId: b("028").id,
      vendorId: weyland.id,
      amount: b("028").amount,
      status: "scheduled",
      scheduledDate: daysFromNow(20),
      paymentMethod: "wire",
      notes: "Scheduled via approval flow",
    },
    {
      billId: b("003").id,
      vendorId: initech.id,
      amount: b("003").amount,
      status: "scheduled",
      scheduledDate: daysFromNow(18),
      paymentMethod: "ach",
      notes: "Scheduled via approval flow",
    },
    {
      billId: b("002").id,
      vendorId: globex.id,
      amount: b("002").amount,
      status: "scheduled",
      scheduledDate: daysFromNow(22),
      paymentMethod: "wire",
      notes: "Scheduled via approval flow",
    },
  ]);
  console.log(`  6 payments created for ${prefix}`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
