import api from '@/api/index'

export const getAssetDashboard = () => {
  return api.get('/api/asset/dashboard')
}