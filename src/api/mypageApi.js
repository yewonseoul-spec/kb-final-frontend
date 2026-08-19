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

// 생년월일: 달력을 직접 입력으로 바꾸면서 브라우저가 막아 주던 것을 전부 여기서 막는다.
// 나이가 추천 엔진의 자격 판정(TIMESTAMPDIFF)에 그대로 들어가 느슨하면 결과가 통째로 달라진다.
const BIRTH_FORMAT = /^\d{4}-\d{2}-\d{2}$/;
const MIN_AGE = 14; // 만 14세 미만은 법정대리인 동의가 필요해 대상이 아니다
const MAX_AGE = 120;

const birthDateError = (value) => {
  if (!value) return ''; // 전 항목 선택 입력이라 미입력은 정상이다
  if (!BIRTH_FORMAT.test(value)) return '생년월일 8자리를 입력해 주세요.';

  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // 2월 30일 같은 값을 Date 는 조용히 3월로 넘긴다. 되돌려 비교해야 걸린다.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return '없는 날짜예요.';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (date > today) return '미래 날짜는 입력할 수 없어요.';

  // 올해 생일이 지났는지까지 따져야 만 나이가 된다
  let age = today.getFullYear() - year;
  const hadBirthday =
    today.getMonth() > month - 1 ||
    (today.getMonth() === month - 1 && today.getDate() >= day);
  if (!hadBirthday) age -= 1;

  if (age < MIN_AGE) return `만 ${MIN_AGE}세 이상만 입력할 수 있어요.`;
  if (age > MAX_AGE) return '생년월일을 다시 확인해 주세요.';
  return '';
};

// 서버·DB 제약과 1:1로 대응하는 검증.
export const validateProfile = (profile) => {
  const errors = {};

  const birthError = birthDateError(profile.birthDate);
  if (birthError) errors.birthDate = birthError;

  if (profile.income !== '' && Number(profile.income) < 0) {
    errors.income = '0 이상으로 입력해 주세요.';
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

  // 신청 혜택 등록 — 이미 담겨 있으면 409. 관심 혜택과 달리 멱등이 아니다
  async createAppliedBenefit(benefitNo) {
    const { data } = await instance.post(`${BASE_URL}/applied`, { benefitNo });
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

  // 관심 혜택 등록 — 이미 담겨 있어도 200(멱등)이라 호출부가 중복을 신경 쓸 필요 없다
  async createFavoriteBenefit(benefitNo) {
    const { data } = await instance.post(`${BASE_URL}/favorite`, { benefitNo });
    return data;
  },

  // 관심 혜택 목록 — 없으면 빈 배열(404 아님)
  async getFavoriteBenefits() {
    const { data } = await instance.get(`${BASE_URL}/favorite`);
    return data;
  },

  // 관심 혜택 해제 — 이미 없으면 404. 목록이 낡았다는 뜻이므로 재조회할 것
  async deleteFavoriteBenefit(benefitNo) {
    const { data } = await instance.delete(`${BASE_URL}/favorite/${benefitNo}`);
    return data;
  },
};
