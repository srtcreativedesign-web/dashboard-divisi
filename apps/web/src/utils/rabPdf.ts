import { Project, ProjectRab } from '../types/project';

export interface RabPdfOptions {
  project: Project;
  items: Array<{
    item_name: string;
    category?: string;
    volume: number;
    unit?: string;
    unit_price: number;
    total_price: number;
  }>;
  paymentMethod?: string;
}

export function generateRabHtml(options: RabPdfOptions): string {
  const { project, items, paymentMethod = 'Cash' } = options;
  const grandTotal = items.reduce((acc, curr) => acc + (Number(curr.total_price) || 0), 0);
  const formattedGrandTotal = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(grandTotal);

  const formattedDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const rowsHtml = items
    .map(
      (item, idx) => `
      <tr>
        <td style="text-align: center; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${idx + 1}</td>
        <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #1e293b;">${item.item_name}</td>
        <td style="text-align: center; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">${item.volume}</td>
        <td style="text-align: center; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b; text-transform: uppercase;">${item.unit || 'pcs'}</td>
        <td style="text-align: right; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #334155;">Rp ${Number(item.unit_price).toLocaleString('id-ID')}</td>
        <td style="text-align: right; padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 700; color: #0f172a;">Rp ${Number(item.total_price).toLocaleString('id-ID')}</td>
      </tr>
    `
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>RAB_${project.project_code || 'PRJ-' + project.id}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 24px;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .company-title {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: -0.02em;
      color: #0f172a;
    }
    .company-sub {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .doc-badge {
      text-align: right;
    }
    .doc-title {
      font-size: 16px;
      font-weight: 800;
      color: #0284c7;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .doc-code {
      font-family: monospace;
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
    }
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 14px 18px;
      margin-bottom: 24px;
      font-size: 12px;
    }
    .meta-item {
      display: flex;
      margin-bottom: 4px;
    }
    .meta-label {
      width: 140px;
      color: #64748b;
      font-weight: 500;
    }
    .meta-val {
      color: #0f172a;
      font-weight: 600;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 24px;
    }
    th {
      background: #f1f5f9;
      color: #334155;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 10px;
      border-bottom: 2px solid #cbd5e1;
    }
    .total-card {
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 20px;
      padding: 12px 18px;
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 8px;
      margin-bottom: 40px;
    }
    .total-label {
      font-size: 13px;
      font-weight: 700;
      color: #166534;
      text-transform: uppercase;
    }
    .total-val {
      font-size: 18px;
      font-weight: 800;
      color: #15803d;
    }
    .sign-grid {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 20px;
      text-align: center;
      margin-top: 40px;
      page-break-inside: avoid;
    }
    .sign-box {
      font-size: 11px;
      color: #64748b;
    }
    .sign-space {
      height: 60px;
    }
    .sign-name {
      font-weight: 700;
      color: #0f172a;
      border-top: 1px solid #cbd5e1;
      padding-top: 6px;
      display: inline-block;
      min-width: 150px;
    }
  </style>
</head>
<body>
  <div class="header-bar">
    <div>
      <div class="company-title">DIVISI PROYEK & PEMELIHARAAN</div>
      <div class="company-sub">Rencana Anggaran Biaya (RAB) Pelaksanaan Lapangan</div>
    </div>
    <div class="doc-badge">
      <div class="doc-title">RAB Detail</div>
      <div class="doc-code">${project.project_code || 'PRJ-' + project.id}</div>
    </div>
  </div>

  <div class="meta-grid">
    <div>
      <div class="meta-item">
        <span class="meta-label">Nama Proyek</span>
        <span class="meta-val">: ${project.name}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Kategori / Klasifikasi</span>
        <span class="meta-val">: ${project.classification === 'maintenance' ? 'Maintenance' : 'Proyek Baru'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Lokasi Pekerjaan</span>
        <span class="meta-val">: ${project.location || 'Warehouse / Lapangan'}</span>
      </div>
    </div>
    <div>
      <div class="meta-item">
        <span class="meta-label">Klien / Penanggung Jwb</span>
        <span class="meta-val">: ${project.client_name || 'Tim Lapangan'}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Metode Pembayaran</span>
        <span class="meta-val">: ${paymentMethod}</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Tanggal Terbit</span>
        <span class="meta-val">: ${formattedDate}</span>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 40px; text-align: center;">No</th>
        <th style="text-align: left;">Deskripsi Pekerjaan / Material</th>
        <th style="width: 70px; text-align: center;">Qty</th>
        <th style="width: 80px; text-align: center;">Satuan</th>
        <th style="width: 130px; text-align: right;">Harga Satuan</th>
        <th style="width: 140px; text-align: right;">Total (Rp)</th>
      </tr>
    </thead>
    <tbody>
      ${rowsHtml}
    </tbody>
  </table>

  <div class="total-card">
    <div class="total-label">Grand Total RAB:</div>
    <div class="total-val">${formattedGrandTotal}</div>
  </div>

  <div class="sign-grid">
    <div class="sign-box">
      <div>Dibuat Oleh:</div>
      <div class="sign-space"></div>
      <div class="sign-name">Estimator / Lapangan</div>
    </div>
    <div class="sign-box">
      <div>Diperiksa Oleh:</div>
      <div class="sign-space"></div>
      <div class="sign-name">Manager Proyek</div>
    </div>
    <div class="sign-box">
      <div>Disetujui Oleh:</div>
      <div class="sign-space"></div>
      <div class="sign-name">Finance / Direksi</div>
    </div>
  </div>
</body>
</html>
  `;
}

export function printRabPdf(options: RabPdfOptions): void {
  const html = generateRabHtml(options);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Pop-up terblokir. Izinkan pop-up untuk mencetak atau melihat preview RAB.');
    return;
  }
  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 250);
}

export function downloadRabPdf(options: RabPdfOptions): void {
  const html = generateRabHtml(options);
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const printWindow = window.open(url, '_blank');
  if (printWindow) {
    printWindow.onload = () => {
      printWindow.print();
    };
  } else {
    // Fallback direct html download
    const link = document.createElement('a');
    link.href = url;
    link.download = `RAB_${options.project.project_code || options.project.id}.html`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
