import instance from '@/api';

const BASE_URL = '/api/mypage';

// 프로필은 전 항목 선택 입력이라 미입력이 정상이다.
// input/select 가 만드는 '' 를 그대로 보내면 CHAR(7) FK 위반·Date 파싱 실패로 400이 나므로
// 전송 직전에 null 로 바꾼다.
const sanitize = (profile) =>
  Object.fromEntries(
    Object.entries(profile).map(([key, value]) => [
      key,
      value === '' ? null : value,
    ]),
  );

export default {
  // 프로필 최초 저장 — 이미 있으면 409
  async createProfile(profile) {
    const { data } = await instance.post(`${BASE_URL}/info`, sanitize(profile));
    return data;
  },

  // 프로필 조회 — 404 는 오류가 아니라 '미입력' 이므로 호출부에서 분기할 것
  async getProfile() {
    const { data } = await instance.get(`${BASE_URL}/info`);
    return data;
  },

  // 프로필 수정 — 서버가 전체 교체하므로 기존 값을 모두 채워 보낼 것
  async updateProfile(profile) {
    const { data } = await instance.put(`${BASE_URL}/info`, sanitize(profile));
    return data;
  },

  // 회원 탈퇴 (soft delete)
  async withdraw() {
    const { data } = await instance.delete(BASE_URL);
    return data;
  },
};
