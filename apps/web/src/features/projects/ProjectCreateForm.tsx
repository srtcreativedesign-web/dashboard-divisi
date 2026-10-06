import { useState } from 'react';
import type { FormEvent } from 'react';
import { projectApi } from '../../api/projects';

export function ProjectCreateForm({ onCreated, onCancel }: { onCreated: () => Promise<void>; onCancel: () => void }) {
  const [input, setInput] = useState({ name: '', client_name: '', contract_value: '0', start_date: '', end_date: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  async function save(event: FormEvent) {
    event.preventDefault(); if (saving) return;
    setSaving(true); setError('');
    try {
      await projectApi.createProject({ ...input, status: 'planning' });
      await onCreated();
    } catch (failure) { setError(failure instanceof Error ? failure.message : 'Gagal menyimpan proyek'); }
    finally { setSaving(false); }
  }
  return <form onSubmit={save} aria-label="Proyek baru" className="space-y-4 rounded-card-lg border border-line bg-white p-5">
    <h2 className="font-semibold">Proyek baru</h2>
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    <fieldset disabled={saving} className="grid gap-4 sm:grid-cols-2">
      {(['name', 'client_name', 'contract_value', 'start_date', 'end_date'] as const).map(key => <label key={key} className="text-sm">
        {{ name: 'Nama proyek', client_name: 'Nama klien', contract_value: 'Nilai kontrak (Rp)', start_date: 'Tanggal mulai', end_date: 'Tanggal selesai' }[key]}
        <input className="mt-1 w-full rounded-input border border-line px-3 py-2" type={key.includes('date') ? 'date' : key === 'contract_value' ? 'number' : 'text'} required={key === 'name' || key === 'contract_value'} maxLength={255} min={key === 'end_date' ? input.start_date : key === 'contract_value' ? '0' : undefined} max={key === 'contract_value' ? '9999999999999.99' : undefined} step={key === 'contract_value' ? '0.01' : undefined} value={input[key]} onChange={event => setInput(current => ({ ...current, [key]: event.target.value }))} />
      </label>)}
    </fieldset>
    <p className="text-sm text-slate-500">Proyek dibuat dengan status Perencanaan.</p>
    <div className="flex gap-3"><button type="submit" disabled={saving} className="rounded-input bg-primary px-4 py-2 text-white">{saving ? 'Menyimpan...' : 'Simpan proyek'}</button><button type="button" disabled={saving} onClick={onCancel} className="rounded-input border border-line px-4 py-2">Batal</button></div>
  </form>;
}
