import axios from 'axios';
import { useAuthStore } from '@/stores/auth';
import router from '@/router';
import authApi from '@/api/authApi';

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

// 재발급이 진행 중이면 그 Promise 를 공유한다. 동시에 401 을 받은 요청들이 각자 재발급하지 않도록
let refreshing = null;

// 세 갈래에서 같은 처리를 하므로 묶어 둔다
const forceLogin = (message) => {
  const { logout } = useAuthStore();
  logout();
  router.push({ name: 'Login', query: { error: 'login_required' } });
  return Promise.reject({ error: message });
};

// 응답 인터셉터 — 401 이면 리프레시 토큰으로 한 번 재발급해 재시도하고, 그래도 안 되면 로그아웃
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error.response?.status;
    const original = error.config;

    if (status !== 401) {
      return Promise.reject(error);
    }

    // 이미 재시도한 요청이면 더 시도하지 않는다
    if (original?._retried) {
      return forceLogin('로그인이 필요한 서비스입니다.');
    }

    const auth = useAuthStore();
    const refreshToken = auth.getRefreshToken();

    if (!refreshToken) {
      return forceLogin('로그인이 필요한 서비스입니다.');
    }

    try {
      if (!refreshing) {
        refreshing = authApi.refresh(refreshToken).finally(() => {
          refreshing = null;
        });
      }
      const data = await refreshing;

      auth.setToken(data.token);

      original._retried = true;
      original.headers['Authorization'] = `Bearer ${data.token}`;
      return instance(original);
    } catch (e) {
      return forceLogin('다시 로그인해 주세요.');
    }
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
