const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const { validationResult } = require('express-validator');
const NotificationService = require('../services/notificationService');

class LoanController {
  // Borrow a book
  static async borrowBook(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { bookId } = req.body;
      const userId = req.user.id;

      // Check if book exists and is available
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ message: 'Book not found' });
      }

      if (book.availableCopies <= 0) {
        return res.status(400).json({ message: 'Book is not available for borrowing' });
      }

      // Check if user already has this book borrowed
      const existingLoan = await Loan.findOne({
        user: userId,
        book: bookId,
        status: { $in: ['active', 'overdue'] }
      });

      if (existingLoan) {
        return res.status(400).json({ message: 'You have already borrowed this book' });
      }

      // Check user's borrowing limit (max 5 books)
      const activeLoansCount = await Loan.countDocuments({
        user: userId,
        status: { $in: ['active', 'overdue'] }
      });

      if (activeLoansCount >= 5) {
        return res.status(400).json({ message: 'Borrowing limit reached (5 books maximum)' });
      }

      // Calculate due date (14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Create loan record
      const loan = new Loan({
        user: userId,
        book: bookId,
        dueDate: dueDate
      });

      await loan.save();

      // Update book availability
      book.availableCopies -= 1;
      await book.save();

      const populatedLoan = await Loan.findById(loan._id)
        .populate('book', 'title author isbn')
        .populate('user', 'name email');

      res.status(201).json({
        message: 'Book borrowed successfully',
        loan: populatedLoan
      });
    } catch (error) {
      console.error('Error borrowing book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Return a book
  static async returnBook(req, res) {
    try {
      const { loanId } = req.params;
      const userId = req.user.id;

      const loan = await Loan.findOne({
        _id: loanId,
        user: userId,
        status: { $in: ['active', 'overdue'] }
      }).populate('book');

      if (!loan) {
        return res.status(404).json({ message: 'Active loan not found' });
      }

      // Calculate final fine
      const fine = loan.calculateFine();
      
      // Update loan record
      loan.returnDate = new Date();
      loan.status = 'returned';
      loan.fineAmount = fine;
      await loan.save();

      // Update book availability
      const book = await Book.findById(loan.book._id);
      book.availableCopies += 1;
      await book.save();

      res.json({
        message: 'Book returned successfully',
        loan: loan,
        fine: fine > 0 ? `Fine amount: $${fine.toFixed(2)}` : 'No fine applicable'
      });
    } catch (error) {
      console.error('Error returning book:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Renew a loan
  static async renewLoan(req, res) {
    try {
      const { loanId } = req.params;
      const userId = req.user.id;

      const loan = await Loan.findOne({
        _id: loanId,
        user: userId,
        status: 'active'
      });

      if (!loan) {
        return res.status(404).json({ message: 'Active loan not found' });
      }

      if (!loan.canRenew()) {
        return res.status(400).json({ 
          message: 'Cannot renew: maximum renewals reached or book is overdue' 
        });
      }

      // Extend due date by 14 days
      loan.dueDate.setDate(loan.dueDate.getDate() + 14);
      loan.renewalCount += 1;
      await loan.save();

      res.json({
        message: 'Loan renewed successfully',
        newDueDate: loan.dueDate,
        renewalsRemaining: 2 - loan.renewalCount
      });
    } catch (error) {
      console.error('Error renewing loan:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get user's borrowing history
  static async getBorrowingHistory(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 10;
      const status = req.query.status;

      const query = { user: userId };
      if (status) {
        query.status = status;
      }

      const loans = await Loan.find(query)
        .populate('book', 'title author isbn')
        .sort({ borrowDate: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await Loan.countDocuments(query);

      // Calculate current fines for active loans
      const loansWithFines = loans.map(loan => {
        const loanObj = loan.toObject();
        if (loan.status === 'active' || loan.status === 'overdue') {
          loanObj.currentFine = loan.calculateFine();
        }
        return loanObj;
      });

      res.json({
        loans: loansWithFines,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLoans: total
      });
    } catch (error) {
      console.error('Error fetching borrowing history:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Get current active loans
  static async getActiveLoans(req, res) {
    try {
      const userId = req.user.id;
      
      const loans = await Loan.getActiveLoansForUser(userId);
      
      const loansWithFines = loans.map(loan => {
        const loanObj = loan.toObject();
        loanObj.currentFine = loan.calculateFine();
        loanObj.isOverdue = loan.isOverdue();
        loanObj.canRenew = loan.canRenew();
        return loanObj;
      });

      res.json({ loans: loansWithFines });
    } catch (error) {
      console.error('Error fetching active loans:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Admin: Get all overdue loans
  static async getOverdueLoans(req, res) {
    try {
      const overdueLoans = await Loan.getOverdueLoans();
      
      const loansWithFines = overdueLoans.map(loan => {
        const loanObj = loan.toObject();
        loanObj.currentFine = loan.calculateFine();
        return loanObj;
      });

      res.json({ overdueLoans: loansWithFines });
    } catch (error) {
      console.error('Error fetching overdue loans:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  // Pay fine
  static async payFine(req, res) {
    try {
      const { loanId } = req.params;
      const userId = req.user.id;

      const loan = await Loan.findOne({
        _id: loanId,
        user: userId
      });

      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }

      if (loan.fineAmount <= 0) {
        return res.status(400).json({ message: 'No fine to pay' });
      }

      loan.finePaid = true;
      await loan.save();

      res.json({
        message: `Fine of $${loan.fineAmount.toFixed(2)} paid successfully`
      });
    } catch (error) {
      console.error('Error paying fine:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

module.exports = LoanController;