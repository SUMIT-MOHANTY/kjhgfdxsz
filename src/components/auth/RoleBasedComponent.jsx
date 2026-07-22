import { useAuth } from '../../hooks/useAuth';

export const RoleBasedComponent = ({ 
  children, 
  allowedRoles = [], 
  requiredRole = null, 
  fallback = null 
}) => {
  const { user, hasRole, hasAnyRole } = useAuth();

  // Check if user has required role
  if (requiredRole && !hasRole(requiredRole)) {
    return fallback;
  }

  // Check if user has any of the allowed roles
  if (allowedRoles.length > 0 && !hasAnyRole(allowedRoles)) {
    return fallback;
  }

  // If no role restrictions or user passes checks, render children
  return children;
};