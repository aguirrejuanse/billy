import { z } from "zod";
import { currencyEnum, paymentMethodEnum, paymentStatusEnum } from "@/db/schema";

const nonEmptyString = z.string().min(1);

export const createVendorSchema = z.object({
  name: nonEmptyString,
  email: z.email().optional().or(z.literal("")),
  paymentMethod: z.enum(paymentMethodEnum.enumValues),
});

const billSchemaErrorMessages = {
  vendorId: "Please select a vendor",
  number: "Bill number is required",
  amount: "Amount must be greater than zero",
  invoiceDate: "Invoice date is required",
  dueDate: "Due date is required",
  description: "Description is required",
};

export const createBillSchema = z.object({
  vendorId: z.uuid({ error: billSchemaErrorMessages.vendorId }),
  number: z.string().min(1, { message: billSchemaErrorMessages.number }),
  amount: z.coerce.number().positive({ message: billSchemaErrorMessages.amount }),
  currency: z.enum(currencyEnum.enumValues).default("USD"),
  invoiceDate: z.string().min(1, { message: billSchemaErrorMessages.invoiceDate }),
  dueDate: z.string().min(1, { message: billSchemaErrorMessages.dueDate }),
  description: z.string().optional(),
  paymentType: z.enum(paymentMethodEnum.enumValues),
  lineItems: z
    .array(
      z.object({
        description: z.string().min(1, { message: billSchemaErrorMessages.description }),
        amount: z.coerce.number().positive({ message: billSchemaErrorMessages.amount }),
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
