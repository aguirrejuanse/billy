"use client";

import { useFieldArray } from "react-hook-form";
import type { CreateBillInput } from "@/lib/validators";
import { FormInput } from "@/components/ui/form-fields";
import { Button } from "@/components/ui/button";

export function LineItemsField() {
  const { fields, append, remove } = useFieldArray<CreateBillInput>({ name: "lineItems" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">Line Items</span>
        <Button
          variant="ghost"
          size="sm"
          type="button"
          onClick={() => append({ description: "", amount: 0 })}
          className="text-xs h-auto p-0 text-primary"
        >
          + Add line item
        </Button>
      </div>

      {fields.length === 0 && <p className="text-xs text-muted-foreground">No line items added.</p>}

      {fields.map((field, index) => (
        <div key={field.id} className="grid grid-cols-[1fr_6rem_1.5rem] gap-2 items-start">
          <FormInput
            name={`lineItems.${index}.description`}
            label={index === 0 ? "Description" : ""}
            placeholder="Description"
          />
          <FormInput
            name={`lineItems.${index}.amount`}
            label={index === 0 ? "Amount" : ""}
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
          />
          <Button
            variant="ghost"
            size="icon"
            type="button"
            onClick={() => remove(index)}
            className={`self-start size-6 ${index === 0 ? "mt-6.5" : "mt-2"} text-muted-foreground hover:text-destructive`}
            aria-label="Remove line item"
          >
            ×
          </Button>
        </div>
      ))}
    </div>
  );
}
