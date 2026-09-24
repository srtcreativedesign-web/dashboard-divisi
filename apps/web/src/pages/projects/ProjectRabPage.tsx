import React, { useState } from 'react';
import { ProjectPageLayout } from '../../layout/ProjectPageLayout';
import { projectApi } from '../../api/projects';

export default function ProjectRabPage() {
  const [showRabModal, setShowRabModal] = useState(false);
  const [rabForm, setRabForm] = useState({ item_name: '', category: 'Material', volume: 1, unit: 'ls', unit_price: 0 });
  const [submittingRab, setSubmittingRab] = useState(false);

  return (
    <ProjectPageLayout
      title="Rencana Anggaran Biaya (RAB)"
      description="Susun dan hitung estimasi biaya proyek."
    >
      {(project, refreshProject) => {
        const handleAddRab = async (e: React.FormEvent) => {
          e.preventDefault();
          try {
            setSubmittingRab(true);
            await projectApi.addRab(project.id, rabForm);
            await refreshProject();
            setShowRabModal(false);
            setRabForm({ item_name: '', category: 'Material', volume: 1, unit: 'ls', unit_price: 0 });
          } catch (err) {
            alert('Gagal menambah RAB');
          } finally {
            setSubmittingRab(false);
          }
        };

        return (
          <>
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Rincian Item RAB</h3>
                <button 
                  onClick={() => setShowRabModal(true)}
                  className="text-sm font-semibold text-primary-600 hover:text-primary-500"
                >
                  + Tambah Item RAB
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-800">
                  <thead className="bg-slate-50 dark:bg-slate-800/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Item</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase">Kategori</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Vol</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Harga Satuan</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {project.rabs && project.rabs.length > 0 ? (
                      project.rabs.map((rab) => (
                        <tr key={rab.id}>
                          <td className="px-4 py-3 text-sm font-medium text-slate-900 dark:text-white">{rab.item_name}</td>
                          <td className="px-4 py-3 text-sm text-slate-500">{rab.category}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">{rab.volume} {rab.unit}</td>
                          <td className="px-4 py-3 text-sm text-right text-slate-900 dark:text-white">Rp {parseFloat(rab.unit_price.toString()).toLocaleString('id-ID')}</td>
                          <td className="px-4 py-3 text-sm text-right font-semibold text-slate-900 dark:text-white">Rp {parseFloat(rab.total_price.toString()).toLocaleString('id-ID')}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-4 py-4 text-center text-sm text-slate-500">RAB kosong.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* RAB Modal */}
            {showRabModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                  <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Tambah Item RAB</h3>
                    <button onClick={() => setShowRabModal(false)} className="text-slate-400 hover:text-slate-500">&times;</button>
                  </div>
                  <form onSubmit={handleAddRab} className="p-6 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Item</label>
                      <input required type="text" value={rabForm.item_name} onChange={(e) => setRabForm({ ...rabForm, item_name: e.target.value })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
                      <input required type="text" value={rabForm.category} onChange={(e) => setRabForm({ ...rabForm, category: e.target.value })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Volume</label>
                        <input required type="number" min="0.01" step="0.01" value={rabForm.volume} onChange={(e) => setRabForm({ ...rabForm, volume: parseFloat(e.target.value) })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Satuan</label>
                        <input required type="text" value={rabForm.unit} onChange={(e) => setRabForm({ ...rabForm, unit: e.target.value })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Satuan (Rp)</label>
                      <input required type="number" min="0" value={rabForm.unit_price} onChange={(e) => setRabForm({ ...rabForm, unit_price: parseInt(e.target.value) })} className="w-full rounded-lg border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                      <button type="button" onClick={() => setShowRabModal(false)} className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                        Batal
                      </button>
                      <button type="submit" disabled={submittingRab} className="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50">
                        {submittingRab ? 'Menyimpan...' : 'Simpan'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </>
        );
      }}
    </ProjectPageLayout>
  );
}
