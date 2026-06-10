"use client";

import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useImportBills } from "@/hooks/useImportBills";
import { ImportUploadStep } from "./ImportUploadStep";
import { ImportPreviewStep } from "./ImportPreviewStep";
import { ImportResultStep } from "./ImportResultStep";

interface ImportBillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportBillsModal({ open, onOpenChange }: ImportBillsModalProps) {
  const {
    step,
    validRows,
    rowErrors,
    importResult,
    parseError,
    inputRef,
    isPending,
    isError,
    errorMessage,
    handleFileChange,
    handleImport,
    goBack,
    reset,
  } = useImportBills();

  function handleClose() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl" showCloseButton>
        {step === "upload" && (
          <ImportUploadStep
            inputRef={inputRef}
            parseError={parseError}
            onFileChange={handleFileChange}
            onClose={handleClose}
          />
        )}
        {step === "preview" && (
          <ImportPreviewStep
            validRows={validRows}
            rowErrors={rowErrors}
            isPending={isPending}
            isError={isError}
            errorMessage={errorMessage}
            onImport={handleImport}
            onBack={goBack}
          />
        )}
        {step === "result" && importResult && (
          <ImportResultStep result={importResult} onClose={handleClose} />
        )}
      </DialogContent>
    </Dialog>
  );
}
