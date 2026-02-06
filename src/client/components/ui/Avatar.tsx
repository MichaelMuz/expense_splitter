/**
 * Avatar component with initials and color generation
 */

import { stringToColor, getInitials } from '../../utils/colors';

interface AvatarProps {
  name: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function Avatar({
  name,
  src,
  size = 'md',
  className = '',
}: AvatarProps) {
  const sizeStyles = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-2xl',
  };

  const backgroundColor = stringToColor(name);
  const initials = getInitials(name);

  if (src) {
    return (
      <div
        className={`${sizeStyles[size]} rounded-full overflow-hidden flex items-center justify-center ${className}`}
      >
        <img src={src} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div
      className={`${sizeStyles[size]} rounded-full flex items-center justify-center font-semibold text-white ${className}`}
      style={{ backgroundColor }}
      title={name}
    >
      {initials}
    </div>
  );
}
