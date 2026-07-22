import React from 'react';
import { cn } from '../../utils/cn';

const avatarSizes = {
  sm: 'w-8 h-8 text-sm',
  md: 'w-10 h-10 text-base',
  lg: 'w-16 h-16 text-lg',
  xl: 'w-20 h-20 text-xl'
};

export const Avatar = ({ 
  name = '', 
  src = null, 
  size = 'md', 
  className = '' 
}) => {
  const initials = name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover',
          avatarSizes[size],
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full bg-blue-600 text-white flex items-center justify-center font-medium',
        avatarSizes[size],
        className
      )}
    >
      {initials}
    </div>
  );
};