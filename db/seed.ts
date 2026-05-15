/* eslint-disable no-console */
import "dotenv/config";
import { db } from "./index";
import * as schema from "./schema";

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
  { name: "Acme Corp", email: "billing@acme.com", paymentMethod: "ach" },
  { name: "Globex Inc", email: "ap@globex.com", paymentMethod: "wire" },
  { name: "Initech LLC", email: "invoices@initech.com", paymentMethod: "check" },
];

async function seedVendorsAndBills(ownerId: string) {
  // Vendors
  const [acme, globex, initech] = await db.insert(schema.vendors).values(vendorValues).returning();

  console.log("Vendors created");

  // Bills: spread across AP aging buckets
  const today = new Date();
  const daysAgo = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() - n);
    return d.toISOString().split("T")[0];
  };
  const daysFromNow = (n: number) => {
    const d = new Date(today);
    d.setDate(d.getDate() + n);
    return d.toISOString().split("T")[0];
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
      default:
        return [];
    }
  });

  await db.insert(schema.billLineItems).values(lineItemsData);
  console.log(`${lineItemsData.length} line items created`);

  // Payment for the approved bill (BILL-006)
  const approvedBill = insertedBills.find((b) => b.number === "BILL-006")!;
  await db.insert(schema.payments).values({
    billId: approvedBill.id,
    vendorId: initech.id,
    amount: approvedBill.amount,
    status: "scheduled",
    scheduledDate: daysFromNow(5),
    paymentMethod: "ach",
    notes: "Scheduled via approval flow",
  });
  console.log("Payment created for BILL-006");

  console.log("Seed complete!");
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
