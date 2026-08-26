import instance from '@/api';

const BASE_URL = '/api/admin/prompt';

export default {
  async getKeys() {
    const { data } = await instance.get(`${BASE_URL}/keys`);
    return data;
  },

  async getVersions(promptKey) {
    const { data } = await instance.get(`${BASE_URL}/${promptKey}/versions`);
    return data;
  },

  // 저장만 하고 적용하지는 않는다. 적용은 activate 로 따로 한다
  async createVersion(promptKey, content, memo) {
    const { data } = await instance.post(`${BASE_URL}/versions`, {
      promptKey, content, memo,
    });
    return data;
  },

  async activate(promptKey, promptNo) {
    await instance.post(`${BASE_URL}/${promptKey}/activate/${promptNo}`);
  },

  async deleteVersion(promptKey, promptNo) {
    await instance.delete(`${BASE_URL}/${promptKey}/versions/${promptNo}`);
  },

  // 중복수혜 분석 시험 실행. DB 에 쓰지 않으므로 몇 번을 돌려도 안전하다
  async test(plcyNo, content) {
    const { data } = await instance.post(
      `${BASE_URL}/test`,
      { plcyNo, content },
      { timeout: 120000 },
    );
    return data;
  },

  /*
   * 소비 분석 시험 실행.
   *
   * 분석을 돌리고 그 결과를 검증까지 태워 둘 다 돌려받는다.
   * summaryJson 은 관리자가 넣는 목데이터다 — 회원 소비 내역은 매일 바뀌어서
   * 결과가 달라진 원인이 프롬프트인지 데이터인지 구분할 수 없다.
   *
   * OpenAI 를 두 번 부르고 재시도가 최대 2회라 최악의 경우 네 번 호출한다.
   * 공용 instance 의 timeout 10초로는 부족해서 따로 지정한다.
   */
  async testConsumption(summaryJson, analysisPrompt, verificationPrompt) {
    const { data } = await instance.post(
      `${BASE_URL}/test/consumption`,
      { summaryJson, analysisPrompt, verificationPrompt },
      { timeout: 180000 },
    );
    return data;
  },
};