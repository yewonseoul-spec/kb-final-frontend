import instance from '@/api';

const BASE_URL = '/api/home';

export default {
  // 홈 요약. 지금은 인기 혜택만 들어 있다
  async getSummary() {
    const { data } = await instance.get(BASE_URL);
    return data;
  },
};
