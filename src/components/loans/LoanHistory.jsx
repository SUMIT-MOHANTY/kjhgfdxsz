import React, { useState, useEffect } from 'react';
import { getUserLoans } from '../../services/loanService';
import LoanCard from './LoanCard';

const LoanHistory = ({ userId }) => {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadLoans();
  }, [userId]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const data = await getUserLoans(userId);
      setLoans(data);
    } catch (err) {
      setError('Failed to load loan history');
    } finally {
      setLoading(false);
    }
  };

  const filteredLoans = loans.filter(loan => {
    if (filter === 'active') return loan.status === 'borrowed';
    if (filter === 'returned') return loan.status === 'returned';
    if (filter === 'overdue') return loan.status === 'overdue';
    return true;
  });

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>{error}</p>
        <button
          onClick={loadLoans}
          className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">My Loan History</h2>
        <div className="flex gap-2">
          {['all', 'active', 'returned', 'overdue'].map(filterType => (
            <button
              key={filterType}
              className={`px-3 py-1 rounded text-sm font-medium ${
                filter === filterType
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
              onClick={() => setFilter(filterType)}
            >
              {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {filteredLoans.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>No loans found for the selected filter.</p>
          </div>
        ) : (
          filteredLoans.map(loan => (
            <LoanCard key={loan.id} loan={loan} onUpdate={loadLoans} />
          ))
        )}
      </div>
    </div>
  );
};

export default LoanHistory;