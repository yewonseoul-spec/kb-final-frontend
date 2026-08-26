import instance from '@/api';

export const getAiAnalysis = async () => {
  const res = await instance.get('/api/consumption/analysis/ai');
  return typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
};