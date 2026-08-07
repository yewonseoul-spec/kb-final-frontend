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
      router.push({ name: 'Login', query: { error: 'login_required' } });
      return Promise.reject({ error: '로그인이 필요한 서비스입니다.' });
    }
    return Promise.reject(error);
  },
);

// 에러 응답 본문을 사용자 문구로 쓸지 판단한다.
// 4xx 는 ApiExceptionAdvice 가 만든 평문이라 그대로 보여도 되지만,
// 5xx 는 내부 오류 메시지이거나 스택 트레이스라 노출하면 안 된다.
// (백엔드가 꺼져 있으면 Vite 프록시가 500 + 스택을 본문으로 준다)
export const errorMessage = (e, fallback) => {
  const status = e.response?.status;
  const data = e.response?.data;
  const isUserMessage =
    status >= 400 && status < 500 && typeof data === 'string' && data;
  return isUserMessage ? data : fallback;
};

export default instance;
