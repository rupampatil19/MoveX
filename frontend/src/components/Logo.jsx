import { Link } from 'react-router-dom';

const Logo = ({ size = 'md', pro = false, light = false }) => {
  const sizes = {
    sm: { text: 'text-xl', tagline: 'text-[10px]' },
    md: { text: 'text-3xl', tagline: 'text-xs' },
    lg: { text: 'text-4xl', tagline: 'text-sm' },
  };
  const { text, tagline } = sizes[size] || sizes.md;

  // Correctly set text color: dark on light backgrounds, white on dark backgrounds
  const moveColor = light ? 'text-gray-900' : 'text-white';

  return (
    <Link to="/" className="flex flex-col items-start leading-none">
      <span className={`font-extrabold italic ${text} ${moveColor}`}>
        Move
        <span className="text-[#2563EB] ml-1">X</span>
      </span>
      <span className={`${tagline} text-gray-400 mt-1`}>
        Move More. Evolve Together.
      </span>
    </Link>
  );
};

export default Logo;