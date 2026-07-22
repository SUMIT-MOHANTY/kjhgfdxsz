import React from 'react';
import { cn } from '../../utils/cn';

export const Input = ({ 
  className = '', 
  disabled = false, 
  ...props 
}) => {
  return (
    <input
      className={cn(
        'block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed',
        className
      )}
      disabled={disabled}
      {...props}
    />
  );
};