import { z } from "zod";
import { currencyEnum, paymentMethodEnum } from "@/db/schema";

export const importBillRowSchema = z
  .object({
    vendor_name: z.string().min(1, "vendor_name is required"),
    number: z.string().min(1, "number is required"),
    amount: z.coerce.number().positive("amount must be a positive number"),
    currency: z.preprocess((v) => (v === "" ? "USD" : v), z.enum(currencyEnum.enumValues)),
    invoice_date: z.iso.date(),
    due_date: z.iso.date(),
    description: z.preprocess((v) => (v === "" ? undefined : v), z.string().optional()),
    payment_type: z.enum(paymentMethodEnum.enumValues, {
      error: "payment_type must be ach, wire, check, or card",
    }),
  })
  .refine((d) => d.due_date >= d.invoice_date, {
    message: "due_date must be on or after invoice_date",
    path: ["due_date"],
  });

export const REQUIRED_CSV_COLUMNS = [
  "vendor_name",
  "number",
  "amount",
  "invoice_date",
  "due_date",
  "payment_type",
] as const;

export type ImportBillRow = z.infer<typeof importBillRowSchema>;

export type RowError = { row: number; error: string };

export interface ImportResult {
  imported: number;
  errors: RowError[];
}
