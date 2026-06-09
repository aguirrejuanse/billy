"use client";

import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FormInput, FormCheckboxGroup } from "@/components/ui/form-fields";
import { updateVendorSchema, type UpdateVendorInput } from "@/lib/validators";
import { paymentMethodEnum } from "@/db/schema";
import { paymentMethodLabels } from "@/lib/formatters";
import { useUpdateVendorMutation } from "@/hooks/useUpdateVendorMutation";
import type { VendorWithMethods } from "@/types";

const PAYMENT_METHOD_OPTIONS = paymentMethodEnum.enumValues.map((v) => ({
  value: v,
  label: paymentMethodLabels[v],
}));

interface EditVendorSheetProps {
  vendor: VendorWithMethods | null;
  onOpenChange: () => void;
}

export function EditVendorSheet({ vendor, onOpenChange }: EditVendorSheetProps) {
  const defaultVendor = {
    name: vendor?.name,
    email: vendor?.email ?? undefined,
    paymentMethods: vendor?.paymentMethods as UpdateVendorInput["paymentMethods"],
  };

  const methods = useForm<UpdateVendorInput>({
    resolver: zodResolver(updateVendorSchema),
    values: vendor ? defaultVendor : undefined,
  });

  const { mutate: updateVendor, isPending, error: mutationError } = useUpdateVendorMutation();

  const errorMessage = mutationError
    ? (mutationError.response?.data?.error ?? "Failed to update vendor. Please try again.")
    : null;

  function onSubmit(data: UpdateVendorInput) {
    if (!vendor || isPending) return;
    updateVendor(
      { id: vendor.id, input: data },
      {
        onSuccess: () => {
          handleOpenChange();
        },
      }
    );
  }

  function handleOpenChange() {
    methods.reset();
    onOpenChange();
  }

  return (
    <Sheet open={!!vendor} onOpenChange={handleOpenChange}>
      <SheetContent className="w-full sm:max-w-md h-full overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Vendor</SheetTitle>
        </SheetHeader>
        <FormProvider {...methods}>
          <form onSubmit={methods.handleSubmit(onSubmit)} className="space-y-4 p-4">
            <FormInput name="name" label="Name" placeholder="Acme Corp" />
            <FormInput
              name="email"
              label="Email"
              type="email"
              placeholder="billing@acme.com"
              optional
            />
            <FormCheckboxGroup
              name="paymentMethods"
              label="Payment Methods"
              options={PAYMENT_METHOD_OPTIONS}
            />

            <div className="flex items-center gap-3 justify-between border-t pt-4">
              <p className="text-xs text-destructive flex-1 min-w-0 truncate">{errorMessage}</p>
              <Button type="submit" disabled={isPending} className="shrink-0">
                {isPending ? "Saving…" : "Save Changes"}
              </Button>
            </div>
          </form>
        </FormProvider>
      </SheetContent>
    </Sheet>
  );
}
