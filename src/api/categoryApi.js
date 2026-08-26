import instance from '@/api';

export const getCategoryAmounts = async () => {
    const res = await instance.get('/api/consumption/analysis/category');
    return res.data;
}