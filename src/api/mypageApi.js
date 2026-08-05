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

// 서버·DB 제약과 1:1로 대응하는 검증.
export const validateProfile = (profile) => {
  const errors = {};
  const today = new Date().toISOString().slice(0, 10);

  if (profile.birthDate && profile.birthDate > today) {
    errors.birthDate = '미래 날짜는 선택할 수 없어요.';
  }
  if (profile.income !== '' && Number(profile.income) < 0) {
    errors.income = '0 이상으로 입력해 주세요.';
  }
  // member_profile 에 CHECK (household_size >= 1) 가 있어 0 을 보내면 400 이 난다.
  if (profile.householdSize !== '' && Number(profile.householdSize) < 1) {
    errors.householdSize = '본인을 포함해 1명 이상이어야 해요.';
  }

  return errors;
};

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

  // 목표 조회 — 404 는 오류가 아니라 '미설정' 이므로 호출부에서 분기할 것
  async getGoal() {
    const { data } = await instance.get(`${BASE_URL}/goal`);
    return data;
  },

  // 목표 최초 저장 — 이미 있으면 409
  async createGoal(goalType) {
    const { data } = await instance.post(`${BASE_URL}/goal`, { goalType });
    return data;
  },

  // 목표 변경 — 목표가 없으면 404
  async updateGoal(goalType) {
    const { data } = await instance.put(`${BASE_URL}/goal`, { goalType });
    return data;
  },

  // 목표 해제 — 이미 없어도 200(멱등)이라 호출부가 조건을 볼 필요 없다
  async deleteGoal() {
    const { data } = await instance.delete(`${BASE_URL}/goal`);
    return data;
  },

  // 비밀번호 변경 — 현재 비밀번호가 틀리면 400
  // loginId 는 보내지 않는다. 서버가 토큰에서 채운다.
  async changePassword(oldPassword, newPassword) {
    const { data } = await instance.patch(`${BASE_URL}/password`, {
      oldPassword,
      newPassword,
    });
    return data;
  },

  // 신청 혜택 목록 — 없으면 빈 배열(404 아님)
  async getAppliedBenefits() {
    const { data } = await instance.get(`${BASE_URL}/applied`);
    return data;
  },

  // 신청 혜택 삭제 — 이미 없으면 404. 목록이 낡았다는 뜻이므로 재조회할 것
  async deleteAppliedBenefit(benefitNo) {
    const { data } = await instance.delete(`${BASE_URL}/applied/${benefitNo}`);
    return data;
  },
};
