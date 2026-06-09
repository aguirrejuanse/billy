"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FormInput, FormCheckboxGroup } from "@/components/ui/form-fields";
import { createVendorSchema, type CreateVendorInput } from "@/lib/validators";
import { paymentMethodEnum } from "@/db/schema";
import { paymentMethodLabels } from "@/lib/formatters";
import { useCreateVendorMutation } from "@/hooks/useCreateVendorMutation";

const PAYMENT_METHOD_OPTIONS = paymentMethodEnum.enumValues.map((v) => ({
  value: v,
  label: paymentMethodLabels[v],
}));

interface CreateVendorSheetProps {
  open: boolean;
  onOpenChange: () => void;
}

export function CreateVendorSheet({ open, onOpenChange }: CreateVendorSheetProps) {
  const methods = useForm<CreateVendorInput>({
    resolver: zodResolver(createVendorSchema),
    defaultValues: { paymentMethods: ["ach"] },
  });

  const { mutate: createVendor, isPending, error: mutationError } = useCreateVendorMutation();

  const errorMessage = mutationError
    ? (mutationError.response?.data?.error ?? "Failed to create vendor. Please try again.")
    : null;

  function onSubmit(data: CreateVendorInput) {
    if (isPending) return;
    createVendor(data, {
      onSuccess: () => {
        handleOpenChange();
      },
    });
  }

  function handleOpenChange() {
    methods.reset();
    onOpenChange();
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>New Vendor</SheetTitle>
        </SheetHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <FormInput name="name" label="Name" placeholder="Acme Corp" />
            <FormInput name="email" label="Email" type="email" placeholder="billing@acme.com" />
            <FormCheckboxGroup
              name="paymentMethods"
              label="Payment Methods"
              options={PAYMENT_METHOD_OPTIONS}
            />

            <div className="flex items-center gap-3 justify-between border-t pt-4">
              <p className="text-xs text-destructive flex-1 min-w-0 truncate">{errorMessage}</p>
              <Button type="submit" disabled={isPending} className="shrink-0">
                {isPending ? "Creating…" : "Create Vendor"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
