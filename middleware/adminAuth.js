const adminAuth = (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'librarian') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

module.exports = adminAuth;