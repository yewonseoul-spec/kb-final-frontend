import axios from 'axios'

// 프로젝트 공통 axios 인스턴스가 이미 있다면 (예: '@/utils/axios') 그걸 import해서 쓰세요.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true
})

/**
 * ASSET-01 : 총 자산 / 계좌별 잔액 / 가입 상품 만기일 조회
 * GET /api/asset/dashboard
 */
export const getAssetDashboard = () => {
  return api.get('/asset/dashboard')
}