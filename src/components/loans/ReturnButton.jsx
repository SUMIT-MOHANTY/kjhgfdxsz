import React, { useState } from 'react';
import { returnBook } from '../../services/loanService';

const ReturnButton = ({ loanId, onReturn }) => {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReturn = async () => {
    setLoading(true);
    try {
      await returnBook(loanId);
      onReturn();
      setShowConfirm(false);
    } catch (error) {
      console.error('Failed to return book:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-medium"
        onClick={() => setShowConfirm(true)}
        disabled={loading}
      >
        Return Book
      </button>

      {showConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Return</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to return this book?
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
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded"
                onClick={handleReturn}
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Confirm Return'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ReturnButton;