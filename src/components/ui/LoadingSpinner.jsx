import React from 'react';
import { cn } from '../../utils/cn';

const spinnerSizes = {
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12'
};

export const LoadingSpinner = ({ 
  size = 'md', 
  className = '' 
}) => {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-gray-300 border-t-blue-600',
        spinnerSizes[size],
        className
      )}
    />
  );
};