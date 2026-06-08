import { z } from "zod";
import { currencyEnum, paymentMethodEnum } from "@/db/schema";

export const MAX_FILE_SIZE_MB = 10;

export const importBillRowSchema = z
  .object({
    vendor_name: z.string().min(1, "vendor_name is required").max(255),
    number: z.string().min(1, "number is required").max(100),
    amount: z.coerce
      .number()
      .positive("amount must be a positive number")
      .max(99_999_999.99, "amount exceeds maximum"),
    currency: z.preprocess((v) => (v === "" ? "USD" : v), z.enum(currencyEnum.enumValues)),
    invoice_date: z.iso.date(),
    due_date: z.iso.date(),
    description: z.preprocess((v) => (v === "" ? undefined : v), z.string().max(5000).optional()),
    payment_type: z.preprocess(
      (v) => (typeof v === "string" ? v.toLowerCase() : v),
      z.enum(paymentMethodEnum.enumValues, {
        error: "payment_type must be ach, wire, check, or card",
      })
    ),
  })
  .refine((d) => d.due_date >= d.invoice_date, {
    message: "due_date must be on or after invoice_date",
    path: ["due_date"],
  });

export const MAX_CSV_ROWS = 50;
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
