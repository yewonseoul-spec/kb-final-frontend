import axios from 'axios';
import instance from '@/api';

const BASE_URL = '/api/auth';

export default {
  // 아이디 중복확인 — true 면 중복
  async checkId(loginId) {
    const { data } = await axios.get(`${BASE_URL}/check-id`, {
      params: { loginId },
    });
    return data;
  },

  // 이메일 중복확인 — true 면 중복
  async checkEmail(email) {
    const { data } = await axios.get(`${BASE_URL}/check-email`, {
      params: { email },
    });
    return data;
  },

  // 회원가입
  async signup(member) {
    const { data } = await axios.post(`${BASE_URL}/signup`, member);
    return data;
  },

  // 아이디 찾기 — 비로그인 API 라 instance(401 인터셉터)를 쓰지 않는다
  async findId(email) {
    const { data } = await axios.post(`${BASE_URL}/find-id`, { email });
    return data;
  },

  // 비밀번호 재설정 본인확인
  async verifyResetPassword(loginId, email) {
    await axios.post(`${BASE_URL}/reset-password-verify`, { loginId, email });
  },

  // 비밀번호 재설정 — 서버가 아이디+이메일을 다시 확인하므로 그대로 함께 보낸다
  async resetPassword(loginId, email, newPassword) {
    await axios.post(`${BASE_URL}/reset-password`, {
      loginId,
      email,
      newPassword,
    });
  },

  // 로그아웃 - 인증이 필요하므로 instance(토큰 자동 첨부) 사용
  async logout() {
    const { data } = await instance.post(`${BASE_URL}/logout`);
    return data;
  },

  // 토큰 재발급 — instance 를 쓰면 인터셉터가 자기 자신을 다시 부른다
  async refresh(refreshToken) {
    const { data } = await axios.post(`${BASE_URL}/refresh`, {
      refreshToken,
    });
    return data;
  },
};
