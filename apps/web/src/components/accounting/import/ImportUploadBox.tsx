import { useRef } from "react";
import { UploadCloud, RefreshCw } from "lucide-react";

interface ImportUploadBoxProps {
  fileName: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onSimulateUpload: () => Promise<void>;
  onReset: () => void;
  isPending: boolean;
  hasStagedRows: boolean;
}

export function ImportUploadBox({
  fileName,
  onFileUpload,
  onSimulateUpload,
  onReset,
  isPending,
  hasStagedRows,
}: ImportUploadBoxProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
    onReset();
  };

  return (
    <div className="rounded-card-lg border border-dashed border-line bg-white p-8 text-center shadow-glass transition hover:border-primary/50">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        onChange={onFileUpload}
        className="hidden"
        id="excel-file-input"
      />

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="h-7 w-7" />
      </div>
      <h3 className="mt-3 text-base font-bold text-navy">
        {fileName
          ? `Berkas Terpilih: ${fileName}`
          : "Unggah Lembar Kerja Excel (.xlsx)"}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">
        Membaca sheet <span className="font-semibold text-navy">BUDGETING</span>
        . Kolom Tanggal, Ref, Rekening, Kategori, Debit, Kredit, dan Deskripsi
        akan divalidasi dan dinormalisasi.
      </p>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <label
          htmlFor="excel-file-input"
          className="cursor-pointer inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-primary-dark transition"
        >
          <UploadCloud className="h-4 w-4" />
          {isPending ? "Memproses Server..." : "Pilih Berkas Excel"}
        </label>
        <button
          type="button"
          onClick={onSimulateUpload}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-navy hover:bg-slate-200 transition"
        >
          <RefreshCw className="h-4 w-4" />
          Simulasikan Data Excel
        </button>
        {hasStagedRows && (
          <button
            type="button"
            onClick={handleReset}
            className="rounded-card border border-rose-200 bg-rose-50 px-3 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-100 transition cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
