"use client";

import { useState } from "react";
import { UploadIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImportBillsModal } from "@/components/bills/import/ImportBillsModal";

interface ImportBillsButtonProps {
  disabled?: boolean;
}

export function ImportBillsButton({ disabled }: ImportBillsButtonProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outline" size="sm" disabled={disabled} onClick={() => setOpen(true)}>
        <UploadIcon className="h-4 w-4" />
        Import CSV
      </Button>
      <ImportBillsModal open={open} onOpenChange={setOpen} />
    </>
  );
}
