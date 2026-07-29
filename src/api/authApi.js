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

  // 로그아웃 - 인증이 필요하므로 instance(토큰 자동 첨부) 사용
  async logout() {
    const { data } = await instance.post(`${BASE_URL}/logout`);
    return data;
  },
};
