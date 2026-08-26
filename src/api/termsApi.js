import axios from 'axios';

const BASE_URL = '/api/terms';

export default {
  // 회원가입 약관 목록 (백엔드가 terms_type='SIGNUP' 만 반환)
  async getSignupTerms() {
    const { data } = await axios.get(BASE_URL);
    return data;
  },
};
