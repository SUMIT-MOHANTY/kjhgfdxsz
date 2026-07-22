const mongoose = require('mongoose');

const loanSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  book: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Book',
    required: true
  },
  borrowDate: {
    type: Date,
    default: Date.now
  },
  dueDate: {
    type: Date,
    required: true
  },
  returnDate: {
    type: Date,
    default: null
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  finePaid: {
    type: Boolean,
    default: false
  },
  renewalCount: {
    type: Number,
    default: 0,
    max: 2
  },
  notificationsSent: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

loanSchema.methods.calculateFine = function() {
  if (this.returnDate || this.status === 'returned') return this.fineAmount;
  
  const now = new Date();
  if (now <= this.dueDate) return 0;
  
  const overdueDays = Math.ceil((now - this.dueDate) / (1000 * 60 * 60 * 24));
  const finePerDay = 0.50; // $0.50 per day
  this.fineAmount = overdueDays * finePerDay;
  this.status = 'overdue';
  
  return this.fineAmount;
};

loanSchema.methods.isOverdue = function() {
  return !this.returnDate && new Date() > this.dueDate;
};

loanSchema.methods.canRenew = function() {
  return this.renewalCount < 2 && !this.isOverdue() && this.status === 'active';
};

loanSchema.statics.getActiveLoansForUser = function(userId) {
  return this.find({ user: userId, status: { $in: ['active', 'overdue'] } })
    .populate('book', 'title author isbn')
    .sort({ dueDate: 1 });
};

loanSchema.statics.getOverdueLoans = function() {
  return this.find({
    status: { $in: ['active', 'overdue'] },
    dueDate: { $lt: new Date() },
    returnDate: null
  }).populate('user', 'name email').populate('book', 'title author');
};

module.exports = mongoose.model('Loan', loanSchema);