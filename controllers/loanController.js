const Loan = require('../models/Loan');
const Book = require('../models/Book');
const User = require('../models/User');
const { sendOverdueNotification } = require('../services/notificationService');

class LoanController {
  // Borrow a book
  async borrowBook(req, res) {
    try {
      const { bookId, userId } = req.body;
      
      // Check if book exists and is available
      const book = await Book.findById(bookId);
      if (!book) {
        return res.status(404).json({ error: 'Book not found' });
      }
      
      if (book.availableCopies <= 0) {
        return res.status(400).json({ error: 'Book is not available for borrowing' });
      }
      
      // Check if user exists
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      // Check if user already has this book borrowed
      const existingLoan = await Loan.findOne({
        user: userId,
        book: bookId,
        isReturned: false
      });
      
      if (existingLoan) {
        return res.status(400).json({ error: 'User already has this book borrowed' });
      }
      
      // Check user's borrowing limit (max 5 books)
      const activeLoans = await Loan.countDocuments({
        user: userId,
        isReturned: false
      });
      
      if (activeLoans >= 5) {
        return res.status(400).json({ error: 'User has reached maximum borrowing limit' });
      }
      
      // Calculate due date (14 days from borrow date)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);
      
      // Create loan record
      const loan = new Loan({
        user: userId,
        book: bookId,
        dueDate: dueDate
      });
      
      await loan.save();
      
      // Update book available copies
      book.availableCopies -= 1;
      await book.save();
      
      // Populate loan data for response
      await loan.populate(['user', 'book']);
      
      res.status(201).json({
        message: 'Book borrowed successfully',
        loan: loan
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Return a book
  async returnBook(req, res) {
    try {
      const { loanId } = req.params;
      
      const loan = await Loan.findById(loanId).populate(['user', 'book']);
      if (!loan) {
        return res.status(404).json({ error: 'Loan record not found' });
      }
      
      if (loan.isReturned) {
        return res.status(400).json({ error: 'Book already returned' });
      }
      
      // Calculate final fine
      const fineAmount = loan.calculateFine();
      
      // Update loan record
      loan.returnDate = new Date();
      loan.isReturned = true;
      loan.fineAmount = fineAmount;
      loan.status = 'returned';
      
      await loan.save();
      
      // Update book available copies
      const book = await Book.findById(loan.book._id);
      book.availableCopies += 1;
      await book.save();
      
      res.json({
        message: 'Book returned successfully',
        loan: loan,
        fineAmount: fineAmount
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get user's borrowing history
  async getUserHistory(req, res) {
    try {
      const { userId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      
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
      
      res.json({
        loans,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get active loans for a user
  async getActiveLoans(req, res) {
    try {
      const { userId } = req.params;
      
      const loans = await Loan.find({
        user: userId,
        isReturned: false
      })
      .populate('book', 'title author isbn')
      .sort({ dueDate: 1 });
      
      // Update fine amounts for overdue books
      const updatedLoans = loans.map(loan => {
        if (loan.isOverdue()) {
          loan.fineAmount = loan.calculateFine();
        }
        return loan;
      });
      
      res.json({ loans: updatedLoans });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Renew a loan
  async renewLoan(req, res) {
    try {
      const { loanId } = req.params;
      
      const loan = await Loan.findById(loanId).populate(['user', 'book']);
      if (!loan) {
        return res.status(404).json({ error: 'Loan record not found' });
      }
      
      if (loan.isReturned) {
        return res.status(400).json({ error: 'Cannot renew returned book' });
      }
      
      if (loan.renewalCount >= 2) {
        return res.status(400).json({ error: 'Maximum renewals reached' });
      }
      
      if (loan.fineAmount > 0 && !loan.isPaid) {
        return res.status(400).json({ error: 'Please pay outstanding fines before renewal' });
      }
      
      // Extend due date by 14 days
      const newDueDate = new Date(loan.dueDate);
      newDueDate.setDate(newDueDate.getDate() + 14);
      
      loan.dueDate = newDueDate;
      loan.renewalCount += 1;
      loan.status = 'active';
      
      await loan.save();
      
      res.json({
        message: 'Loan renewed successfully',
        loan: loan
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Get overdue loans
  async getOverdueLoans(req, res) {
    try {
      const overdueLoans = await Loan.find({
        isReturned: false,
        dueDate: { $lt: new Date() }
      })
      .populate(['user', 'book'])
      .sort({ dueDate: 1 });
      
      // Update fine amounts
      const updatedLoans = overdueLoans.map(loan => {
        loan.fineAmount = loan.calculateFine();
        loan.status = 'overdue';
        return loan;
      });
      
      res.json({ overdueLoans: updatedLoans });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
  
  // Pay fine
  async payFine(req, res) {
    try {
      const { loanId } = req.params;
      const { paymentMethod = 'cash' } = req.body;
      
      const loan = await Loan.findById(loanId).populate(['user', 'book']);
      if (!loan) {
        return res.status(404).json({ error: 'Loan record not found' });
      }
      
      if (loan.fineAmount <= 0) {
        return res.status(400).json({ error: 'No outstanding fine' });
      }
      
      loan.isPaid = true;
      await loan.save();
      
      res.json({
        message: 'Fine paid successfully',
        paidAmount: loan.fineAmount,
        paymentMethod: paymentMethod
      });
      
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = new LoanController();