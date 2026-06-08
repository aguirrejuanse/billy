"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { useCreateImportMutation } from "@/hooks/useCreateImportMutation";
import {
  importBillRowSchema,
  REQUIRED_CSV_COLUMNS,
  MAX_CSV_ROWS,
  MAX_FILE_SIZE_MB,
  type ImportBillRow,
  type RowError,
  type ImportResult,
} from "@/lib/import-validators";

type Step = "upload" | "preview" | "result";

export function useImportBills() {
  const [step, setStep] = useState<Step>("upload");
  const [validRows, setValidRows] = useState<ImportBillRow[]>([]);
  const [rowErrors, setRowErrors] = useState<RowError[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const create = useCreateImportMutation();

  function clearInput() {
    if (inputRef.current) inputRef.current.value = "";
  }

  function reset() {
    setStep("upload");
    setValidRows([]);
    setRowErrors([]);
    setImportResult(null);
    setParseError(null);
    create.reset();
    clearInput();
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError(null);

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      setParseError(`File exceeds ${MAX_FILE_SIZE_MB}MB limit`);
      clearInput();
      return;
    }

    if (file.type && file.type !== "text/csv") {
      setParseError("File must be a CSV");
      clearInput();
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => {
      setParseError("Failed to read file");
      clearInput();
    };
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        skipEmptyLines: true,
      });

      if (result.data.length > MAX_CSV_ROWS) {
        setParseError(`CSV exceeds ${MAX_CSV_ROWS}-row limit`);
        clearInput();
        return;
      }

      const fields = result.meta.fields ?? [];
      const missing = REQUIRED_CSV_COLUMNS.filter((col) => !fields.includes(col));
      if (missing.length > 0) {
        setParseError(`Missing required columns: ${missing.join(", ")}`);
        clearInput();
        return;
      }

      const valid: ImportBillRow[] = [];
      const errors: RowError[] = [];
      result.data.forEach((row, i) => {
        const parsed = importBillRowSchema.safeParse(row);
        if (parsed.success) {
          valid.push(parsed.data);
        } else {
          errors.push({ row: i + 2, error: parsed.error.issues[0]?.message ?? "Invalid row" });
        }
      });

      if (valid.length === 0 && errors.length === 0) {
        setParseError("CSV file is empty — please add at least one bill row");
        clearInput();
        return;
      }

      setValidRows(valid);
      setRowErrors(errors);
      setStep("preview");
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (create.isPending) return;
    create.mutate(validRows, {
      onSuccess: (data) => {
        setImportResult(data);
        setStep("result");
      },
    });
  }

  function goBack() {
    setStep("upload");
  }

  return {
    step,
    validRows,
    rowErrors,
    importResult,
    parseError,
    inputRef,
    isPending: create.isPending,
    isError: create.isError,
    errorMessage: create.error?.message,
    handleFileChange,
    handleImport,
    goBack,
    reset,
  };
}
