"use client";

import { useEffect } from "react";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createBillSchema, type CreateBillInput, type CreateBillFormInput } from "@/lib/validators";
import { currencyEnum, paymentMethodEnum } from "@/db/schema";
import { useVendorsQuery } from "@/hooks/useVendorsQuery";
import { useCreateBillMutation } from "@/hooks/useCreateBillMutation";
import { FormInput, FormTextarea, FormSelect, FormDateInput } from "@/components/ui/form-fields";
import { LineItemsField } from "./LineItemsField";
import Link from "next/link";

interface CreateBillFormProps {
  onSuccess: () => void;
}

const PAYMENT_METHOD_OPTIONS = paymentMethodEnum.enumValues.map((v) => ({
  value: v,
  label: { ach: "ACH", wire: "Wire", check: "Check", card: "Card" }[v] ?? v,
}));

const CURRENCY_OPTIONS = currencyEnum.enumValues.map((v) => ({ value: v, label: v }));

export function CreateBillForm({ onSuccess }: CreateBillFormProps) {
  const { data: vendors = [], isLoading: vendorsLoading } = useVendorsQuery();
  const { mutate: createBill, isPending, error: mutationError } = useCreateBillMutation();

  const vendorOptions = vendors.map((v) => ({ value: v.id, label: v.name }));

  const methods = useForm<CreateBillFormInput, unknown, CreateBillInput>({
    resolver: zodResolver(createBillSchema),
    defaultValues: { currency: "USD", lineItems: [] },
  });

  const invoiceDate = useWatch({ control: methods.control, name: "invoiceDate" });
  const selectedVendorId = useWatch({ control: methods.control, name: "vendorId" });

  const selectedVendor = vendors.find((v) => v.id === selectedVendorId);
  const availablePaymentOptions = selectedVendor
    ? PAYMENT_METHOD_OPTIONS.filter((opt) => selectedVendor.paymentMethods.includes(opt.value))
    : PAYMENT_METHOD_OPTIONS;

  useEffect(() => {
    if (vendors.length > 0 && !methods.getValues("vendorId")) {
      methods.setValue("vendorId", vendors[0].id);
    }
  }, [vendors]);

  useEffect(() => {
    if (!selectedVendor) return;
    if (selectedVendor.paymentMethods.length === 1) {
      methods.setValue(
        "paymentType",
        selectedVendor.paymentMethods[0] as CreateBillInput["paymentType"]
      );
    } else {
      const current = methods.getValues("paymentType");
      if (current && !selectedVendor.paymentMethods.includes(current)) {
        methods.setValue(
          "paymentType",
          selectedVendor.paymentMethods[0] as CreateBillInput["paymentType"]
        );
      }
    }
  }, [selectedVendorId, vendors]);

  const errorMessage = mutationError
    ? (mutationError.response?.data?.error ?? "Failed to create bill. Please try again.")
    : null;

  function onSubmit(data: CreateBillInput) {
    if (isPending) return;
    createBill(data, {
      onSuccess: () => {
        methods.reset();
        onSuccess();
      },
    });
  }

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 p-4">
        <FormSelect
          name="vendorId"
          label="Vendor"
          options={vendorOptions}
          placeholder="Select a vendor"
          disabled={vendorsLoading}
        />

        <FormInput name="number" label="Bill #" placeholder="INV-001" />

        <FormTextarea
          name="description"
          label="Description"
          optional
          rows={2}
          placeholder="Brief description of the bill"
        />

        <div className="grid grid-cols-[1fr_auto] gap-2">
          <FormInput
            name="amount"
            label="Amount"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
          <FormSelect name="currency" label="Currency" options={CURRENCY_OPTIONS} />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <FormDateInput name="invoiceDate" label="Invoice Date" />
          <FormDateInput name="dueDate" label="Due Date" min={invoiceDate} />
        </div>

        {selectedVendor && selectedVendor.paymentMethods.length === 0 ? (
          <div className="space-y-1">
            <p className="text-sm font-medium">Payment Type</p>
            <p className="text-sm text-muted-foreground">
              This vendor has no payment methods configured.{" "}
              <Link
                href="/vendors"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Go to Vendors
              </Link>{" "}
              to add one.
            </p>
          </div>
        ) : (
          <FormSelect
            name="paymentType"
            label="Payment Type"
            options={availablePaymentOptions}
            disabled={selectedVendor?.paymentMethods.length === 1}
          />
        )}

        <div className="border-t pt-4">
          <LineItemsField />
        </div>

        <div className="flex items-center gap-3 justify-between border-t pt-4">
          <p className="text-xs text-destructive flex-1 min-w-0 truncate">{errorMessage}</p>
          <button
            type="submit"
            disabled={isPending}
            className="shrink-0 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isPending ? "Creating…" : "Create Bill"}
          </button>
        </div>
      </form>
    </FormProvider>
  );
}
