<script setup>
import { reactive, ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getAssetDashboard } from '@/api/assetApi'

const router = useRouter()
const loading = ref(true)

const dashboard = reactive({
  totalAsset: 0,
  accounts: [],
  maturities: []
})

const formatWon = (value) => {
  if (value === null || value === undefined) return '0원'
  return Number(value).toLocaleString('ko-KR') + '원'
}

const fetchDashboard = async () => {
  // loading.value = true
  try {
    const { data } = await getAssetDashboard()
    dashboard.totalAsset = data.totalAsset
    dashboard.accounts = data.accounts
    dashboard.maturities = data.maturities
  } catch (e) {
    console.error('자산 대시보드 조회 실패', e)
  } finally {
    loading.value = false
  }
}

// 보유 계좌는 3개까지만 보여준다
const visibleAccounts = computed(() => dashboard.accounts.slice(0, 3))

const goProducts = () => router.push('/asset/products')
const goRatio = () => router.push('/asset/ratio')
const goAllAccounts = () => router.push('/asset/balance')

onMounted(fetchDashboard)
</script>

<template>
  <div class="asset-dashboard">
    <!-- 총 자산 카드 -->
    <section class="total-card">
      <p class="label">총 자산</p>
      <p class="amount">{{ formatWon(dashboard.totalAsset) }}</p>
      <div class="btn-row">
        <button class="btn btn-primary" @click="goProducts">금융 상품 조회</button>
        <button class="btn btn-secondary" @click="goRatio">자산 비율 분석</button>
      </div>
    </section>

    <!-- 계좌별 잔액 -->
    <section class="list-section">
      <div class="section-header">
        <h2>계좌별 잔액</h2>
        <button class="link-btn" @click="goAllAccounts">전체보기 &rsaquo;</button>
      </div>

      <div v-if="loading" class="empty">불러오는 중...</div>
      <div v-else-if="dashboard.accounts.length === 0" class="empty">등록된 계좌가 없습니다.</div>
      <ul v-else class="account-list">
        <li v-for="acc in visibleAccounts" :key="acc.accountId" class="account-item">
          <div class="account-card">
            <p class="bank-name">{{ acc.bankName }}</p>
            <p class="account-no">{{ acc.accountNo }}</p>
          </div>
          <p class="balance">{{ formatWon(acc.balance) }}</p>
        </li>
      </ul>
    </section>

    <!-- 만기일 조회 -->
    <section class="list-section">
      <div class="section-header">
        <h2>만기일 조회</h2>
      </div>

      <div v-if="loading" class="empty">불러오는 중...</div>
      <div v-else-if="dashboard.maturities.length === 0" class="empty">가입 상품이 없습니다.</div>
      <ul v-else class="maturity-list">
        <li v-for="item in dashboard.maturities" :key="item.linkNo" class="maturity-item">
          <span class="dot">•</span>
          <span class="product-name">{{ item.productName }}</span>
          <span class="maturity-date">{{ item.maturityDate }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.asset-dashboard {
  max-width: 480px;
  margin: 0 auto;
  padding: 20px 16px 40px;
  background: #f7f7f8;
  min-height: 100vh;
  box-sizing: border-box;
}

.total-card {
  background: linear-gradient(135deg, #4a4340 0%, #2b2725 100%);
  border-radius: 16px;
  padding: 24px 20px;
  color: #fff;
  margin-bottom: 20px;
}

.total-card .label {
  font-size: 14px;
  opacity: 0.8;
  margin: 0 0 8px;
}

.total-card .amount {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 20px;
}

.btn-row {
  display: flex;
  gap: 8px;
}

.btn {
  flex: 1;
  padding: 12px 0;
  border-radius: 10px;
  border: none;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.btn-primary {
  background: #f4c15c;
  color: #2b2725;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}

.list-section {
  background: #fff;
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.section-header h2 {
  font-size: 16px;
  font-weight: 700;
  margin: 0;
}

.link-btn {
  background: none;
  border: none;
  color: #999;
  font-size: 13px;
  cursor: pointer;
}

.account-list,
.maturity-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.account-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.account-item:last-child {
  border-bottom: none;
}

.bank-name {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 4px;
}

.account-no {
  font-size: 13px;
  color: #999;
  margin: 0;
}

.balance {
  font-size: 15px;
  font-weight: 700;
}

.maturity-item {
  display: flex;
  align-items: center;
  padding: 10px 0;
  font-size: 14px;
}

.maturity-item .dot {
  color: #f4c15c;
  margin-right: 8px;
}

.product-name {
  flex: 1;
}

.maturity-date {
  color: #666;
}

.empty {
  padding: 20px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}
</style>