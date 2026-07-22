import api from './api';

export const borrowBook = async (bookId) => {
  const response = await api.post('/loans/borrow/', { book_id: bookId });
  return response.data;
};

export const returnBook = async (loanId) => {
  const response = await api.post(`/loans/${loanId}/return/`);
  return response.data;
};

export const getUserLoans = async (userId) => {
  const response = await api.get(`/loans/user/${userId}/`);
  return response.data;
};

export const getOverdueBooks = async (userId) => {
  const response = await api.get(`/loans/user/${userId}/overdue/`);
  return response.data;
};

export const payFine = async (loanId, paymentData) => {
  const response = await api.post(`/loans/${loanId}/pay-fine/`, paymentData);
  return response.data;
};

export const dismissNotification = async (loanId) => {
  const response = await api.post(`/loans/${loanId}/dismiss-notification/`);
  return response.data;
};

export const getLoanStats = async (userId) => {
  const response = await api.get(`/loans/user/${userId}/stats/`);
  return response.data;
};