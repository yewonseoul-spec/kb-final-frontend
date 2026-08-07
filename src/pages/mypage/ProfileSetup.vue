<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import mypageApi, { validateProfile } from '@/api/mypageApi';
import KbButton from '@/components/common/KbButton.vue';
import KbCard from '@/components/common/KbCard.vue';
import ProfileForm from '@/components/mypage/ProfileForm.vue';
import OnboardingHeader from '@/components/mypage/OnboardingHeader.vue';
import { errorMessage } from '@/api';

const router = useRouter();

// input/select 는 미입력을 '' 로 만든다. null 변환은 전송 직전 mypageApi 의 sanitize 가 맡는다.
const form = reactive({
  birthDate: '',
  regionCode: '',
  income: '',
  employStatus: '',
  major: '',
  householdSize: '',
  education: '',
  mrgSttsCd: '',
});

const errors = reactive({});
const submitError = ref('');
const isLoading = ref(true);
const isSaving = ref(false);

// 이미 프로필이 있는 회원이 이 화면에 들어오면 POST 가 409 가 된다.
// 진입할 때 조회해서 미리 걸러낸다. 404 는 오류가 아니라 '미입력' 이므로 정상 흐름이다.
onMounted(async () => {
  try {
    await mypageApi.getProfile();
    // 입력을 이미 끝낸 회원 → 온보딩이 필요 없다.
    // 목적지가 지연 로딩이라 이동이 즉시 끝나지 않는다.
    // isLoading 을 켜 둔 채로 넘겨야 그 사이에 폼이 깜빡이지 않는다.
    router.replace({ name: 'MyPage' });
    return;
  } catch (e) {
    if (e.response?.status !== 404) {
      submitError.value =
        '프로필 정보를 확인하지 못했어요. 저장이 안 되면 잠시 후 다시 시도해 주세요.';
    }
  }
  isLoading.value = false;
});

const onSubmit = async () => {
  submitError.value = '';
  Object.keys(errors).forEach((key) => delete errors[key]);
  Object.assign(errors, validateProfile(form));
  if (Object.keys(errors).length > 0) return;

  isSaving.value = true;
  try {
    await mypageApi.createProfile(form);
    router.replace({ name: 'GoalSetup' });
  } catch (e) {
    // 401 은 api/index.js 인터셉터가 로그인 페이지로 보내므로 여기서 다루지 않는다.
    // (그 경우 e.response 자체가 없어서 아래 옵셔널 체이닝이 반드시 필요하다)
    if (e.response?.status === 409) {
      // 서버 409 문구가 회원가입용("이미 사용 중인 아이디 또는 이메일입니다")이라 그대로 쓸 수 없다.
      submitError.value =
        '이미 프로필이 저장되어 있어요. 마이페이지에서 수정해 주세요.';
    } else {
      submitError.value = errorMessage(
        e,
        '저장에 실패했어요. 잠시 후 다시 시도해 주세요.',
      );
    }
  } finally {
    isSaving.value = false;
  }
};

const onSkip = () => {
  router.replace({ name: 'GoalSetup' });
};
</script>

<template>
  <!-- 프로필 유무를 확인하기 전에 폼을 그리면, 이미 입력한 회원에게 폼이 깜빡였다 사라진다 -->
  <div v-if="!isLoading" class="profile-setup">
    <OnboardingHeader
      title="프로필 입력"
      :step="2"
      :steps="3"
      step-name="프로필"
      @skip="onSkip"
    />

    <KbCard yellow-bg>
      <p class="guide-main">
        ✨ 여기 적는 정보로 <strong>받을 수 있는 혜택</strong>을 골라드려요.
      </p>
      <p class="guide-sub">정확할수록 추천이 정확해집니다.</p>
    </KbCard>

    <ProfileForm :profile="form" :errors="errors" />

    <p v-if="submitError" class="submit-error">{{ submitError }}</p>

    <p class="skip-guide">
      지금 건너뛰어도 괜찮아요.<br />
      나중에 마이페이지에서 채우면 추천이 더 정확해져요.
    </p>

    <!-- KbButton 은 inline-flex 라서 grid 아이템으로 두어 폭을 꽉 채운다 -->
    <div class="submit-row">
      <KbButton type="primary" :disabled="isSaving" @click="onSubmit">
        {{ isSaving ? '저장 중…' : '다음' }}
      </KbButton>
    </div>
  </div>
</template>

<style scoped>
.profile-setup {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.guide-main {
  margin: 0;
  font-size: 14px;
  color: #2e2a24;
}

.guide-sub {
  margin: 0;
  font-size: 13px;
  color: #908980;
}

.submit-error {
  margin: 0;
  font-size: 13px;
  color: #d64545;
}

.skip-guide {
  margin: 0;
  text-align: center;
  font-size: 13px;
  line-height: 1.6;
  color: #908980;
}

.submit-row {
  display: grid;
}
</style>
