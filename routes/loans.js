const express = require('express');
const router = express.Router();
const { body, param } = require('express-validator');
const LoanController = require('../controllers/loanController');
const auth = require('../middleware/auth');
const adminAuth = require('../middleware/adminAuth');

// Validation middleware
const borrowValidation = [
  body('bookId')
    .isMongoId()
    .withMessage('Valid book ID is required')
];

const loanIdValidation = [
  param('loanId')
    .isMongoId()
    .withMessage('Valid loan ID is required')
];

// Borrow a book
router.post('/borrow', auth, borrowValidation, LoanController.borrowBook);

// Return a book
router.patch('/return/:loanId', auth, loanIdValidation, LoanController.returnBook);

// Renew a loan
router.patch('/renew/:loanId', auth, loanIdValidation, LoanController.renewLoan);

// Get borrowing history
router.get('/history', auth, LoanController.getBorrowingHistory);

// Get active loans
router.get('/active', auth, LoanController.getActiveLoans);

// Pay fine
router.patch('/pay-fine/:loanId', auth, loanIdValidation, LoanController.payFine);

// Admin routes
router.get('/overdue', auth, adminAuth, LoanController.getOverdueLoans);

module.exports = router;