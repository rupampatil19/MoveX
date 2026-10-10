import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, Clock } from 'lucide-react';
import { getNotifications, markNotificationRead, dismissNotification, snoozeNotification } from '../../services/penaltyApi';

/**
 * FriendlyNudge — encouraging banner shown at top of Dashboard/Home
 * when the user has an unread penalty notification.
 * Never aggressive. Always ends with an action.
 */
export default function FriendlyNudge({ onCountChange }) {
  const [notification, setNotification] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      const res = await getNotifications();
      if (!alive) return;
      // Prioritize: unread first, then most recent
      const first = res.notifications?.find((n) => !n.read) || null;
      setNotification(first);
      onCountChange?.(res.unreadCount || 0);
    })();
    return () => { alive = false; };
  }, []);

  const handleDismiss = async () => {
    if (!notification) return;
    setBusy(true);
    try {
      await dismissNotification(notification._id);
      setNotification(null);
      onCountChange?.(0);
    } finally {
      setBusy(false);
    }
  };

  const handleSnooze = async () => {
    if (!notification) return;
    setBusy(true);
    try {
      await snoozeNotification(notification._id, 24);
      setNotification(null);
      onCountChange?.(0);
    } finally {
      setBusy(false);
    }
  };

  const handleActionClick = async () => {
    if (!notification) return;
    await markNotificationRead(notification._id);
  };

  if (!notification) return null;

  const tone = notification.tone || 'encouraging';
  const toneStyles = {
    encouraging: {
      wrap: 'bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] border-[#2563EB]/20',
      icon: 'bg-[#2563EB] text-white',
      title: 'text-[#1e40af]',
      body: 'text-[#1e3a8a]/80',
      action: 'bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-md shadow-[#2563EB]/25',
    },
    info: {
      wrap: 'bg-gradient-to-br from-[#F0F9FF] to-[#E0F2FE] border-sky-500/20',
      icon: 'bg-sky-500 text-white',
      title: 'text-sky-900',
      body: 'text-sky-900/75',
      action: 'bg-gradient-to-b from-sky-500 to-sky-600 text-white shadow-md shadow-sky-500/25',
    },
    warning: {
      wrap: 'bg-gradient-to-br from-[#FFFBEB] to-[#FEF3C7] border-amber-500/30',
      icon: 'bg-amber-500 text-white',
      title: 'text-amber-900',
      body: 'text-amber-900/80',
      action: 'bg-gradient-to-b from-amber-500 to-amber-600 text-white shadow-md shadow-amber-500/25',
    },
  };
  const s = toneStyles[tone] || toneStyles.encouraging;

  return (
    <AnimatePresence>
      {notification && (
        <motion.div
          key={notification._id}
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.2 }}
          className={`relative rounded-2xl border ${s.wrap} p-4 shadow-[0_4px_16px_-4px_rgba(37,99,235,0.12)]`}
        >
          <div className="flex items-start gap-3">
            {/* Icon */}
            <div className={`w-10 h-10 rounded-xl ${s.icon} flex items-center justify-center shrink-0 shadow-sm`}>
              <span className="text-lg">
                {tone === 'warning' ? '⚠️' : tone === 'info' ? 'ℹ️' : '👋'}
              </span>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0 pr-8">
              <p className={`text-sm font-bold ${s.title} leading-tight`}>
                {notification.title}
              </p>
              <p className={`text-xs ${s.body} mt-1 leading-relaxed`}>
                {notification.message}
              </p>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {notification.actionLink && notification.actionLabel && (
                  <Link
                    to={notification.actionLink}
                    onClick={handleActionClick}
                    className={`inline-flex items-center gap-1.5 ${s.action} text-xs font-semibold px-3 py-1.5 rounded-lg transition active:scale-[0.98]`}
                  >
                    {notification.actionLabel}
                    <ArrowRight className="w-3 h-3" />
                  </Link>
                )}
                <button
                  onClick={handleSnooze}
                  disabled={busy}
                  className={`inline-flex items-center gap-1 text-[11px] ${s.body} hover:opacity-100 opacity-80 transition disabled:opacity-50`}
                >
                  <Clock className="w-3 h-3" />
                  Remind me tomorrow
                </button>
              </div>
            </div>

            {/* Close */}
            <button
              onClick={handleDismiss}
              disabled={busy}
              className={`absolute top-3 right-3 p-1.5 rounded-lg ${s.body} hover:bg-white/50 transition disabled:opacity-50`}
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}