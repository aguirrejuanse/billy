import { pgTable, pgEnum, uuid, text, numeric, date, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import type { InferSelectModel, InferInsertModel } from "drizzle-orm";

export const currencyEnum = pgEnum("currency", ["USD", "EUR", "ARS"]);
export const paymentMethodEnum = pgEnum("payment_method", ["ach", "wire", "check", "card"]);

export const billStatusEnum = pgEnum("bill_status", [
  "draft",
  "awaiting_approval",
  "approved",
  "rejected",
  "archived",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "scheduled",
  "initiated",
  "paid",
  "failed",
]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  clerkId: text("clerk_id").notNull().unique(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const vendors = pgTable("vendors", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("ach"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const bills = pgTable("bills", {
  id: uuid("id").primaryKey().defaultRandom(),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  number: text("number").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  currency: currencyEnum("currency").notNull().default("USD"),
  status: billStatusEnum("status").notNull().default("draft"),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  description: text("description"),
  paymentType: paymentMethodEnum("payment_type").notNull().default("ach"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const billLineItems = pgTable("bill_line_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  accountCode: text("account_code"),
});

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  billId: uuid("bill_id")
    .notNull()
    .references(() => bills.id),
  vendorId: uuid("vendor_id")
    .notNull()
    .references(() => vendors.id),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  status: paymentStatusEnum("status").notNull().default("scheduled"),
  scheduledDate: date("scheduled_date").notNull(),
  initiatedAt: timestamp("initiated_at"),
  paidAt: timestamp("paid_at"),
  paymentMethod: paymentMethodEnum("payment_method").notNull().default("ach"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  bills: many(bills),
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  bills: many(bills),
  payments: many(payments),
}));

export const billsRelations = relations(bills, ({ one, many }) => ({
  vendor: one(vendors, { fields: [bills.vendorId], references: [vendors.id] }),
  owner: one(users, { fields: [bills.ownerId], references: [users.id] }),
  lineItems: many(billLineItems),
  payment: one(payments, { fields: [bills.id], references: [payments.billId] }),
}));

export const billLineItemsRelations = relations(billLineItems, ({ one }) => ({
  bill: one(bills, { fields: [billLineItems.billId], references: [bills.id] }),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  bill: one(bills, { fields: [payments.billId], references: [bills.id] }),
  vendor: one(vendors, { fields: [payments.vendorId], references: [vendors.id] }),
}));

// Inferred types
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;

export type Vendor = InferSelectModel<typeof vendors>;
export type NewVendor = InferInsertModel<typeof vendors>;

export type Bill = InferSelectModel<typeof bills>;
export type NewBill = InferInsertModel<typeof bills>;

export type BillLineItem = InferSelectModel<typeof billLineItems>;
export type NewBillLineItem = InferInsertModel<typeof billLineItems>;

export type Payment = InferSelectModel<typeof payments>;
export type NewPayment = InferInsertModel<typeof payments>;
