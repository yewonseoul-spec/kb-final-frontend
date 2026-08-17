<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getHeldProducts } from '@/api/finproductsApi';

// 은행 로고 이미지
import bnkLogo from '@/assets/images/banks/bnk.png';
import citiLogo from '@/assets/images/banks/citi.png';
import cuLogo from '@/assets/images/banks/cu.png';
import epostLogo from '@/assets/images/banks/epost.png';
import hanaLogo from '@/assets/images/banks/hana.png';
import ibkLogo from '@/assets/images/banks/ibk.png';
import imLogo from '@/assets/images/banks/im.png';
import jbLogo from '@/assets/images/banks/jb.png';
import jejuLogo from '@/assets/images/banks/jeju.png';
import kLogo from '@/assets/images/banks/k.png';
import kakaoLogo from '@/assets/images/banks/kakao.png';
import kbLogo from '@/assets/images/banks/kb.png';
import kdbLogo from '@/assets/images/banks/kdb.png';
import kjLogo from '@/assets/images/banks/kj.png';
import mgLogo from '@/assets/images/banks/mg.png';
import nhLogo from '@/assets/images/banks/nh.png';
import sbiLogo from '@/assets/images/banks/sbi.png';
import shinhanLogo from '@/assets/images/banks/shinhan.png';
import standardcharteredLogo from '@/assets/images/banks/standardchartered.png';
import suhyupLogo from '@/assets/images/banks/suhyup.png';
import tossLogo from '@/assets/images/banks/toss.png';
import wooriLogo from '@/assets/images/banks/woori.png';

const router = useRouter();

const rawProducts = ref([]); // 카테고리별로 나누지 않은 원본 목록 
const loading = ref(true);
const errorMessage = ref('');

async function loadProducts() {
    loading.value = true;
    errorMessage.value = '';

    try {
        const res = await getHeldProducts();
        rawProducts.value = res.data;
    } catch (err) {
        console.error('금융 상품 조회 실패:', err);
        errorMessage.value = '불러오지 못했어요.';
    } finally {
        loading.value = false;
    }
}

onMounted(loadProducts);

function goBack() {
    router.back();
}

// 자산 연결하기 버튼 - DB에 있는 금융 상품 목록을 다시 읽어와서 화면 갱신
async function refreshAssets() {
    await loadProducts();
}

// 상품 종류(ENUM) - 화면에 보여줄 이름/아이콘 매핑
const CATEGORY_LIST = [
    { key: '예ㆍ적금', icon: '💰', types: ['DEPOSIT', 'SAVINGS'] },
    { key: '청약', icon: '🏠', types: ['SUBSCRIPTION'] },
    { key: '보험ㆍ공제', icon: '🛡️', types: ['INSURANCE'] },
    { key: '퇴직연금', icon: '😊', types: ['PENSION'] },
];

function toBadgeText(productType) {
    const map = {
        DEPOSIT: '예금',
        SAVINGS: '적금',
        SUBSCRIPTION: '청약',
        INSURANCE: '보험ㆍ공제',
        PENSION: '퇴직연금',
    };
    return map[productType] || productType;
}

// 원본 목록(rawProducts)을 화면에 보여줄 4개 카테고리 구조로 정리
const groupedCategories = computed(() => {
    return CATEGORY_LIST.map(category => {
        const products = rawProducts.value.filter(p => category.types.includes(p.productType));
        return {
            key: category.key,
            icon: category.icon,
            products,
        };
    });
});

function formatWon(amount) {
    return `${(amount || 0).toLocaleString()}원`;
}

// 날짜 문자열을 '2026.07.31 만기' 텍스트로 바꾼다
function formatDate(dateStr) {
    if (!dateStr) return '';
    return `${dateStr.replaceAll('-', '.')} 만기`;
}

// 은행 로고
const BANK_LOGOS = {
    'BNK부산은행': bnkLogo,
    '한국씨티은행': citiLogo,
    '신협': cuLogo,
    '우체국예금': epostLogo,
    '하나은행': hanaLogo,
    'IBK기업은행': ibkLogo,
    'iM뱅크': imLogo,
    '전북은행': jbLogo,
    '제주은행': jejuLogo,
    '케이뱅크': kLogo,
    '카카오뱅크': kakaoLogo,
    'KB국민은행': kbLogo,
    'KDB산업은행': kdbLogo,
    'BNK경남은행': kjLogo,
    '새마을금고': mgLogo,
    'NH농협은행': nhLogo,
    'SBI저축은행': sbiLogo,
    '신한은행': shinhanLogo,
    'SC제일은행': standardcharteredLogo,
    '수협은행': suhyupLogo,
    '토스뱅크': tossLogo,
    '우리은행': wooriLogo,
};

const failedLogos = ref(new Set());

function handleLogoError(orgName) {
    const updated = new Set(failedLogos.value);
    updated.add(orgName);
    failedLogos.value = updated;
}

function getLogoPath(orgName) {
    return BANK_LOGOS[orgName] || null;
}

function shouldShowLogo(orgName) {
    return !!getLogoPath(orgName) && !failedLogos.value.has(orgName);
}

function getBankInitial(orgName) {
    return orgName ? orgName.charAt(0) : '?';
}

// 가입한 상품이 없는 카테고리 -  KB의 관련 상품 페이지로 이동
const KB_PRODUCT_LINKS = {
    '예ㆍ적금': 'https://obank.kbstar.com/quics?page=C020702',
    '청약': 'https://oland.kbstar.com/quics?page=ohsubs',
    '보험ㆍ공제': 'https://obank.kbstar.com/quics?page=C020712',
    '퇴직연금': 'https://okbfex.kbstar.com/quics?page=opensn',
};

