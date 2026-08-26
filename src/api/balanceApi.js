import api from '@/api/index';

export const getAccountBalances = () => {
  return api.get('/api/asset/balance');
};