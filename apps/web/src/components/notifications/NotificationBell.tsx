import { useState, useMemo } from 'react';
import { Bell } from 'lucide-react';
import { NotificationPopover } from './NotificationPopover';
import { INITIAL_NOTIFICATIONS, type NotificationItem } from './notificationTypes';

export interface NotificationBellProps {
  notifications?: NotificationItem[];
  onNotificationsChange?: (items: NotificationItem[]) => void;
  onOpenAuditModal?: () => void;
  className?: string;
}

export function NotificationBell({
  notifications: controlledNotifications,
  onNotificationsChange,
  onOpenAuditModal,
  className = '',
}: NotificationBellProps) {
  const [internalNotifications, setInternalNotifications] = useState<NotificationItem[]>(INITIAL_NOTIFICATIONS);
  const [isOpen, setIsOpen] = useState(false);

  const notifications = controlledNotifications ?? internalNotifications;

  const updateNotifications = (newItems: NotificationItem[]) => {
    if (onNotificationsChange) {
      onNotificationsChange(newItems);
    } else {
      setInternalNotifications(newItems);
    }
  };

  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.isRead).length,
    [notifications],
  );

  const handleMarkAsRead = (id: string) => {
    const updated = notifications.map((item) =>
      item.id === id ? { ...item, isRead: true } : item,
    );
    updateNotifications(updated);
  };

  const handleMarkAllAsRead = () => {
    const updated = notifications.map((item) => ({ ...item, isRead: true }));
    updateNotifications(updated);
  };

  const handleClearAll = () => {
    updateNotifications([]);
  };

  return (
    <div className={`relative inline-block ${className}`}>
      <button
        type="button"
        aria-label="Pusat Notifikasi & Peringatan Dini"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((prev) => !prev)}
        className="relative flex items-center justify-center rounded-xl border border-slate-200/90 bg-slate-50/80 p-2 text-slate-600 hover:border-sky-300 hover:bg-sky-50/60 hover:text-sky-900 transition-all shadow-2xs active:scale-95 cursor-pointer"
        data-testid="notification-bell-btn"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse ring-2 ring-white"
            data-testid="notification-unread-badge"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      <NotificationPopover
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        notifications={notifications}
        onMarkAsRead={handleMarkAsRead}
        onMarkAllAsRead={handleMarkAllAsRead}
        onClearAll={handleClearAll}
        onOpenAuditModal={() => {
          setIsOpen(false);
          if (onOpenAuditModal) {
            onOpenAuditModal();
          }
        }}
      />
    </div>
  );
}
