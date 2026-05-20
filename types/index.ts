import type { Bill, BillLineItem, Payment, User, Vendor } from "@/db/schema";

export type { Bill, BillLineItem, Payment, User, Vendor };
export type { NewBill, NewPayment, NewVendor } from "@/db/schema";

export type VendorWithMethods = Vendor & {
  paymentMethods: Bill["paymentType"][];
};

export type BillWithRelations = Bill & {
  vendor: Vendor | null;
  lineItems: BillLineItem[];
  payment: Payment | null;
};

export type PaymentWithRelations = Payment & {
  bill: Bill;
  vendor: Vendor;
};

export interface BillDetailParams {
  id: string;
}

export interface AgingRow {
  vendorId: string;
  vendorName: string;
  current: number;
  days1_30: number;
  days31_60: number;
  days61_90: number;
  days90plus: number;
  total: number;
}

export interface AgingSummary {
  totalOutstanding: number;
  totalOverdue: number;
  overdueBillCount: number;
}

export interface AgingReportData {
  rows: AgingRow[];
  summary: AgingSummary;
}
