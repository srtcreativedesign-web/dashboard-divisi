import { useState } from "react";
import { useToast } from "../../../components/ui/Toast";
import {
  useAccountingPeriods,
  useImportMutations,
} from "../../../hooks/useAccounting";
import type { AccImportRow } from "../../../api/accounting";

import { ImportUploadBox } from "../../../components/accounting/import/ImportUploadBox";
import { ImportSummaryCards } from "../../../components/accounting/import/ImportSummaryCards";
import { ImportStagingTable } from "../../../components/accounting/import/ImportStagingTable";
import type { DisplayRow } from "../../../components/accounting/import/ImportStagingTable";
import { ImportCommitBar } from "../../../components/accounting/import/ImportCommitBar";


export default function AccountingImportPage() {
  const { toast } = useToast();
  const periods = useAccountingPeriods();
  const importMutations = useImportMutations();

  const [fileName, setFileName] = useState<string | null>(null);
  const [stagedRows, setStagedRows] = useState<DisplayRow[]>([]);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "valid" | "normalized" | "duplicate_warning" | "error"
  >("all");
  const [search, setSearch] = useState("");
  const [committed, setCommitted] = useState(false);
  const [backendRawRows, setBackendRawRows] = useState<AccImportRow[]>([]);

  const activePeriod =
    periods.data?.find((p) =>
      ["draft", "pending_approval", "reopened"].includes(p.status)
    ) ?? periods.data?.[0];

  const mapBackendRows = (rows: AccImportRow[]): DisplayRow[] => {
    return rows.map((r) => {
      let st: DisplayRow["status"] = "valid";
      if (r.status === "ERROR") st = "error";
      else if (r.status === "DUPLICATE") st = "duplicate_warning";
      else if (
        r.warnings?.some((w) => w.toLowerCase().includes("normalisasi"))
      )
        st = "normalized";

      return {
        rowNum: r.row_number,
        date: r.date,
        refNo: r.reference_no ?? "-",
        account: r.account_name ?? "Bank Default",
        rawCategory: r.original_category ?? r.category_code,
        normalizedCategory: r.category_code,
        description: r.description,
        debit: r.debit,
        credit: r.credit,
        status: st,
        notes:
          r.errors?.join(", ") ||
          r.warnings?.join(", ") ||
          "Terverifikasi valid",
      };
    });
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploaded = e.target.files?.[0];
    if (!uploaded) return;
    if (!activePeriod || !['draft', 'reopened', 'needs_correction'].includes(activePeriod.status)) { toast('Pilih periode yang dapat diedit sebelum mengimpor.', 'error'); return; }
    setStagedRows([]);
    setBackendRawRows([]);
    setFileName(uploaded.name);
    setCommitted(false);

    const formData = new FormData();
    formData.append("file", uploaded);
    if (activePeriod?.id) formData.append("period_id", activePeriod.id);

    try {
      const res = await importMutations.preview.mutateAsync(formData);
      const data = res.data;
      setBackendRawRows(data.rows);
      setStagedRows(mapBackendRows(data.rows));
      toast(
        `Berkas ${uploaded.name} berhasil diproses server (${data.summary.total_rows} baris terbaca)`,
        "success"
      );
    } catch {
      toast("Gagal memproses berkas Excel di backend", "error");
    }
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob(['tanggal,ref,rekening,kategori,debit,kredit,keterangan\r\n'], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'template-jurnal.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCommit = async () => {
    if (stagedRows.length === 0) return;
    if (stagedRows.some((r) => r.status === "error")) {
      toast("Batch mengandung baris error. Perbaiki sebelum commit", "error");
      return;
    }

    try {
      setCommitted(true);
      toast('Memproses commit transaksi...', 'info');
      await importMutations.commit.mutateAsync({
        period_id: activePeriod?.id,
        rows:
          backendRawRows.length > 0
            ? backendRawRows
            : stagedRows.map((s) => ({
                date: s.date,
                reference_no: s.refNo,
                category_code: s.normalizedCategory,
                description: s.description,
                debit: s.debit,
                credit: s.credit,
                status: "VALID",
              })),
      });
      toast(
        `Commit atomic sukses! ${stagedRows.length} transaksi resmi masuk ke buku besar jurnal`,
        "success"
      );
    } catch (e) {
      setCommitted(false);
      const err = e as unknown as { message?: string; traceId?: string };
      toast(
        err.message ?? "Commit batch gagal di backend (all-or-nothing rollback aman)",
        "error",
        err.traceId
      );
    }
  };

  const handleReset = () => {
    setFileName(null);
    setStagedRows([]);
    setBackendRawRows([]);
    setCommitted(false);
    toast("Staging transaksi dibersihkan", "info");
  };

  const validCount = stagedRows.filter((r) => r.status === "valid").length;
  const normalizedCount = stagedRows.filter(
    (r) => r.status === "normalized"
  ).length;
  const warnCount = stagedRows.filter(
    (r) => r.status === "duplicate_warning"
  ).length;
  const errCount = stagedRows.filter((r) => r.status === "error").length;
  const totalDebit = stagedRows.reduce((acc, cur) => acc + cur.debit, 0);
  const totalCredit = stagedRows.reduce((acc, cur) => acc + cur.credit, 0);

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">
            ACCOUNTING CONTROL CENTER
          </p>
          <h1 className="mt-1 text-2xl font-bold text-navy">
            Impor Transaksi Accounting
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Unggah lembar kerja{" "}
            <span className="font-mono font-semibold text-navy">BUDGETING</span>{" "}
            untuk memeriksa data sebelum disimpan ke jurnal.
          </p>
        </div>
      </header>

      <ol className="grid gap-3 sm:grid-cols-3">
        {['Siapkan berkas', 'Periksa hasil validasi', 'Simpan ke jurnal'].map((step, index) => <li key={step} className="flex items-center gap-3 rounded-lg border border-line bg-white p-4 text-sm"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-50 font-semibold text-primary-800">{index + 1}</span>{step}</li>)}
      </ol>
      <p className="text-sm text-slate-600">Periode tujuan: <strong>{activePeriod?.periodMonth ?? 'Memuat periode…'}</strong>. Data belum tersimpan sampai Anda memilih simpan.</p>
      <ImportUploadBox
        fileName={fileName}
        onFileUpload={handleFileUpload}
        onDownloadTemplate={handleDownloadTemplate}
        onReset={handleReset}
        isPending={importMutations.preview.isPending || importMutations.commit.isPending}
        hasStagedRows={stagedRows.length > 0}
      />

      {stagedRows.length > 0 && (
        <div className="space-y-4">
          <ImportSummaryCards
            totalRows={stagedRows.length}
            validCount={validCount}
            normalizedCount={normalizedCount}
            warnCount={warnCount}
            totalDebit={totalDebit}
            totalCredit={totalCredit}
          />

          <div className="rounded-card-lg border border-line bg-white shadow-glass">
            <ImportStagingTable
              rows={stagedRows}
              filterStatus={filterStatus}
              setFilterStatus={setFilterStatus}
              search={search}
              setSearch={setSearch}
              validCount={validCount}
              normalizedCount={normalizedCount}
              warnCount={warnCount}
            />

            <ImportCommitBar
              activePeriodMonth={activePeriod?.periodMonth ?? "Belum tersedia"}
              onReset={handleReset}
              onCommit={handleCommit}
              isCommitted={committed}
              hasErrors={errCount > 0}
              isPending={importMutations.commit.isPending}
              stagedRowsCount={stagedRows.length}
            />
          </div>
        </div>
      )}
    </section>
  );
}
