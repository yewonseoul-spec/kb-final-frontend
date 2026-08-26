<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import KbButton from '@/components/common/KbButton.vue';
import BenefitCard from '@/components/benefit/BenefitCard.vue';
import mypageApi from '@/api/mypageApi';
import KbModal from '@/components/common/KbModal.vue';

const router = useRouter();
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

const moveToDetail = (benefitNo) => {
  router.push({ name: 'benefit-detail', params: { benefitNo } });
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
    <p v-if="message" class="message">{{ message }}</p>

    <template v-if="!isLoading">
      <template v-if="list.length">
        <div class="list-header">
          <p class="list-count">신청한 혜택 {{ list.length }}건</p>

          <KbButton
            type="secondary"
            size="small"
            @click="router.push({ name: 'BenefitSearch' })"
          >
            추가
          </KbButton>
        </div>

        <section class="benefit-list" aria-label="신청 혜택 목록">
          <BenefitCard
            v-for="benefit in list"
            :key="benefit.benefitNo"
            :benefit="benefit"
            role="button"
            tabindex="0"
            @click="moveToDetail(benefit.benefitNo)"
            @keydown.enter="moveToDetail(benefit.benefitNo)"
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
          </BenefitCard>
        </section>
      </template>

      <!-- 등록한 신청 혜택이 없으면 안내 문구 -->
      <div v-else class="empty">
        <p class="empty-main">아직 신청한 혜택이 없어요.</p>
        <p class="empty-sub">혜택을 신청하면 여기에서 관리할 수 있어요.</p>
        <div class="empty-action">
          <KbButton @click="router.push({ name: 'BenefitSearch' })">
            청년혜택 보러 가기
          </KbButton>
        </div>
      </div>
    </template>

    <KbModal v-if="target" title="신청 혜택 삭제" :columns="2">
      <p class="modal-desc">
        '{{ target.plcyNm }}' 을(를)<br />
        신청 목록에서 삭제할까요?
      </p>
      <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
      <template #actions>
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
      </template>
    </KbModal>
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

.message {
  margin: 0;
  font-size: 13px;
  color: #908980;
  word-break: keep-all;
}

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.list-count {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #908980;
}

.benefit-list {
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

.empty-action {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
