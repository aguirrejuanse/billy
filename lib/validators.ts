import { z } from "zod";
import { currencyEnum, paymentMethodEnum, paymentStatusEnum } from "@/db/schema";

const nonEmptyString = z.string().min(1);
const positiveAmount = z.coerce.number().positive();

export const createVendorSchema = z.object({
  name: nonEmptyString,
  email: z.email().optional().or(z.literal("")),
  paymentMethod: z.enum(paymentMethodEnum.enumValues),
});

export const createBillSchema = z.object({
  vendorId: z.uuid(),
  number: nonEmptyString,
  amount: positiveAmount,
  currency: z.enum(currencyEnum.enumValues).default("USD"),
  invoiceDate: nonEmptyString,
  dueDate: nonEmptyString,
  description: z.string().optional(),
  paymentType: z.enum(paymentMethodEnum.enumValues),
  lineItems: z
    .array(
      z.object({
        description: nonEmptyString,
        amount: positiveAmount,
        accountCode: z.string().optional(),
      })
    )
    .optional(),
});

export const updatePaymentStatusSchema = z.object({
  status: z.enum(paymentStatusEnum.enumValues),
  notes: z.string().optional(),
});

export const billActionSchema = z.object({
  action: z.enum(["submit", "approve", "reject", "archive"]),
});

export type CreateVendorInput = z.infer<typeof createVendorSchema>;
export type CreateBillInput = z.infer<typeof createBillSchema>;
export type CreateBillFormInput = z.input<typeof createBillSchema>;
export type UpdatePaymentStatusInput = z.infer<typeof updatePaymentStatusSchema>;
export type BillActionInput = z.infer<typeof billActionSchema>;
