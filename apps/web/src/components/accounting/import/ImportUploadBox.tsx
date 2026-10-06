import { useRef } from "react";
import { UploadCloud, Download } from "lucide-react";

interface ImportUploadBoxProps {
  fileName: string | null;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDownloadTemplate: () => void;
  onReset: () => void;
  isPending: boolean;
  hasStagedRows: boolean;
}

export function ImportUploadBox({
  fileName,
  onFileUpload,
  onDownloadTemplate,
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
    <div className="rounded-card-lg border border-dashed border-line bg-white p-6 sm:p-8 text-center transition hover:border-primary/50">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.csv"
        onChange={onFileUpload}
        disabled={isPending}
        className="sr-only"
        id="excel-file-input"
      />

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        <UploadCloud className="h-7 w-7" />
      </div>
      <h3 className="mt-3 text-base font-bold text-navy">
        {fileName
          ? `Berkas Terpilih: ${fileName}`
          : "Unggah transaksi"}
      </h3>
      <p className="mx-auto mt-2 max-w-lg text-sm text-slate-500">
        Membaca sheet <span className="font-semibold text-navy">BUDGETING</span>
        . Kolom Tanggal, Ref, Rekening, Kategori, Debit, Kredit, dan Deskripsi
        akan divalidasi dan dinormalisasi.
      </p>

      <p className="mt-3 text-xs text-slate-500">Format .xlsx atau .csv · Tanggal YYYY-MM-DD · Isi hanya salah satu kolom debit atau kredit</p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="cursor-pointer inline-flex items-center gap-2 rounded-card bg-primary px-4 py-2.5 text-xs font-semibold text-white shadow hover:bg-primary-dark transition"
        >
          <UploadCloud className="h-4 w-4" />
          {isPending ? "Memeriksa berkas…" : "Pilih Berkas Excel"}
        </button>
        <button
          type="button"
          onClick={onDownloadTemplate}
          disabled={isPending}
          className="inline-flex items-center gap-2 rounded-card border border-line bg-surface px-4 py-2.5 text-xs font-semibold text-navy hover:bg-slate-200 transition"
        >
          <Download className="h-4 w-4" />
          Unduh template CSV
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
