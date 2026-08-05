<script setup>
import { onMounted, ref } from 'vue';
import KbButton from '@/components/common/KbButton.vue';
import BenefitListItem from '@/components/mypage/BenefitListItem.vue';
import mypageApi from '@/api/mypageApi';

const list = ref([]);
const isLoading = ref(true);
const message = ref('');

// 삭제 확인 대상. null 이면 모달을 닫는다 (RQ-FAV-20 은 확인 절차를 필수로 요구)
const target = ref(null);
const isDeleting = ref(false);
const deleteError = ref('');

const load = async () => {
  try {
    list.value = await mypageApi.getAppliedBenefits();
  } catch (e) {
    // 401 은 인터셉터가 로그인 화면으로 보내는 중이라 문구를 띄우지 않는다.
    // 그때는 e.response 가 없다.
    if (e.response) {
      message.value = '목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
  } finally {
    isLoading.value = false;
  }
};

onMounted(load);

const onDelete = async () => {
  isDeleting.value = true;
  deleteError.value = '';

  try {
    await mypageApi.deleteAppliedBenefit(target.value.benefitNo);
    target.value = null;
    await load();
  } catch (e) {
    // 404 는 오류가 아니라 목록이 낡았다는 뜻. 조용히 새로 불러온다.
    if (e.response?.status === 404) {
      target.value = null;
      await load();
    } else if (e.response) {
      deleteError.value = '삭제하지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="applied-benefits">
    <h1 class="page-title">신청 혜택</h1>

    <p v-if="message" class="message">{{ message }}</p>

    <template v-if="!isLoading">
      <ul v-if="list.length" class="benefit-list">
        <BenefitListItem
          v-for="benefit in list"
          :key="benefit.benefitNo"
          :plcy-nm="benefit.plcyNm"
          :category-name="benefit.categoryName"
          :meta-text="`${benefit.appliedAt.slice(0, 10)} 신청`"
        >
          <template #action>
            <button
              type="button"
              class="delete-btn"
              aria-label="신청 혜택 삭제"
              @click="target = benefit"
            >
              삭제
            </button>
          </template>
        </BenefitListItem>
      </ul>

      <!-- 등록한 신청 혜택이 없으면 안내 문구 -->
      <div v-else class="empty">
        <p class="empty-main">아직 신청한 혜택이 없어요.</p>
        <p class="empty-sub">혜택을 신청하면 여기에서 관리할 수 있어요.</p>
      </div>
    </template>

    <div v-if="target" class="modal-overlay">
      <div class="modal-card">
        <h4 class="modal-title">신청 혜택 삭제</h4>
        <p class="modal-desc">
          '{{ target.plcyNm }}' 을(를)<br />
          신청 목록에서 삭제할까요?
        </p>
        <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
        <div class="modal-actions two">
          <KbButton
            type="secondary"
            :disabled="isDeleting"
            @click="target = null"
          >
            취소
          </KbButton>
          <KbButton type="danger" :disabled="isDeleting" @click="onDelete">
            {{ isDeleting ? '삭제 중…' : '삭제' }}
          </KbButton>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* 탭바가 position:fixed 라 여백이 없으면 마지막 항목을 덮는다 */
.applied-benefits {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 96px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #2e2a24;
}

.message {
  margin: 0;
  font-size: 13px;
  color: #908980;
  word-break: keep-all;
}

.benefit-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.delete-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  font-size: 13px;
  font-weight: 600;
  color: #908980;
  cursor: pointer;
}

.empty {
  padding: 40px 0;
  text-align: center;
}

.empty-main {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2e2a24;
}

.empty-sub {
  margin: 0;
  font-size: 13px;
  color: #908980;
  word-break: keep-all;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-card {
  width: 90%;
  max-width: 300px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.modal-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #2e2a24;
}

.modal-desc {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #908980;
  word-break: keep-all;
  overflow-wrap: anywhere; /* 정책명이 TEXT 컬럼이라 길이 상한이 없다 */
}

.modal-error {
  margin: 0 0 12px;
  font-size: 13px;
  color: #d64545;
}

/* KbButton 이 inline-flex 라 grid 아이템으로 두어 폭을 채운다 */
.modal-actions {
  display: grid;
  width: 100%;
  gap: 10px;
}

.modal-actions.two {
  grid-template-columns: 1fr 1fr;
}
</style>
