import React from 'react';
import { ProjectPageLayout } from '../../../layout/ProjectPageLayout';
import { ProjectReportsExport } from '../../../components/projects/ProjectReportsExport';

export default function ProjectLpjPage() {
  return (
    <ProjectPageLayout
      title="Laporan Pertanggungjawaban (LPJ)"
      description="Pusat cetak dan ekspor resmi Laporan Pertanggungjawaban (LPJ), realisasi anggaran, Berita Acara Serah Terima (BAST), dan laporan progres fisik."
    >
      {(project) => <ProjectReportsExport project={project} initialReportType="lpj" />}
    </ProjectPageLayout>
  );
}
