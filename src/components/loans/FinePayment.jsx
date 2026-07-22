import React, { useState } from 'react';
import { payFine } from '../../services/loanService';

const FinePayment = ({ loanId, amount, onPayment }) => {
  const [loading, setLoading] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card');

  const handlePayment = async () => {
    setLoading(true);
    try {
      await payFine(loanId, { method: paymentMethod, amount });
      onPayment();
      setShowPayment(false);
    } catch (error) {
      console.error('Payment failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded font-medium"
        onClick={() => setShowPayment(true)}
      >
        Pay Fine (${amount})
      </button>

      {showPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Pay Fine</h3>
            
            <div className="mb-4">
              <p className="text-gray-600 mb-2">Fine Amount:</p>
              <p className="text-2xl font-bold text-red-600">${amount}</p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                className="w-full p-2 border border-gray-300 rounded-md"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="card">Credit/Debit Card</option>
                <option value="paypal">PayPal</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {paymentMethod === 'card' && (
              <div className="mb-6 space-y-3">
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                  <input
                    type="text"
                    placeholder="CVV"
                    className="flex-1 p-2 border border-gray-300 rounded-md"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  className="w-full p-2 border border-gray-300 rounded-md"
                />
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                onClick={() => setShowPayment(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded"
                onClick={handlePayment}
                disabled={loading}
              >
                {loading ? 'Processing...' : `Pay $${amount}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FinePayment;