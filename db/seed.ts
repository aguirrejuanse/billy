/* eslint-disable no-console */
import "dotenv/config";
import ws from "ws";
import { neonConfig } from "@neondatabase/serverless";
import { inArray } from "drizzle-orm";
import { db } from "./index";
import * as schema from "./schema";

neonConfig.webSocketConstructor = ws;

async function main() {
  console.log("🌱 Seeding database...");

  const userValues = {
    clerkId: "user_3Djl6jdsuiMGYyJE7gEqdCRplqB",
    name: "Juan Aguirre",
    email: "juanseagui@gmail.com",
  };

  // User
  const [user] = await db.insert(schema.users).values(userValues).onConflictDoNothing().returning();

  const ownerId = user?.id;
  if (!ownerId) {
    const existing = await db.query.users.findFirst({
      where: (u, { eq }) => eq(u.clerkId, userValues.clerkId),
    });
    if (!existing) throw new Error("Could not create or find user");
    console.log("User already exists, using existing record");
    await seedVendorsAndBills(existing.id);
    return;
  }

  await seedVendorsAndBills(ownerId);
}

const vendorValues: schema.NewVendor[] = [
  { name: "Acme Corp", email: "billing@acme.com" },
  { name: "Globex Inc", email: "ap@globex.com" },
  { name: "Initech LLC", email: "invoices@initech.com" },
];

const vendorPaymentMethodValues: {
  name: string;
  methods: schema.VendorPaymentMethod["method"][];
}[] = [
  { name: "Acme Corp", methods: ["ach", "wire"] },
  { name: "Globex Inc", methods: ["wire"] },
  { name: "Initech LLC", methods: ["check", "ach"] },
];

