export default function LoadingSkeleton({
  variant = 'line',
  count = 1,
  className = '',
}) {
  const styles = {
    line: 'h-4 w-full rounded-md',
    metric: 'h-8 w-24 rounded-md',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-32 w-full rounded-2xl',
    chip: 'h-6 w-20 rounded-full',
  };

  const shape = styles[variant] || styles.line;

  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`shimmer ${shape}`} />
      ))}
    </div>
  );
}