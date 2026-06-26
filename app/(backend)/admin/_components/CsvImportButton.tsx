"use client";

import { useRef, useState } from "react";
import Papa from "papaparse";
import { Upload, X, CheckCircle, AlertCircle, Loader2, FileText } from "lucide-react";
import type { ImportResult } from "@/app/actions/backend/shared/csv-import";

interface Props {
  label: string;
  templateColumns: string[];
  templateExample: Record<string, string>;
  onImport: (rows: Record<string, string>[]) => Promise<ImportResult>;
  onSuccess: () => void;
}

type Step = "idle" | "preview" | "importing" | "done";

export default function CsvImportButton({ label, templateColumns, templateExample, onImport, onSuccess }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("idle");
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [fileName, setFileName] = useState("");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [parseError, setParseError] = useState("");

  const downloadTemplate = () => {
    const header = templateColumns.join(",");
    const example = templateColumns.map(c => templateExample[c] ?? "").join(",");
    const csv = `${header}\n${example}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${label.toLowerCase().replace(/\s+/g, "-")}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParseError("");
    setResult(null);
    setFileName(file.name);

    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (parsed) => {
        if (!parsed.data.length) {
          setParseError("CSV file is empty.");
          return;
        }
        setRows(parsed.data);
        setStep("preview");
      },
      error: () => setParseError("Failed to parse CSV file."),
    });

    // reset so same file can be re-selected
    e.target.value = "";
  };

  const handleImport = async () => {
    setStep("importing");
    const res = await onImport(rows);
    setResult(res);
    setStep("done");
    if (res.created > 0) onSuccess();
  };

  const reset = () => {
    setStep("idle");
    setRows([]);
    setFileName("");
    setResult(null);
    setParseError("");
  };

  return (
    <div className="w-full">
      {/* Trigger button */}
      {step === "idle" && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-2.5 py-1 text-[13px] border border-[#c3c4c7] text-[#646970] bg-[#f6f7f7] hover:bg-[#f0f0f1] rounded-[3px] transition-colors"
          >
            <Upload size={13} />
            Import CSV
          </button>
          <button
            type="button"
            onClick={downloadTemplate}
            className="text-[12px] text-[#2271b1] hover:underline"
          >
            Download template
          </button>
          {parseError && (
            <span className="text-[12px] text-[#d63638] flex items-center gap-1">
              <AlertCircle size={12} /> {parseError}
            </span>
          )}
        </div>
      )}

      <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />

      {/* Preview panel */}
      {step === "preview" && (
        <div className="mt-2 border border-[#c3c4c7] rounded-[3px] bg-white shadow-sm overflow-hidden animate-in fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2 bg-[#f6f7f7] border-b border-[#c3c4c7]">
            <div className="flex items-center gap-2 min-w-0">
              <FileText size={14} className="text-[#646970] shrink-0" />
              <span className="text-[13px] text-[#2c3338] font-medium truncate">{fileName}</span>
              <span className="text-[12px] text-[#646970] shrink-0">{rows.length} rows found</span>
            </div>
            <button type="button" onClick={reset} className="text-[#8c8f94] hover:text-[#d63638] ml-2 shrink-0">
              <X size={14} />
            </button>
          </div>

          {/* Preview table — first 3 rows */}
          <div className="overflow-x-auto">
            <table className="w-full text-[12px] text-[#3c434a] border-collapse min-w-[400px]">
              <thead>
                <tr className="bg-[#f9f9f9] border-b border-[#e2e4e7]">
                  {Object.keys(rows[0] ?? {}).map(col => (
                    <th key={col} className="px-2 py-1.5 text-left font-medium text-[#50575e] whitespace-nowrap">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 3).map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-[#f9f9f9]"}>
                    {Object.values(row).map((val, j) => (
                      <td key={j} className="px-2 py-1.5 border-b border-[#f0f0f1] truncate max-w-[180px]">{val}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {rows.length > 3 && (
            <p className="px-3 py-1.5 text-[12px] text-[#646970] bg-[#f9f9f9] border-t border-[#e2e4e7]">
              …and {rows.length - 3} more row(s)
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 border-t border-[#c3c4c7]">
            <button
              type="button"
              onClick={handleImport}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#2271b1] text-white text-[13px] rounded-[3px] hover:bg-[#135e96] transition-colors"
            >
              <Upload size={13} />
              Import {rows.length} rows
            </button>
            <button type="button" onClick={reset} className="text-[13px] text-[#646970] hover:text-[#d63638]">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Importing state */}
      {step === "importing" && (
        <div className="mt-2 flex items-center gap-2 px-3 py-2 border border-[#c3c4c7] rounded-[3px] bg-[#f6f7f7] text-[13px] text-[#3c434a]">
          <Loader2 size={14} className="animate-spin text-[#2271b1] shrink-0" />
          Importing {rows.length} rows…
        </div>
      )}

      {/* Done state */}
      {step === "done" && result && (
        <div className={`mt-2 border rounded-[3px] overflow-hidden animate-in fade-in duration-200 ${result.errors.length === 0 ? "border-[#68de7c]" : "border-[#f0c040]"}`}>
          <div className={`flex items-start justify-between gap-3 px-3 py-2.5 ${result.errors.length === 0 ? "bg-[#edfaef]" : "bg-[#fffbeb]"}`}>
            <div className="flex items-start gap-2 min-w-0">
              {result.errors.length === 0
                ? <CheckCircle size={15} className="text-[#2a7a2a] mt-0.5 shrink-0" />
                : <AlertCircle size={15} className="text-[#856404] mt-0.5 shrink-0" />}
              <div>
                <p className="text-[13px] font-medium text-[#1d2327]">
                  Import complete — {result.created} created, {result.skipped} skipped
                </p>
                {result.errors.length > 0 && (
                  <ul className="mt-1 space-y-0.5">
                    {result.errors.slice(0, 5).map((e, i) => (
                      <li key={i} className="text-[12px] text-[#856404]">{e}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button type="button" onClick={reset} className="text-[#8c8f94] hover:text-[#3c434a] shrink-0">
              <X size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
