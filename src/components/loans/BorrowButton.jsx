import React, { useState } from 'react';
import { borrowBook } from '../../services/loanService';

const BorrowButton = ({ bookId, bookTitle, available, onBorrow }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleBorrowClick = () => {
    if (available) {
      setShowConfirm(true);
    }
  };

  const confirmBorrow = async () => {
    setLoading(true);
    try {
      await borrowBook(bookId);
      onBorrow();
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to borrow book:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className={`px-4 py-2 rounded font-medium ${
          available
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
        }`}
        onClick={handleBorrowClick}
        disabled={!available || loading}
      >
        {loading ? 'Borrowing...' : available ? 'Borrow Book' : 'Not Available'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Borrow</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to borrow "{bookTitle}"?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => setShowConfirm(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded"
                onClick={confirmBorrow}
                disabled={loading}
              >
                {loading ? 'Confirming...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BorrowButton;