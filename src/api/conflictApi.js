import instance from '@/api';

const BASE_URL = '/api/admin/conflict';

export default {
  // 전체 그림. 관리자가 무엇을 몇 건 하는지 먼저 본다
  async getSummary() {
    const { data } = await instance.get(`${BASE_URL}/review/summary`);
    return data;
  },

  // 검수 대기 목록. A 와 B 가 이미 특정된 것만 온다
  async getQueue() {
    const { data } = await instance.get(`${BASE_URL}/review/queue`);
    return data;
  },

  // decision — BLOCK / PARTIAL / NOT_CONFLICT
  async decide(candidateNo, decision, reason) {
    const params = { decision };
    if (reason) params.reason = reason;
    await instance.post(`${BASE_URL}/review/${candidateNo}/decide`, null, { params });
  },

  // 판단 보류. 잠금은 유지되고 만료 후 다시 표시된다
  async defer(candidateNo, days = 7) {
    await instance.post(`${BASE_URL}/review/${candidateNo}/defer`, null, {
      params: { days },
    });
  },

  // 확정분을 엔진이 읽는 규칙으로 내린다
  async publish() {
    const { data } = await instance.post(`${BASE_URL}/review/publish`);
    return data;
  },
};