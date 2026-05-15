import type { Bill, BillLineItem, Payment, User, Vendor } from "@/db/schema";

export type { Bill, BillLineItem, Payment, User, Vendor };
export type { NewBill, NewPayment, NewVendor } from "@/db/schema";

export type BillWithRelations = Bill & {
  vendor: Vendor;
  owner: User;
  lineItems: BillLineItem[];
  payment: Payment | null;
};

export type PaymentWithRelations = Payment & {
  bill: Bill;
  vendor: Vendor;
};
