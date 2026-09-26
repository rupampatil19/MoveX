import { Link } from 'react-router-dom';

export default function MoveXCard({
  children,
  className = '',
  elevated = false,
  hero = false,
  padded = true,
  as: Tag = 'div',
  to,
  ...rest
}) {
  const padding = padded ? 'p-5' : '';
  const radius = hero ? 'rounded-3xl' : 'rounded-2xl';
  const shadow = hero
    ? 'shadow-[0_8px_24px_rgba(37,99,235,0.15)]'
    : elevated
    ? 'shadow-[0_4px_12px_rgba(37,99,235,0.08)]'
    : 'shadow-[0_1px_3px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]';
  const base = `bg-white border border-gray-200/80 ${radius} ${padding} ${shadow} ${className}`;

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