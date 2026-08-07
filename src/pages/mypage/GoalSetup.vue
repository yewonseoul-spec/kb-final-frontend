<script setup>
import { onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import KbButton from '@/components/common/KbButton.vue';
import OnboardingHeader from '@/components/mypage/OnboardingHeader.vue';
import GoalSelect from '@/components/mypage/GoalSelect.vue';
import mypageApi from '@/api/mypageApi';
import { errorMessage } from '@/api';

const router = useRouter();

const goalType = ref('');
const hasGoal = ref(false); // 저장 때 POST 와 PUT 을 가른다
const isLoading = ref(true);
const isSaving = ref(false);
const submitError = ref('');

onMounted(async () => {
  try {
    goalType.value = (await mypageApi.getGoal()).goalType;
    hasGoal.value = true;
  } catch (e) {
    // 404 는 오류가 아니라 '목표 미설정' 이므로 정상 흐름이다.
    if (e.response?.status !== 404) {
      submitError.value =
        '목표 정보를 확인하지 못했어요. 저장이 안 되면 잠시 후 다시 시도해 주세요.';
    }
  }
  isLoading.value = false;
});

const onSubmit = async () => {
  submitError.value = '';
  isSaving.value = true;
  try {
    if (!goalType.value) {
      await mypageApi.deleteGoal();
    } else if (hasGoal.value) {
      await mypageApi.updateGoal(goalType.value);
    } else {
      await mypageApi.createGoal(goalType.value);
    }
    // 목적지가 지연 로딩이라 isSaving 을 끄지 않는다(끄면 화면이 깜빡였다 사라진다)
    router.replace({ name: 'MyPage' });
  } catch (e) {
    // 401 은 api/index.js 인터셉터가 로그인 페이지로 보낸다(그 경우 e.response 가 없다)
    submitError.value = errorMessage(
      e,
      '저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
    );
    isSaving.value = false;
  }
};

// 건너뛰기는 '아무것도 바꾸지 않는다' 이므로 기존 목표를 지우지 않는다
const onSkip = () => {
  router.replace({ name: 'MyPage' });
};
</script>

<template>
  <!-- 목표 유무를 확인하기 전에 카드를 그리면 선택 표시가 뒤늦게 켜진다 -->
  <div v-if="!isLoading" class="goal-setup">
    <OnboardingHeader
      title="목표 설정"
      :step="3"
      :steps="3"
      step-name="목표"
      @skip="onSkip"
    />

    <div>
      <h2 class="guide-title">올해 이루고 싶은<br />목표를 골라주세요</h2>
      <p class="guide-sub">
        목표에 맞춰 해야 할 일과 혜택을 정리해 드려요.<br />
        나중에 언제든 바꿀 수 있어요.
      </p>
    </div>

    <GoalSelect v-model="goalType" />

    <p v-if="submitError" class="submit-error">{{ submitError }}</p>

    <p class="skip-guide">
      목표를 정하지 않아도 시작할 수 있어요.<br />
      마이페이지에서 언제든 설정할 수 있어요.
    </p>

    <!-- KbButton 은 inline-flex 라서 grid 아이템으로 두어 폭을 꽉 채운다 -->
    <div class="submit-row">
      <KbButton type="primary" :disabled="isSaving" @click="onSubmit">
        {{ isSaving ? '저장 중…' : '시작하기' }}
      </KbButton>
    </div>
  </div>
</template>

<style scoped>
.goal-setup {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-title {
  margin: 0 0 10px;
  font-size: 22px;
  font-weight: 700;
  color: #2e2a24;
  word-break: keep-all;
}

.guide-sub {
  margin: 0;
  font-size: 14px;
  color: #908980;
  word-break: keep-all;
}

.submit-error {
  margin: 0;
  font-size: 13px;
  color: #d64545;
  word-break: keep-all;
}

.skip-guide {
  margin: 0;
  font-size: 13px;
  color: #908980;
  text-align: center;
  word-break: keep-all;
}

.submit-row {
  display: grid;
}
</style>
