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
        <div className="w-14 h-14 rounded-full bg-[#2563EB]/10 flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[#2563EB]" />
        </div>
      )}
      {title && (
        <h3 className="text-base font-semibold text-gray-800 mb-1">{title}</h3>
      )}
      {message && (
        <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{message}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}