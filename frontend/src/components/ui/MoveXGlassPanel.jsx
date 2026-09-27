/**
 * MoveXGlassPanel — floating glass container.
 *
 * USE SPARINGLY — floating overlays only:
 *   map detail panels, modals, floating stats, post-activity report,
 *   MoveX Moment preview. ~10-20% of visible UI.
 */
export default function MoveXGlassPanel({
  children,
  className = '',
  padded = true,
  tone = 'light',
}) {
  const padding = padded ? 'p-4 sm:p-5' : '';
  const base =
    tone === 'dark'
      ? 'bg-slate-900/85 backdrop-blur-2xl text-white border border-white/15 shadow-glass'
      : tone === 'on-gradient'
      ? 'glass-on-gradient text-white'
      : 'glass-strong text-ink-900';

  return (
    <div className={`${base} rounded-panel ${padding} ${className}`}>
      {children}
    </div>
  );
}