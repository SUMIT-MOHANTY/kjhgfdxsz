const Loan = require('../models/Loan');

class LoanHelpers {
  static calculateStandardDueDate(borrowDate = new Date()) {
    const dueDate = new Date(borrowDate);
    dueDate.setDate(dueDate.getDate() + 14); // Standard 14-day loan period
    return dueDate;
  }
  
  static calculateFineAmount(dueDate, returnDate = new Date()) {
    if (returnDate <= dueDate) return 0;
    
    const overdueDays = Math.ceil((returnDate - dueDate) / (1000 * 60 * 60 * 24));
    const finePerDay = 0.50;
    
    return overdueDays * finePerDay;
  }
  
  static async getUserLoanStats(userId) {
    const totalLoans = await Loan.countDocuments({ user: userId });
    const activeLoans = await Loan.countDocuments({ user: userId, isReturned: false });
    const overdueLoans = await Loan.countDocuments({
      user: userId,
      isReturned: false,
      dueDate: { $lt: new Date() }
    });
    
    const totalFines = await Loan.aggregate([
      { $match: { user: userId, fineAmount: { $gt: 0 }, isPaid: false } },
      { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);
    
    return {
      totalLoans,
      activeLoans,
      overdueLoans,
      outstandingFines: totalFines.length > 0 ? totalFines[0].total : 0
    };
  }
  
  static async getLibraryStats() {
    const totalActiveLoans = await Loan.countDocuments({ isReturned: false });
    const totalOverdueLoans = await Loan.countDocuments({
      isReturned: false,
      dueDate: { $lt: new Date() }
    });
    
    const totalUnpaidFines = await Loan.aggregate([
      { $match: { fineAmount: { $gt: 0 }, isPaid: false } },
      { $group: { _id: null, total: { $sum: '$fineAmount' } } }
    ]);
    
    return {
      totalActiveLoans,
      totalOverdueLoans,
      totalUnpaidFines: totalUnpaidFines.length > 0 ? totalUnpaidFines[0].total : 0
    };
  }
}

module.exports = LoanHelpers;