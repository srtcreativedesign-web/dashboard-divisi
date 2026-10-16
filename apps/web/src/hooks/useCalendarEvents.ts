import { useState, useEffect, useCallback } from 'react';
import type { CalendarEvent } from '../types/calendar';

const STORAGE_KEY = 'dashboard_divisi_calendar_events_v2';

function generateInitialEvents(): CalendarEvent[] {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = now.getDate();

  const padDay = (d: number) => String(d).padStart(2, '0');
  const dateStr = (d: number) => `${year}-${month}-${padDay(d)}`;

  return [
    {
      id: 'event-init-1',
      title: 'Rapat Koordinasi Manajemen Bulanan',
      date: dateStr(Math.min(28, Math.max(1, day))),
      startTime: '09:00',
      endTime: '11:00',
      isAllDay: false,
      category: 'meeting',
      division: 'ALL',
      location: 'Ruang Rapat Utama & Zoom',
      description: 'Evaluasi pencapaian target seluruh unit bisnis dan koordinasi program kerja.',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'event-init-2',
      title: 'Batas Penyerahan Rekap Omzet & Closing Kas',
      date: dateStr(Math.min(28, Math.max(1, day + 1))),
      startTime: '17:00',
      endTime: '18:00',
      isAllDay: false,
      category: 'deadline',
      division: 'ACC',
      location: 'Sistem ERP Accounting',
      description: 'Rekonsiliasi transaksi kas dan setoran fisik bank dari seluruh cabang.',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'event-init-3',
      title: 'Inspeksi Fisik Lapangan & Cek Progres Proyek',
      date: dateStr(Math.min(28, Math.max(1, day + 3))),
      startTime: '13:30',
      endTime: '16:00',
      isAllDay: false,
      category: 'project',
      division: 'PROJECT',
      location: 'Lokasi Proyek Renovasi Outlet Sentral',
      description: 'Monitoring kesesuaian fisik terhadap time plan kurva S dan serah terima parsial.',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'event-init-4',
      title: 'Stock Opname Bulanan Inventori Cellular',
      date: dateStr(Math.min(28, Math.max(1, day + 5))),
      startTime: '08:00',
      endTime: '12:00',
      isAllDay: false,
      category: 'operational',
      division: 'CELL',
      location: 'Gudang Utama & Seluruh Booth Retail',
      description: 'Pengecekan fisik stok voucher, aksesoris, dan sinkronisasi saldo akhir barang dagangan.',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'event-init-5',
      title: 'Review Anggaran & Petty Cash Proyek',
      date: dateStr(Math.max(1, day - 2)),
      startTime: '10:00',
      endTime: '11:30',
      isAllDay: false,
      category: 'project',
      division: 'PROJECT',
      location: 'Ruang Rapat Divisi Konstruksi',
      description: 'Pemeriksaan realisasi voucher pengeluaran lapangan dan permohonan dana tambahan.',
      status: 'completed',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'event-init-6',
      title: 'Cuti Bersama / Libur Operasional Terbatas',
      date: dateStr(Math.min(28, Math.max(1, day + 10))),
      isAllDay: true,
      category: 'leave',
      division: 'ALL',
      location: 'Seluruh Divisi',
      description: 'Jadwal hari libur resmi perusahaan, outlet retail beroperasi dengan shift piket.',
      status: 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

export function useCalendarEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // Fallback
    }
    return generateInitialEvents();
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      console.error('Gagal menyimpan jadwal ke localStorage', err);
    }
  }, [events]);

  const addEvent = useCallback((eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt' | 'status'> & { status?: CalendarEvent['status'] }) => {
    const newEvent: CalendarEvent = {
      ...eventData,
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      status: eventData.status ?? 'scheduled',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setEvents(prev => [...prev, newEvent]);
    return newEvent;
  }, []);

  const updateEvent = useCallback((id: string, updates: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => {
    setEvents(prev =>
      prev.map(evt =>
        evt.id === id
          ? {
              ...evt,
              ...updates,
              updatedAt: new Date().toISOString(),
            }
          : evt
      )
    );
  }, []);

  const deleteEvent = useCallback((id: string) => {
    setEvents(prev => prev.filter(evt => evt.id !== id));
  }, []);

  const toggleStatus = useCallback((id: string) => {
    setEvents(prev =>
      prev.map(evt => {
        if (evt.id !== id) return evt;
        const nextStatus = evt.status === 'completed' ? 'scheduled' : 'completed';
        return {
          ...evt,
          status: nextStatus,
          updatedAt: new Date().toISOString(),
        };
      })
    );
  }, []);

  const resetToDefaults = useCallback(() => {
    const defaults = generateInitialEvents();
    setEvents(defaults);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaults));
  }, []);

  return {
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    toggleStatus,
    resetToDefaults,
  };
}
