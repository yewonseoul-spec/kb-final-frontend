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

  // 시험 실행. DB 에 쓰지 않으므로 몇 번을 돌려도 안전하다
  async test(benefitNo, content) {
    const { data } = await instance.post(
      `${BASE_URL}/test`,
      { benefitNo, content },
      { timeout: 120000 },
    );
    return data;
  },
};