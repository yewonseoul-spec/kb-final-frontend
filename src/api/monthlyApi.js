import axios from '@/api';

export const getMonthlyTrend = async () => {
  const res = await axios.get('/api/consumption/analysis/monthly');
  return res.data;
};