function goToProductPage(categoryKey) {
    const url = KB_PRODUCT_LINKS[categoryKey];
    if (url) {
        window.open(url, '_blank'); // 새 탭으로 열기
    }
}
</script>

<template>
    <div class="page">
        <!-- 자산 연결하기 버튼: DB에 있는 금융 상품 목록을 다시 읽어온다 -->
        <button class="refresh-btn" @click="refreshAssets" :disabled="loading">
            🔄 {{ loading ? '불러오는 중...' : ' 자산 연결하기' }}
        </button>

        <div v-if="loading" class="empty-note">불러오는 중...</div>
        <div v-else-if="errorMessage" class="empty-note">{{ errorMessage }}</div>

        <template v-else>
            <div v-for="category in groupedCategories" :key="category.key" class="category-section">
                <p class="section-title">{{ category.icon }} {{ category.key }} {{ category.products.length }}개</p>

                <!-- 가입한 상품이 있으면, 상품 카드들을 하나씩 보여준다 -->
                <template v-if="category.products.length > 0">
                    <div v-for="product in category.products" :key="product.productNo" class="product-card">
                        <div class="card-top">
                            <div class="card-left">
                                <p class="product-name">
                                    {{ product.productName }}
                                    <!-- 예ㆍ적금 카테고리는 예금/적금 구분이 필요하니 배지 표시, 나머지 카테고리는 배지 생략 -->
                                    <span v-if="category.key === '예ㆍ적금'" class="type-badge">
                                        {{ toBadgeText(product.productType) }}
                                    </span>
                                </p>
                            </div>

                            <img v-if="shouldShowLogo(product.orgName)" :src="getLogoPath(product.orgName)"
                                :alt="product.orgName" class="bank-logo" @error="handleLogoError(product.orgName)" />
                            <div v-else class="bank-logo-fallback">
                                {{ getBankInitial(product.orgName) }}
                            </div>
                        </div>

                        <!-- 보유 금액/연이율/만기일을 3칸짜리 grid로 나눠서 한 줄로 표시 -->
                        <div class="info-grid">
                            <p class="info-value">{{ formatWon(product.holdAmount) }}</p>
                            <p v-if="product.interestRate != null" class="info-value rate">연 {{ product.interestRate }}%
                            </p>
                            <p v-else class="info-value"></p>
                            <p v-if="product.maturityDate" class="info-value">{{ formatDate(product.maturityDate) }}</p>
                            <p v-else class="info-value"></p>
                        </div>
                    </div>
                </template>

                <!-- 가입한 상품이 없으면 안내 카드 표시 (누르면 KB 상품 페이지로 이동) -->
                <button v-else class="empty-product-card" @click="goToProductPage(category.key)">
                    <p class="empty-title">가입된 {{ category.key }} 상품이 없어요</p>
                    <span class="plus-btn">+</span>
                </button>
            </div>
        </template>
    </div>
</template>

<style scoped>
* {
    box-sizing: border-box;
}

.page {
    --brown: #60584C;
    max-width: 480px;
    margin: 0 auto;
    padding: 16px;
    background: #FAF9F6;
    min-height: 100vh;
}

.back-btn {
    border: 0;
    background: none;
    font-size: 22px;
    color: #333;
    cursor: pointer;
    padding: 0;
}

.menu-icon {
    font-size: 18px;
    color: #555;
}

.refresh-btn {
    width: 100%;
    padding: 14px;
    border: 0;
    border-radius: 12px;
    background: #FFCC00;
    color: var(--brown);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    margin-bottom: 20px;
}

.refresh-btn:disabled {
    opacity: .6;
    cursor: default;
}

.empty-note {
    text-align: center;
    color: #999;
    font-size: 14px;
    padding: 60px 0;
}

.category-section {
    margin-bottom: 20px;
}

.section-title {
    font-size: 14px;
    font-weight: 700;
    color: #333;
    margin: 0 0 10px;
}

.product-card {
    background: #fff;
    border-radius: 14px;
    padding: 14px;
    margin-bottom: 10px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .04);
}

.card-top {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
}

.card-left {
    min-width: 0;
}

.product-name {
    font-size: 14px;
    font-weight: 700;
    color: #222;
    margin: 0 0 2px;
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 6px;
}

.type-badge {
    font-size: 10px;
    font-weight: 700;
    color: #888;
    background: #F1EFEA;
    padding: 2px 6px;
    border-radius: 999px;
}

.bank-logo {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    object-fit: contain;
    flex-shrink: 0;
}

.bank-logo-fallback {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #F5F4F1;
    color: #999;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
}

.info-value {
    font-size: 12px;
    font-weight: 700;
    color: #222;
    margin: 0;
    text-align: center;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
}

.info-value.rate {
    color: #E0A020;
}

.empty-product-card {
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #fff;
    border: 0;
    border-radius: 14px;
    padding: 16px;
    cursor: pointer;
    text-align: left;
    box-shadow: 0 2px 8px rgba(0, 0, 0, .04);
    outline: none;
}

.empty-product-card:focus-visible {
    outline: 2px solid #FFCC00;
    outline-offset: 2px;
}

.empty-title {
    font-size: 13px;
    color: #999;
    margin: 0;
}

.plus-btn {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: #FFCC00;
    color: var(--brown);
    font-size: 18px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}
</style>