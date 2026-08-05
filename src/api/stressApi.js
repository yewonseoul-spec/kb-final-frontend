import instance from '@/api';

const BASE_URL = '/api/stress';

export default {
  // STRESS-01 시나리오 목록
  // 강도별 표시 문구('의료·건강 +15만원')까지 서버가 만들어서 내려준다
  async getScenarios() {
    const { data } = await instance.get(`${BASE_URL}/scenarios`);
    return data;
  },

  // STRESS-02 방어력 계산
  // memberNo 는 보내지 않는다. 서버가 토큰에서 채운다
  async getResult(scenarioCode, shockLevel) {
    const { data } = await instance.post(`${BASE_URL}/result`, null, {
      params: { scenarioCode, shockLevel },
    });
    return data;
  },
};