async function seedVendorsAndBills(ownerId: string) {
  // Find or create global vendors
  const existingVendors = await db.query.vendors.findMany({
    where: (v, { inArray, isNull, and }) =>
      and(
        inArray(
          v.name,
          vendorValues.map((vv) => vv.name)
        ),
        isNull(v.ownerId)
      ),
  });

  const toInsert = vendorValues.filter((vv) => !existingVendors.find((v) => v.name === vv.name));
  const newVendors =
    toInsert.length > 0 ? await db.insert(schema.vendors).values(toInsert).returning() : [];

  const allVendors = [...existingVendors, ...newVendors];
  const [acme, globex, initech] = vendorValues.map(
    (vv) => allVendors.find((v) => v.name === vv.name)!
  );

  // Repopulate payment methods (delete existing first to avoid duplicates)
  await db
    .delete(schema.vendorPaymentMethods)
    .where(inArray(schema.vendorPaymentMethods.vendorId, [acme.id, globex.id, initech.id]));

  await db.insert(schema.vendorPaymentMethods).values(
    [acme, globex, initech].flatMap((vendor) => {
      const entry = vendorPaymentMethodValues.find((v) => v.name === vendor.name)!;
      return entry.methods.map((method) => ({ vendorId: vendor.id, method }));
    })
  );

  console.log("Vendors created");

  // Bills: spread across AP aging buckets
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

  const billsData: schema.NewBill[] = [
    // draft
    {
      vendorId: acme.id,
      ownerId,
      number: "BILL-001",
      amount: "1200.00",
      status: "draft",
      invoiceDate: daysAgo(5),
      dueDate: daysFromNow(25),
      description: "Office supplies Q2",
      paymentType: "ach",
    },
    // awaiting_approval — current (0-30 days overdue)
    {
      vendorId: globex.id,
      ownerId,
      number: "BILL-002",
      amount: "8500.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(10),
      dueDate: daysAgo(3),
      description: "Consulting services March",
      paymentType: "wire",
    },
    // awaiting_approval — 31-60 days overdue
    {
      vendorId: initech.id,
      ownerId,
      number: "BILL-003",
      amount: "3200.50",
      status: "awaiting_approval",
      invoiceDate: daysAgo(50),
      dueDate: daysAgo(40),
      description: "Software licenses",
      paymentType: "check",
    },
    // awaiting_approval — 61-90 days overdue
    {
      vendorId: acme.id,
      ownerId,
      number: "BILL-004",
      amount: "650.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(80),
      dueDate: daysAgo(65),
      description: "Hardware maintenance",
      paymentType: "ach",
    },
    // awaiting_approval — +90 days overdue
    {
      vendorId: globex.id,
      ownerId,
      number: "BILL-005",
      amount: "15000.00",
      status: "awaiting_approval",
      invoiceDate: daysAgo(120),
      dueDate: daysAgo(95),
      description: "Annual support contract",
      paymentType: "wire",
    },
    // approved
    {
      vendorId: initech.id,
      ownerId,
      number: "BILL-006",
      amount: "4750.00",
      status: "approved",
      invoiceDate: daysAgo(30),
      dueDate: daysFromNow(5),
      description: "Cloud infrastructure April",
      paymentType: "ach",
    },
    // rejected
    {
      vendorId: acme.id,
      ownerId,
      number: "BILL-007",
      amount: "990.00",
      status: "rejected",
      invoiceDate: daysAgo(15),
      dueDate: daysAgo(5),
      description: "Duplicate invoice",
      paymentType: "check",
    },
    // draft — future due date
    {
      vendorId: globex.id,
      ownerId,
      number: "BILL-008",
      amount: "2100.75",
      status: "draft",
      invoiceDate: daysAgo(2),
      dueDate: daysFromNow(45),
      description: "Design services May",
      paymentType: "wire",
    },
    // approved — will get an initiated payment
    {
      vendorId: acme.id,
      ownerId,
      number: "BILL-009",
      amount: "3300.00",
      status: "approved",
      invoiceDate: daysAgo(20),
      dueDate: daysFromNow(10),
      description: "Security audit Q2",
      paymentType: "wire",
    },
    // approved — will get a paid payment
    {
      vendorId: globex.id,
      ownerId,
      number: "BILL-010",
      amount: "1800.00",
      status: "approved",
      invoiceDate: daysAgo(45),
      dueDate: daysAgo(15),
      description: "Data migration services",
      paymentType: "ach",
    },
    // approved — will get a failed payment
    {
      vendorId: initech.id,
      ownerId,
      number: "BILL-011",
      amount: "5600.00",
      status: "approved",
      invoiceDate: daysAgo(35),
      dueDate: daysAgo(5),
      description: "ERP integration phase 1",
      paymentType: "ach",
    },
  ];

  const insertedBills = await db.insert(schema.bills).values(billsData).returning();
  console.log(`${insertedBills.length} bills created`);

  // Line items for each bill
  const lineItemsData: schema.NewBillLineItem[] = insertedBills.flatMap((bill) => {
    switch (bill.number) {
      case "BILL-001":
        return [
          {
            billId: bill.id,
            description: "Paper & printing supplies",
            amount: "450.00",
            accountCode: "6100",
          },
          {
            billId: bill.id,
            description: "Desk organizers",
            amount: "350.00",
            accountCode: "6100",
          },
          {
            billId: bill.id,
            description: "Printer cartridges",
            amount: "400.00",
            accountCode: "6100",
          },
        ];
      case "BILL-002":
        return [
          {
            billId: bill.id,
            description: "Strategy consulting (40h)",
            amount: "6000.00",
            accountCode: "7200",
          },
          {
            billId: bill.id,
            description: "Workshop facilitation",
            amount: "2500.00",
            accountCode: "7200",
          },
        ];
      case "BILL-003":
        return [
          {
            billId: bill.id,
            description: "Annual Jira license",
            amount: "1200.50",
            accountCode: "7400",
          },
          {
            billId: bill.id,
            description: "Annual Figma license",
            amount: "800.00",
            accountCode: "7400",
          },
          {
            billId: bill.id,
            description: "GitHub Teams (10 seats)",
            amount: "1200.00",
            accountCode: "7400",
          },
        ];
      case "BILL-004":
        return [
          {
            billId: bill.id,
            description: "Server rack cleaning",
            amount: "350.00",
            accountCode: "6500",
          },
          {
            billId: bill.id,
            description: "Cable management",
            amount: "300.00",
            accountCode: "6500",
          },
        ];
      case "BILL-005":
        return [
          {
            billId: bill.id,
            description: "24/7 support contract",
            amount: "12000.00",
            accountCode: "7300",
          },
          {
            billId: bill.id,
            description: "SLA premium tier",
            amount: "3000.00",
            accountCode: "7300",
          },
        ];
      case "BILL-006":
        return [
          {
            billId: bill.id,
            description: "AWS EC2 instances",
            amount: "2750.00",
            accountCode: "7500",
          },
          {
            billId: bill.id,
            description: "AWS S3 storage",
            amount: "1000.00",
            accountCode: "7500",
          },
          {
            billId: bill.id,
            description: "Bandwidth overage",
            amount: "1000.00",
            accountCode: "7500",
          },
        ];
      case "BILL-007":
        return [
          {
            billId: bill.id,
            description: "Office supplies (duplicate)",
            amount: "990.00",
            accountCode: "6100",
          },
        ];
      case "BILL-008":
        return [
          {
            billId: bill.id,
            description: "UI/UX design system",
            amount: "1500.75",
            accountCode: "7200",
          },
          {
            billId: bill.id,
            description: "Prototype & testing",
            amount: "600.00",
            accountCode: "7200",
          },
        ];
      case "BILL-009":
        return [
          {
            billId: bill.id,
            description: "Penetration testing",
            amount: "2000.00",
            accountCode: "7600",
          },
          {
            billId: bill.id,
            description: "Vulnerability report",
            amount: "1300.00",
            accountCode: "7600",
          },
        ];
      case "BILL-010":
        return [
          {
            billId: bill.id,
            description: "Data extraction & mapping",
            amount: "1000.00",
            accountCode: "7200",
          },
          {
            billId: bill.id,
            description: "Migration execution",
            amount: "800.00",
            accountCode: "7200",
          },
        ];
      case "BILL-011":
        return [
          {
            billId: bill.id,
            description: "ERP setup & configuration",
            amount: "3600.00",
            accountCode: "7500",
          },
          {
            billId: bill.id,
            description: "Staff training (2 days)",
            amount: "2000.00",
            accountCode: "7500",
          },
        ];
      default:
        return [];
    }
  });

  await db.insert(schema.billLineItems).values(lineItemsData);
  console.log(`${lineItemsData.length} line items created`);

  const bill006 = insertedBills.find((b) => b.number === "BILL-006")!;
  const bill009 = insertedBills.find((b) => b.number === "BILL-009")!;
  const bill010 = insertedBills.find((b) => b.number === "BILL-010")!;
  const bill011 = insertedBills.find((b) => b.number === "BILL-011")!;

  await db.insert(schema.payments).values([
    {
      billId: bill006.id,
      vendorId: initech.id,
      amount: bill006.amount,
      status: "scheduled",
      scheduledDate: daysFromNow(5),
      paymentMethod: "ach",
      notes: "Scheduled via approval flow",
    },
    {
      billId: bill009.id,
      vendorId: acme.id,
      amount: bill009.amount,
      status: "initiated",
      scheduledDate: daysAgo(2),
      initiatedAt: new Date(),
      paymentMethod: "wire",
      notes: "Released — awaiting confirmation",
    },
    {
      billId: bill010.id,
      vendorId: globex.id,
      amount: bill010.amount,
      status: "paid",
      scheduledDate: daysAgo(20),
      initiatedAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000),
      paidAt: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000),
      paymentMethod: "ach",
      notes: "Confirmed by bank",
    },
    {
      billId: bill011.id,
      vendorId: initech.id,
      amount: bill011.amount,
      status: "failed",
      scheduledDate: daysAgo(10),
      initiatedAt: new Date(today.getTime() - 8 * 24 * 60 * 60 * 1000),
      paymentMethod: "ach",
      notes: "Insufficient funds — retry when resolved",
    },
  ]);
  console.log("4 payments created (scheduled, initiated, paid, failed)");

  console.log("Seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
