module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  bcrypt: {
    saltRounds: 12
  },
  passwordReset: {
    expiresIn: 10 * 60 * 1000 // 10 minutes
  },
  roles: {
    ADMIN: 'Admin',
    LIBRARIAN: 'Librarian',
    MEMBER: 'Member'
  },
  permissions: {
    Admin: [
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'book:create',
      'book:read',
      'book:update',
      'book:delete',
      'borrow:create',
      'borrow:read',
      'borrow:update',
      'borrow:delete',
      'system:admin'
    ],
    Librarian: [
      'user:read',
      'book:create',
      'book:read',
      'book:update',
      'book:delete',
      'borrow:create',
      'borrow:read',
      'borrow:update',
      'borrow:delete'
    ],
    Member: [
      'book:read',
      'borrow:create',
      'borrow:read'
    ]
  }
};