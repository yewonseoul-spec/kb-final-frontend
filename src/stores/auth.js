import { ref, computed, reactive } from 'vue';
import { defineStore } from 'pinia';
import axios from 'axios';

const initState = {
  token: '', // 접근 토큰(JWT)
  user: {
    loginId: '', // 사용자 ID
    email: '', // Email
    realName: '',
    roles: [], // 권한 목록
  },
};

// JWT는 'header.payload.signature' 세 조각이고, payload는 JSON을 base64url로 인코딩한 것.
// 가운데 조각을 풀어서 만료 시각(exp)을 꺼낸다. 형식이 깨졌으면 null.
const getTokenExpiry = (token) => {
  try {
    // base64url은 표준 Base64의 '+', '/' 자리에 '-', '_'를 쓴다. atob이 읽도록 되돌린다
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64)); // atob = Base64 문자열 → 원래 문자열
    return payload.exp ? payload.exp * 1000 : null; // exp는 초 단위, JS는 밀리초
  } catch {
    return null;
  }
};

export const useAuthStore = defineStore('auth', () => {
  const state = ref({ ...initState });

  const isLogin = computed(() => !!state.value.user.loginId); // 로그인 여부

  const loginId = computed(() => state.value.user.loginId); // 로그인 사용자 ID

  const email = computed(() => state.value.user.email); // 로그인 사용자 email

  const realName = computed(() => state.value.user.realName); // 로그인 사용자 닉네임

  const login = async (member) => {
    const { data } = await axios.post('/api/auth/login', member);
    state.value = { ...data };
    localStorage.setItem('auth', JSON.stringify(state.value));
  };

  const logout = () => {
    localStorage.removeItem('auth');
    state.value = { ...initState };
  };

  const getToken = () => state.value.token;

  const changeProfile = (member) => {
    state.value.user.email = member.email;
    localStorage.setItem('auth', JSON.stringify(state.value));
  };

  const load = () => {
    const auth = localStorage.getItem('auth');
    if (auth == null) return;

    const saved = JSON.parse(auth);
    const expiry = getTokenExpiry(saved.token);

    // 만료됐거나 해석 불가능한 토큰이면 저장된 로그인 정보를 버린다
    if (expiry == null || expiry <= Date.now()) {
      localStorage.removeItem('auth');
      return;
    }

    state.value = saved;
  };

  load();

  return {
    state,
    loginId,
    email,
    realName,
    isLogin,
    changeProfile,
    login,
    logout,
    getToken,
  };
});
