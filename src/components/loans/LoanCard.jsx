import React from 'react';
import { formatDate } from '../../utils/dateUtils';
import ReturnButton from './ReturnButton';
import FinePayment from './FinePayment';

const LoanCard = ({ loan, onUpdate }) => {
  const getStatusColor = (status) => {
    switch (status) {
      case 'borrowed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      case 'returned':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const isOverdue = () => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    return today > dueDate && loan.status === 'borrowed';
  };

  const getDaysOverdue = () => {
    const dueDate = new Date(loan.due_date);
    const today = new Date();
    const diffTime = today - dueDate;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {loan.book_title}
          </h3>
          <p className="text-gray-600 mb-1">Author: {loan.book_author}</p>
          <p className="text-gray-600 mb-1">ISBN: {loan.book_isbn}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(loan.status)}`}>
          {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
        <div>
          <span className="text-gray-500">Borrowed:</span>
          <p className="font-medium">{formatDate(loan.borrow_date)}</p>
        </div>
        <div>
          <span className="text-gray-500">Due:</span>
          <p className={`font-medium ${isOverdue() ? 'text-red-600' : ''}`}>
            {formatDate(loan.due_date)}
          </p>
        </div>
        {loan.return_date && (
          <div>
            <span className="text-gray-500">Returned:</span>
            <p className="font-medium">{formatDate(loan.return_date)}</p>
          </div>
        )}
        {loan.fine_amount > 0 && (
          <div>
            <span className="text-gray-500">Fine:</span>
            <p className="font-medium text-red-600">${loan.fine_amount}</p>
          </div>
        )}
      </div>

      {isOverdue() && (
        <div className="bg-red-50 border border-red-200 rounded p-3 mb-4">
          <p className="text-red-800 text-sm">
            <strong>Overdue:</strong> This book is {getDaysOverdue()} days overdue.
            Please return it as soon as possible to avoid additional fines.
          </p>
        </div>
      )}

      <div className="flex gap-3">
        {loan.status === 'borrowed' && (
          <ReturnButton loanId={loan.id} onReturn={onUpdate} />
        )}
        {loan.fine_amount > 0 && !loan.fine_paid && (
          <FinePayment
            loanId={loan.id}
            amount={loan.fine_amount}
            onPayment={onUpdate}
          />
        )}
      </div>
    </div>
  );
};

export default LoanCard;