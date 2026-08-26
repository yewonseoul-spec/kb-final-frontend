<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAccountBalances } from '@/api/balanceApi';

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

// 계좌 목록 - 예: [{ accountId, bankName, accountName, balance }, ...]
const accounts = ref([]);
const loading = ref(true);
const errorMessage = ref('');

async function loadAccounts() {
    loading.value = true;
    errorMessage.value = '';

    try {
        const res = await getAccountBalances();
        accounts.value = res.data;
    } catch (err) {
        console.error('계좌별 잔액 조회 실패:', err);
        errorMessage.value = '불러오지 못했어요.';
    } finally {
        loading.value = false;
    }
}

onMounted(loadAccounts);

function goBack() {
    router.back();
}

function formatWon(amount) {
    return `${(amount || 0).toLocaleString()}원`;
}

// 은행 이름 -> 로고 이미지 경로 매핑.
// 여기 없는 은행이면 로고 이미지 대신 은행 이름 첫 글자로 된 동그란 뱃지를 보여준다
const BANK_LOGOS = {
    '부산은행': bnkLogo,
    '경남은행': bnkLogo,
    '한국시티은행': citiLogo,
    '신협': cuLogo,
    '우체국': epostLogo,
    '하나은행': hanaLogo,
    'IBK기업은행': ibkLogo,
    'iM뱅크': imLogo,
    '전북은행': jbLogo,
    '제주은행': jejuLogo,
    '케이뱅크': kLogo,
    '카카오뱅크': kakaoLogo,
    'KB국민은행': kbLogo,
    'KDB산업은행': kdbLogo,
    '광주은행': kjLogo,
    '새마을금고': mgLogo,
    'NH농협은행': nhLogo,
    'SBI저축은행': sbiLogo,
    '신한은행': shinhanLogo,
    'SC제일은행': standardcharteredLogo,
    '수협은행': suhyupLogo,
    '토스뱅크': tossLogo,
    '우리은행': wooriLogo,
};

function getLogoPath(bankName) {
    return BANK_LOGOS[bankName] || null;
}

// 은행 이름의 첫 글자를 대체 뱃지에 쓴다 (예: 신한은행 -> 신)
function getBankInitial(bankName) {
    return bankName ? bankName.charAt(0) : '?';
}
</script>

<template>
    <div class="page">
        <div v-if="loading" class="empty-note">불러오는 중...</div>
        <div v-else-if="errorMessage" class="empty-note">{{ errorMessage }}</div>
        <div v-else-if="accounts.length === 0" class="empty-note">연결된 계좌가 없어요</div>

        <!-- 계좌 목록 -->
        <div v-else class="account-list">
            <div v-for="acc in accounts" :key="acc.accountId" class="account-card">
                <!-- 위쪽: 왼쪽에 계좌 정보, 오른쪽에 은행 로고 -->
                <div class="card-top">
                    <div class="account-info">
                        <p class="account-name">{{ acc.accountName }}</p>
                        <p class="bank-name">{{ acc.bankName }}</p>
                        <p class="account-no">{{ acc.accountNo }}</p>
                    </div>

                    <!-- 로고 이미지가 있으면 이미지를, 경로가 없거나 로드 실패하면 첫 글자 뱃지를 보여준다 -->
                    <img v-if="getLogoPath(acc.bankName)" :src="getLogoPath(acc.bankName)" :alt="acc.bankName"
                        class="bank-logo" />
                    <div v-else class="bank-logo-fallback">
                        {{ getBankInitial(acc.bankName) }}
                    </div>
                </div>

                <div class="balance-box">
                    <span class="balance-label">잔액</span>
                    <strong class="balance-amount">{{ formatWon(acc.balance) }}</strong>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
* {
    box-sizing: border-box;
}

.page {
    --brown: #6E4B3A;
    max-width: 480px;
    margin: 0 auto;
    padding: 16px;
    background: #FAF9F6;
    min-height: 100vh;
}

.header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 20px;
}

.back-btn {
    border: 0;
    background: none;
    font-size: 22px;
    color: #333;
    cursor: pointer;
    padding: 0;
}

.header h2 {
    font-size: 18px;
    font-weight: 700;
    color: #222;
    margin: 0;
}

.empty-note {
    text-align: center;
    color: #999;
    font-size: 14px;
    padding: 60px 0;
}

.account-list {
    display: flex;
    flex-direction: column;
    gap: 14px;
}

.account-card {
    background: #fff;
    border-radius: 16px;
    padding: 18px;
    box-shadow: 0 3px 12px rgba(0, 0, 0, .05);
}

/* 위쪽 영역: 왼쪽 텍스트와 오른쪽 로고를 각각 양 끝으로 배치 */
.card-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
}

.account-info {
    min-width: 0;
}

.bank-logo {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    object-fit: contain;
    flex-shrink: 0;
}

/* 로고 이미지가 없을 때 대신 보여주는 동그란 글자 뱃지 */
.bank-logo-fallback {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #F5F4F1;
    color: #999;
    font-size: 14px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
}

.account-name {
    font-size: 15px;
    font-weight: 700;
    color: #222;
    margin: 0 0 2px;
}

.bank-name {
    font-size: 12px;
    color: #999;
    margin: 0;
}

.account-no {
    font-size: 12px;
    color: #999;
    margin: 0 0 12px;
}

.balance-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #F5F4F1;
    border-radius: 10px;
    padding: 12px 14px;
}

.balance-label {
    font-size: 13px;
    color: #888;
}

.balance-amount {
    font-size: 16px;
    font-weight: 700;
    color: #222;
}
</style>