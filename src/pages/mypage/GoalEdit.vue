<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import KbButton from '@/components/common/KbButton.vue';
import GoalSelect from '@/components/mypage/GoalSelect.vue';
import mypageApi from '@/api/mypageApi';

const router = useRouter();

const goalType = ref('');
const hasGoal = ref(false); // 저장 때 POST 와 PUT 을 가른다
const isLoading = ref(true);
const isSaving = ref(false);
const message = ref('');
const isError = ref(false);

onMounted(async () => {
  try {
    goalType.value = (await mypageApi.getGoal()).goalType;
    hasGoal.value = true;
  } catch (e) {
    // 404 는 오류가 아니라 '목표 미설정' 이다.
    // 온보딩에서 건너뛴 사람은 '나중에 정할래요' 가 선택된 채로 뜬다.
    if (e.response?.status !== 404) {
      isError.value = true;
      message.value = '목표를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
  } finally {
    isLoading.value = false;
  }
});

const onSave = async () => {
  message.value = '';
  isError.value = false;
  isSaving.value = true;
  try {
    if (!goalType.value) {
      await mypageApi.deleteGoal();
      hasGoal.value = false;
    } else if (hasGoal.value) {
      await mypageApi.updateGoal(goalType.value);
    } else {
      await mypageApi.createGoal(goalType.value);
      hasGoal.value = true;
    }
    message.value = '저장했어요.';
  } catch (e) {
    // 401 은 api/index.js 인터셉터가 처리한다(그 경우 e.response 가 없다)
    isError.value = true;
    message.value =
      e.response?.data || '저장에 실패했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    isSaving.value = false;
  }
};

// 취소는 들어온 화면으로 돌아간다. 다만 주소창 직접 진입이나 새로고침 직후에는
// 히스토리가 없어 back() 이 앱 밖으로 나가므로, 그때는 /mypage 로 보낸다.
const onCancel = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  router.push({ name: 'MyPage' });
};
</script>

<template>
  <div v-if="!isLoading" class="goal-edit">
    <p class="guide">
      목표에 맞춰 해야 할 일과 혜택을 정리해 드려요.<br />
      바꾸면 맞춤 추천에 바로 반영돼요.
    </p>

    <GoalSelect v-model="goalType" />

    <p v-if="message" :class="['message', { error: isError }]">
      {{ message }}
    </p>

    <div class="button-row two">
      <KbButton type="secondary" :disabled="isSaving" @click="onCancel">
        취소
      </KbButton>
      <KbButton type="primary" :disabled="isSaving" @click="onSave">
        {{ isSaving ? '저장 중…' : '저장' }}
      </KbButton>
    </div>
  </div>
</template>

<style scoped>
/* 탭바가 position:fixed 라 여백이 없으면 저장 버튼을 덮는다 */
.goal-edit {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding-bottom: 96px;
}

.guide {
  margin: 0;
  font-size: 13px;
  color: #908980;
  word-break: keep-all;
}

.message {
  margin: 0;
  font-size: 13px;
  color: #43a047;
  word-break: keep-all;
}

.message.error {
  color: #d64545;
}

.button-row {
  display: grid;
  gap: 12px;
}

.button-row.two {
  grid-template-columns: 1fr 1fr;
}
</style>
