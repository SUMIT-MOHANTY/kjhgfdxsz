import React, { useState, useEffect } from 'react';
import { getOverdueBooks, dismissNotification } from '../../services/loanService';
import { formatDate } from '../../utils/dateUtils';

const OverdueNotifications = ({ userId }) => {
  const [overdueBooks, setOverdueBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(new Set());

  useEffect(() => {
    loadOverdueBooks();
  }, [userId]);

  const loadOverdueBooks = async () => {
    try {
      const data = await getOverdueBooks(userId);
      setOverdueBooks(data);
    } catch (error) {
      console.error('Failed to load overdue books:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = async (loanId) => {
    try {
      await dismissNotification(loanId);
      setDismissed(prev => new Set([...prev, loanId]));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  };

  const getDaysOverdue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = today - due;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const visibleOverdueBooks = overdueBooks.filter(book => !dismissed.has(book.id));

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </div>
    );
  }

  if (visibleOverdueBooks.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-red-700 mb-3 flex items-center">
        <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        Overdue Books ({visibleOverdueBooks.length})
      </h3>
      
      <div className="space-y-3">
        {visibleOverdueBooks.map(book => (
          <div key={book.id} className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <h4 className="font-medium text-red-900 mb-1">{book.book_title}</h4>
                <p className="text-red-700 text-sm mb-1">
                  Due: {formatDate(book.due_date)} ({getDaysOverdue(book.due_date)} days overdue)
                </p>
                <p className="text-red-600 text-sm">
                  Fine: ${book.fine_amount || '0.00'}
                </p>
              </div>
              <button
                onClick={() => handleDismiss(book.id)}
                className="text-red-400 hover:text-red-600 ml-4"
                title="Dismiss notification"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverdueNotifications;