import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';

const instance = axios.create({
  timeout: 10000,
});

// 요청 인터셉터 — JWT 토큰을 Authorization 헤더에 자동으로 붙인다
instance.interceptors.request.use((config) => {
  const { getToken } = useAuthStore();
  const token = getToken();
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// 응답 인터셉터 — 401이면 토큰이 만료·위조된 것이므로 로그아웃 후 로그인 페이지로
instance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { logout } = useAuthStore();
      logout();
      router.push('/login?error=login_required');
      return Promise.reject({ error: '로그인이 필요한 서비스입니다.' });
    }
    return Promise.reject(error);
  },
);

export default instance;
