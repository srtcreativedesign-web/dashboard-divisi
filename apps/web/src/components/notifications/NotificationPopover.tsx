import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Check,
  Trash2,
  ArrowRight,
  ShieldCheck,
  X,
  ExternalLink,
  Clock,
  Sparkles,
  Layers,
} from 'lucide-react';
import type {
  NotificationItem,
  NotificationCategory,
  NotificationSeverity,
} from './notificationTypes';

interface NotificationPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onOpenAuditModal: () => void;
}

const CATEGORY_TABS: Array<{ id: NotificationCategory; label: string }> = [
  { id: 'all', label: 'Semua' },
  { id: 'financial', label: 'Finansial' },
  { id: 'operational', label: 'Operasional' },
  { id: 'audit', label: 'Audit' },
];

export function NotificationPopover({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onOpenAuditModal,
}: NotificationPopoverProps) {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<NotificationCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'danger' | 'warning'>('all');

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeCategory !== 'all' && item.category !== activeCategory) {
        return false;
      }
      if (severityFilter !== 'all' && item.severity !== severityFilter) {
        return false;
      }
      return true;
    });
  }, [notifications, activeCategory, severityFilter]);

  if (!isOpen) return null;

  const handleActionClick = (path?: string) => {
    onClose();
    if (path) {
      navigate(path);
    }
  };

  const renderSeverityIcon = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'danger':
        return <AlertCircle className="h-4 w-4 text-rose-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-amber-600" />;
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
      case 'info':
      default:
        return <Info className="h-4 w-4 text-sky-600" />;
    }
  };

  return (
    <>
      {/* Invisible backdrop to dismiss on click outside */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
        data-testid="notification-popover-backdrop"
      />

      {/* Floating Popover Container */}
      <div
        role="dialog"
        aria-modal="false"
        aria-label="Pusat Notifikasi & Peringatan"
        className="absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-sky-200/90 ring-1 ring-black/5 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        data-testid="notification-popover"
      >
        {/* Top accent gradient bar */}
        <div className="h-1 w-full bg-gradient-to-r from-primary-600 via-sky-500 to-sage shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-line/70 px-4 py-3 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-800">
              <Bell className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-navy leading-tight">Pusat Notifikasi</h3>
              <p className="text-[10px] text-slate-500">
                {unreadCount > 0 ? (
                  <span className="font-semibold text-rose-600">{unreadCount} belum dibaca</span>
                ) : (
                  'Semua notifikasi telah dibaca'
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={onMarkAllAsRead}
                title="Tandai semua sudah dibaca"
                className="text-[11px] font-semibold text-sky-700 hover:text-sky-900 px-2 py-1 rounded-md hover:bg-sky-50 transition-colors"
                data-testid="mark-all-read-btn"
              >
                Tandai Dibaca
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Tutup popover notifikasi"
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center border-b border-line/50 px-2 pt-1 bg-white shrink-0 overflow-x-auto scrollbar-none">
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeCategory === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                className={`flex-1 min-w-[70px] py-1.5 text-center text-xs font-semibold border-b-2 transition-all ${
                  isActive
                    ? 'border-sky-600 text-sky-900'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
                data-testid={`notif-tab-${tab.id}`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Severity Quick Filters */}
        <div className="flex items-center gap-1.5 px-3 py-2 bg-slate-50/50 border-b border-line/40 text-[10px] shrink-0">
          <span className="text-slate-400 font-medium">Urgensi:</span>
          <button
            type="button"
            onClick={() => setSeverityFilter('all')}
            className={`px-2 py-0.5 rounded-full font-medium transition-colors ${
              severityFilter === 'all'
                ? 'bg-slate-800 text-white'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            data-testid="severity-filter-all"
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('danger')}
            className={`px-2 py-0.5 rounded-full font-semibold transition-colors ${
              severityFilter === 'danger'
                ? 'bg-rose-600 text-white'
                : 'bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100'
            }`}
            data-testid="severity-filter-danger"
          >
            Kritis
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('warning')}
            className={`px-2 py-0.5 rounded-full font-semibold transition-colors ${
              severityFilter === 'warning'
                ? 'bg-amber-600 text-white'
                : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
            data-testid="severity-filter-warning"
          >
            Peringatan
          </button>
        </div>

        {/* List of Notifications */}
        <div
          className="flex-1 overflow-y-auto divide-y divide-slate-100 scrollbar-thin scrollbar-thumb-slate-200"
          data-testid="notification-list"
        >
          {filteredNotifications.length === 0 ? (
            <div className="py-8 px-4 text-center">
              <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
                <Check className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold text-slate-700">Tidak ada notifikasi saat ini</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Semua data operasional dalam batas aman</p>
            </div>
          ) : (
            filteredNotifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 transition-colors relative flex items-start gap-3 ${
                  !notif.isRead
                    ? 'bg-sky-50/40 hover:bg-sky-50/70'
                    : 'bg-white hover:bg-slate-50'
                }`}
                data-testid={`notif-item-${notif.id}`}
              >
                {/* Severity Icon Box */}
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border shadow-2xs ${
                    notif.severity === 'danger'
                      ? 'bg-rose-50 border-rose-200'
                      : notif.severity === 'warning'
                      ? 'bg-amber-50 border-amber-200'
                      : notif.severity === 'success'
                      ? 'bg-emerald-50 border-emerald-200'
                      : 'bg-sky-50 border-sky-200'
                  }`}
                >
                  {renderSeverityIcon(notif.severity)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <p className="text-xs font-bold text-navy truncate leading-tight">
                        {notif.title}
                      </p>
                      {notif.divisionCode && (
                        <span className="text-[9px] font-bold text-sky-800 bg-sky-100 px-1.5 py-0.2 rounded border border-sky-200 shrink-0">
                          {notif.divisionCode}
                        </span>
                      )}
                    </div>
                    {!notif.isRead && (
                      <span
                        className="h-2 w-2 rounded-full bg-sky-600 shrink-0 ring-2 ring-sky-200"
                        title="Belum dibaca"
                        data-testid={`unread-dot-${notif.id}`}
                      />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                    {notif.message}
                  </p>

                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 font-medium">
                      {notif.relativeTime}
                    </span>

                    <div className="flex items-center gap-1.5">
                      {notif.actionLabel && (
                        <button
                          type="button"
                          onClick={() => handleActionClick(notif.actionPath)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-sky-800 bg-sky-100/70 hover:bg-sky-200/70 px-2 py-0.5 rounded-md transition-colors"
                          data-testid={`notif-action-btn-${notif.id}`}
                        >
                          <span>{notif.actionLabel}</span>
                          <ArrowRight className="h-2.5 w-2.5" />
                        </button>
                      )}

                      {!notif.isRead && (
                        <button
                          type="button"
                          onClick={() => onMarkAsRead(notif.id)}
                          title="Tandai sudah dibaca"
                          className="p-1 rounded text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                          data-testid={`mark-read-btn-${notif.id}`}
                        >
                          <Check className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer Audit Trail Link */}
        <div className="border-t border-line/60 bg-slate-50/90 px-4 py-2.5 flex items-center justify-between shrink-0 text-[11px]">
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenAuditModal();
            }}
            className="flex items-center gap-1.5 font-bold text-sky-800 hover:text-sky-950 transition-colors"
            data-testid="open-audit-trail-btn"
          >
            <ShieldCheck className="h-3.5 w-3.5 text-sky-600" />
            <span>Lihat Jejak Audit Lengkap</span>
          </button>

          {notifications.length > 0 && (
            <button
              type="button"
              onClick={onClearAll}
              title="Hapus semua notifikasi yang sudah dibaca"
              className="text-slate-400 hover:text-rose-600 p-1 rounded transition-colors"
              data-testid="clear-all-notifs-btn"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
