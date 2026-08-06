import instance from '@/api';

const BASE_URL = '/api/engine';

export default {
  // ENGINE-01 중복수혜 검사를 통과한 최적 혜택 조합
  // memberNo 는 보내지 않는다. 서버가 토큰에서 채운다
  async getEligibleBenefits() {
    const { data } = await instance.get(`${BASE_URL}/benefits`);
    return data;
  },
};