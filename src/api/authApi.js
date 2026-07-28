import axios from 'axios';

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
};
