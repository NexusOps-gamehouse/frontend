import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

/**
 * 비로그인 상태에서 호출하는 경로들.
 * 여기서 401이 나도 로그인 페이지로 튕기면 안 된다.
 * (회원가입 도중 라이엇 조회가 401이면 입력값이 전부 날아간다)
 */
const PUBLIC_PATHS = [
  '/auth',
  '/users/find-email',
  '/users/reset-password',
];

const isPublicPath = (url = '') => PUBLIC_PATHS.some((p) => url.startsWith(p));

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && !isPublicPath(err.config?.url)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) => e.response?.data?.message || '요청에 실패했습니다.';

export default api;
