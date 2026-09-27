export default function EmptyState({
  icon: Icon,
  title,
  message,
  action,
  className = '',
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center py-10 px-6 ${className}`}
    >
      {Icon && (
        <div className="relative mb-5">
          <div className="absolute inset-0 rounded-full bg-[#2563EB]/20 blur-xl" />
          <div className="relative w-16 h-16 rounded-full icon-tile-soft-blue flex items-center justify-center border border-white/60">
            <Icon className="w-7 h-7 text-[#2563EB]" />
          </div>
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-ink-900 mb-1">{title}</h3>
      )}
      {message && (
        <p className="text-sm text-ink-500 max-w-xs leading-relaxed">{message}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}