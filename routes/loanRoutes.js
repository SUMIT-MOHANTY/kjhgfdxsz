const express = require('express');
const router = express.Router();
const loanController = require('../controllers/loanController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { validateLoan } = require('../middleware/validation');

// Borrow a book
router.post('/borrow', authenticateToken, validateLoan, loanController.borrowBook);

// Return a book
router.put('/:loanId/return', authenticateToken, loanController.returnBook);

// Renew a loan
router.put('/:loanId/renew', authenticateToken, loanController.renewLoan);

// Pay fine
router.post('/:loanId/pay-fine', authenticateToken, loanController.payFine);

// Get user's borrowing history
router.get('/user/:userId/history', authenticateToken, loanController.getUserHistory);

// Get user's active loans
router.get('/user/:userId/active', authenticateToken, loanController.getActiveLoans);

// Get overdue loans (admin only)
router.get('/overdue', authenticateToken, authorizeRoles(['admin', 'librarian']), loanController.getOverdueLoans);

module.exports = router;