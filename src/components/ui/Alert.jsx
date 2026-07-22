import React from 'react';
import { cn } from '../../utils/cn';

const alertVariants = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800'
};

export const Alert = ({ 
  children, 
  variant = 'info', 
  className = '', 
  ...props 
}) => {
  return (
    <div
      className={cn(
        'px-4 py-3 border rounded-md',
        alertVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};