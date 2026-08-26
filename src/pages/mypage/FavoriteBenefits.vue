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

// 해제 확인 대상. null 이면 모달을 닫는다 (RQ-FAV-11 은 확인 절차를 필수로 요구)
const target = ref(null);
const isDeleting = ref(false);
const deleteError = ref('');

const load = async () => {
  try {
    list.value = await mypageApi.getFavoriteBenefits();
  } catch (e) {
    // 401 은 인터셉터가 로그인 화면으로 보내는 중이라 문구를 띄우지 않는다.
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
    await mypageApi.deleteFavoriteBenefit(target.value.benefitNo);
    target.value = null;
    await load();
  } catch (e) {
    // 404 는 오류가 아니라 목록이 낡았다는 뜻. 조용히 새로 불러온다.
    if (e.response?.status === 404) {
      target.value = null;
      await load();
    } else if (e.response) {
      deleteError.value = '해제하지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
  } finally {
    isDeleting.value = false;
  }
};
</script>

<template>
  <div class="favorite-benefits">
    <p v-if="message" class="message">{{ message }}</p>

    <template v-if="!isLoading">
      <template v-if="list.length">
        <div class="list-header">
          <p class="list-count">저장한 혜택 {{ list.length }}건</p>

          <KbButton
            type="secondary"
            size="small"
            @click="router.push({ name: 'BenefitSearch' })"
          >
            추가
          </KbButton>
        </div>

        <section class="benefit-list" aria-label="관심 혜택 목록">
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
                class="heart-btn"
                aria-label="관심 혜택 해제"
                @click="target = benefit"
              >
                ♥
              </button>
            </template>
          </BenefitCard>
        </section>

        <p class="list-hint">하트를 누르면 관심 목록에서 해제됩니다.</p>
      </template>

      <!-- 저장한 관심 혜택이 없으면 안내 문구 (RQ-FAV-08) -->
      <div v-else class="empty">
        <p class="empty-main">아직 저장한 혜택이 없어요</p>
        <p class="empty-sub">
          마음에 드는 혜택에 하트를 누르면<br />
          여기에 모아서 보여드려요.
        </p>
        <div class="empty-action">
          <KbButton @click="router.push({ name: 'BenefitSearch' })">
            청년혜택 보러 가기
          </KbButton>
        </div>
      </div>
    </template>

    <KbModal v-if="target" title="관심 혜택 해제" :columns="2">
      <p class="modal-desc">
        '{{ target.plcyNm }}' 을(를)<br />
        관심 목록에서 해제할까요?
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
          {{ isDeleting ? '해제 중…' : '해제' }}
        </KbButton>
      </template>
    </KbModal>
  </div>
</template>

<style scoped>
/* 탭바가 position:fixed 라 여백이 없으면 마지막 항목을 덮는다 */
.favorite-benefits {
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

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
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

.heart-btn {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 4px;
  font-size: 20px;
  line-height: 1;
  color: #d64545;
  cursor: pointer;
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

.list-hint {
  margin: 0;
  font-size: 12.5px;
  color: #908980;
  word-break: keep-all;
}

.empty-action {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
