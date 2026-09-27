import { Link } from 'react-router-dom';

/**
 * MoveXCard — unified card primitive.
 *
 * Variants:
 *   default  — standard white card on soft background
 *   premium  — gradient border + richer shadow (hero-adjacent content)
 *   metric   — slightly elevated (key metrics)
 *   bento    — mid-weight (Bento grids)
 *   hero     — strong shadow (hero sections)
 *   glass    — translucent glass (floating overlays only)
 */
export default function MoveXCard({
  children,
  className = '',
  variant,
  elevated = false,
  hero = false,
  padded = true,
  as: Tag = 'div',
  to,
  ...rest
}) {
  const v = variant || (hero ? 'hero' : elevated ? 'metric' : 'default');
  const padding = padded ? 'p-5' : '';
  const radius = v === 'hero' ? 'rounded-hero' : v === 'glass' ? 'rounded-panel' : 'rounded-card';

  const styles = {
    default: 'bg-white border border-surface-200/80 shadow-soft',
    premium: 'premium-card',
    metric: 'bg-white border border-surface-200/80 shadow-elevated',
    bento: 'bg-white border border-surface-200/80 shadow-card',
    hero: 'bg-white border border-surface-200/80 shadow-hero',
    glass: 'glass-strong',
  };

  const base = `${styles[v] || styles.default} ${radius} ${padding} ${className}`;

  if (to) {
    return (
      <Link to={to} className={`block ${base}`} {...rest}>
        {children}
      </Link>
    );
  }
  return (
    <Tag className={base} {...rest}>
      {children}
    </Tag>
  );
}