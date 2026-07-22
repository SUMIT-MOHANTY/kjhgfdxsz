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
  isReturned: {
    type: Boolean,
    default: false
  },
  fineAmount: {
    type: Number,
    default: 0
  },
  isPaid: {
    type: Boolean,
    default: false
  },
  renewalCount: {
    type: Number,
    default: 0,
    max: 2
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'overdue'],
    default: 'active'
  }
}, {
  timestamps: true
});

loanSchema.methods.calculateFine = function() {
  if (this.isReturned || !this.dueDate) return 0;
  
  const currentDate = new Date();
  const dueDate = new Date(this.dueDate);
  
  if (currentDate <= dueDate) return 0;
  
  const overdueDays = Math.ceil((currentDate - dueDate) / (1000 * 60 * 60 * 24));
  const finePerDay = 0.50; // $0.50 per day
  
  return overdueDays * finePerDay;
};

loanSchema.methods.isOverdue = function() {
  if (this.isReturned) return false;
  return new Date() > new Date(this.dueDate);
};

loanSchema.pre('save', function(next) {
  if (!this.isReturned) {
    this.fineAmount = this.calculateFine();
    this.status = this.isOverdue() ? 'overdue' : 'active';
  } else {
    this.status = 'returned';
  }
  next();
});

module.exports = mongoose.model('Loan', loanSchema);