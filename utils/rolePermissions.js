const authConfig = require('../config/auth');

class RolePermissions {
  static hasPermission(userRole, permission) {
    const rolePermissions = authConfig.permissions[userRole];
    return rolePermissions && rolePermissions.includes(permission);
  }

  static requirePermission(permission) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      if (!this.hasPermission(req.user.role, permission)) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required permission: ${permission}`
        });
      }

      next();
    };
  }

  static requireAnyPermission(permissions) {
    return (req, res, next) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      const hasAnyPermission = permissions.some(permission => 
        this.hasPermission(req.user.role, permission)
      );

      if (!hasAnyPermission) {
        return res.status(403).json({
          success: false,
          message: `Permission denied. Required one of: ${permissions.join(', ')}`
        });
      }

      next();
    };
  }

  static getUserPermissions(userRole) {
    return authConfig.permissions[userRole] || [];
  }

  static isAdmin(user) {
    return user && user.role === authConfig.roles.ADMIN;
  }

  static isLibrarian(user) {
    return user && user.role === authConfig.roles.LIBRARIAN;
  }

  static isMember(user) {
    return user && user.role === authConfig.roles.MEMBER;
  }

  static canManageUsers(user) {
    return this.hasPermission(user?.role, 'user:delete');
  }

  static canManageBooks(user) {
    return this.hasPermission(user?.role, 'book:create');
  }

  static canManageBorrows(user) {
    return this.hasPermission(user?.role, 'borrow:update');
  }
}

module.exports = RolePermissions;