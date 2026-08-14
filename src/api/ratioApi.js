import api from '@/api/index';

export const getAssetRatio = () => {
  return api.get('/api/asset/ratio');
};