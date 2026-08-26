import api from '@/api/index';

export const getHeldProducts = () => {
  return api.get('/api/asset/products');
};
