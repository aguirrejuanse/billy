import { describe, it, expect } from "vitest";
import { createBillSchema, billSchemaErrorMessages } from "./validators";
import { currencyEnum, paymentMethodEnum } from "@/db/schema";

const validBill = {
  vendorId: "a1b2c3d4-e5f6-4789-ab12-cd34ef567890",
  number: "INV-001",
  amount: 100,
  currency: currencyEnum.enumValues[0],
  invoiceDate: "2024-01-15",
  dueDate: "2024-02-15",
  paymentType: paymentMethodEnum.enumValues[0],
};

function findIssue(result: ReturnType<typeof createBillSchema.safeParse>, path: string) {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === path);
}

function findLineItemIssue(result: ReturnType<typeof createBillSchema.safeParse>, field: string) {
  if (result.success) return undefined;
  return result.error.issues.find((i) => i.path[0] === "lineItems" && i.path[2] === field);
}

describe("createBillSchema", () => {
  describe("happy path", () => {
    it("accepts valid minimal input", () => {
      expect(createBillSchema.safeParse(validBill).success).toBe(true);
    });

    it("accepts valid input with lineItems", () => {
      const result = createBillSchema.safeParse({
        ...validBill,
        lineItems: [{ description: "Service fee", amount: 50 }],
      });
      expect(result.success).toBe(true);
    });

    it("accepts dueDate equal to invoiceDate", () => {
      const result = createBillSchema.safeParse({
        ...validBill,
        invoiceDate: "2024-01-15",
        dueDate: "2024-01-15",
      });
      expect(result.success).toBe(true);
    });

    it("defaults currency to USD when omitted", () => {
      const { currency: _, ...withoutCurrency } = validBill;
      const result = createBillSchema.safeParse(withoutCurrency);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.currency).toBe(currencyEnum.enumValues[0]);
    });

    it("coerces amount from string to number", () => {
      const result = createBillSchema.safeParse({ ...validBill, amount: "100" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.amount).toBe(100);
    });

    it("accepts optional description", () => {
      expect(
        createBillSchema.safeParse({ ...validBill, description: "Monthly services" }).success
      ).toBe(true);
    });

    it("accepts input without lineItems field", () => {
      expect(createBillSchema.safeParse(validBill).success).toBe(true);
    });
  });

  describe("vendorId", () => {
    it("rejects non-UUID vendorId", () => {
      const result = createBillSchema.safeParse({ ...validBill, vendorId: "not-a-uuid" });
      expect(result.success).toBe(false);
      expect(findIssue(result, "vendorId")?.message).toBe(billSchemaErrorMessages.vendorId);
    });
  });

  describe("number", () => {
    it("rejects empty number", () => {
      const result = createBillSchema.safeParse({ ...validBill, number: "" });
      expect(result.success).toBe(false);
      expect(findIssue(result, "number")?.message).toBe(billSchemaErrorMessages.number);
    });
  });

  describe("amount", () => {
    it("rejects amount of zero", () => {
      const result = createBillSchema.safeParse({ ...validBill, amount: 0 });
      expect(result.success).toBe(false);
      expect(findIssue(result, "amount")?.message).toBe(billSchemaErrorMessages.amount);
    });

    it("rejects negative amount", () => {
      const result = createBillSchema.safeParse({ ...validBill, amount: -50 });
      expect(result.success).toBe(false);
      expect(findIssue(result, "amount")?.message).toBe(billSchemaErrorMessages.amount);
    });
  });

  describe("invoiceDate", () => {
    it("rejects invalid date (day out of range)", () => {
      const result = createBillSchema.safeParse({ ...validBill, invoiceDate: "2020-01-32" });
      expect(result.success).toBe(false);
      expect(findIssue(result, "invoiceDate")?.message).toBe(billSchemaErrorMessages.invoiceDate);
    });

    it("rejects non-date string", () => {
      const result = createBillSchema.safeParse({ ...validBill, invoiceDate: "not-a-date" });
      expect(result.success).toBe(false);
      expect(findIssue(result, "invoiceDate")?.message).toBe(billSchemaErrorMessages.invoiceDate);
    });
  });

  describe("dueDate", () => {
    it("rejects dueDate before invoiceDate", () => {
      const result = createBillSchema.safeParse({
        ...validBill,
        invoiceDate: "2024-02-15",
        dueDate: "2024-01-15",
      });
      expect(result.success).toBe(false);
      expect(findIssue(result, "dueDate")?.message).toBe(
        "Due date must be on or after invoice date"
      );
    });
  });

  describe("paymentType", () => {
    it("rejects invalid paymentType value", () => {
      const result = createBillSchema.safeParse({ ...validBill, paymentType: "bitcoin" });
      expect(result.success).toBe(false);
      expect(findIssue(result, "paymentType")).toBeDefined();
    });
  });

  describe("lineItems", () => {
    it("rejects lineItem with empty description", () => {
      const result = createBillSchema.safeParse({
        ...validBill,
        lineItems: [{ description: "", amount: 50 }],
      });
      expect(result.success).toBe(false);
      expect(findLineItemIssue(result, "description")?.message).toBe(
        billSchemaErrorMessages.lineItemDescription
      );
    });

    it("rejects lineItem with amount of zero", () => {
      const result = createBillSchema.safeParse({
        ...validBill,
        lineItems: [{ description: "Service", amount: 0 }],
      });
      expect(result.success).toBe(false);
      expect(findLineItemIssue(result, "amount")?.message).toBe(billSchemaErrorMessages.amount);
    });
  });
});
