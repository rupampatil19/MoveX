import { Link } from 'react-router-dom';

export default function SectionHeader({
  title,
  subtitle,
  actionTo,
  actionLabel,
  icon: Icon,
  className = '',
}) {
  return (
    <div className={`flex items-center justify-between mb-3 ${className}`}>
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {Icon ? (
          <Icon className="w-4 h-4 text-[#2563EB] shrink-0" />
        ) : (
          <span className="section-accent" />
        )}
        <div className="min-w-0">
          <h2 className="text-base font-semibold text-ink-900 truncate">{title}</h2>
          {subtitle && (
            <p className="text-xs text-ink-500 mt-0.5 truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actionTo && actionLabel && (
        <Link
          to={actionTo}
          className="text-sm font-medium text-[#2563EB] hover:text-[#1D4ED8] shrink-0 ml-3 whitespace-nowrap transition-colors"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}