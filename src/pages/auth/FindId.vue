<script setup>
import { computed, ref } from 'vue';
import { useRouter } from 'vue-router';
import KbInput from '@/components/common/KbInput.vue';
import KbButton from '@/components/common/KbButton.vue';
import authApi from '@/api/authApi';
import { errorMessage } from '@/api';

const router = useRouter();

const email = ref('');
const touched = ref(false);
const isFinding = ref(false);
const found = ref(null); // { loginId, createdAt }
const error = ref('');

// SignUp.vue 와 같은 규칙
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailValid = computed(() => EMAIL_RULE.test(email.value));

const emailError = computed(() =>
  touched.value && email.value && !emailValid.value
    ? '이메일 형식이 올바르지 않아요.'
    : '',
);

// createdAt 은 Jackson 기본 설정이라 epoch 밀리초로 온다. Date 가 그대로 받는다
const joinedAt = computed(() => {
  if (!found.value?.createdAt) return '';
  return new Date(found.value.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
});

const onFind = async () => {
  error.value = '';
  isFinding.value = true;
  try {
    found.value = await authApi.findId(email.value.trim());
  } catch (e) {
    // 가입 계정이 없으면 서버가 404 + 문구를 준다
    error.value = errorMessage(e, '아이디를 찾는 중 오류가 발생했어요.');
  } finally {
    isFinding.value = false;
  }
};
</script>

<template>
  <div class="find-id">
    <!-- 결과가 나오면 입력 폼을 감춘다. 남겨 두면 다시 눌러야 하는지 헷갈린다 -->
    <template v-if="!found">
      <p class="guide">가입할 때 등록한 이메일을 입력해 주세요.</p>

      <form class="find-form" @submit.prevent="onFind">
        <KbInput
          v-model="email"
          label="이메일"
          placeholder="name@example.com"
          :maxlength="100"
          :is-error="!!emailError"
          :error-message="emailError"
          @focusout="touched = true"
        />

        <!-- 필드가 아니라 폼 단위(조회 실패) 오류라 KbInput 의 errorMessage 를 쓰지 않는다 -->
        <p v-if="error" class="form-error">{{ error }}</p>

        <!-- KbButton 에 native type 이 없어 폼 안에서는 submit 이다. @click 을 달면 두 번 실행된다
  -->
        <div class="submit-row">
          <KbButton type="primary" :disabled="isFinding || !emailValid">
            {{ isFinding ? '찾는 중…' : '아이디 찾기' }}
          </KbButton>
        </div>
      </form>
    </template>

    <div v-else class="result">
      <p class="result-title">회원님의 아이디예요</p>
      <p class="result-id">{{ found.loginId }}</p>
      <p class="result-date">{{ joinedAt }} 가입</p>

      <div class="result-actions">
        <KbButton type="primary" @click="router.replace({ name: 'Login' })">
          로그인하러 가기
        </KbButton>
        <KbButton
          type="secondary"
          @click="router.replace({ name: 'ResetPassword' })"
        >
          비밀번호도 잊으셨나요?
        </KbButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.find-id {
  max-width: 500px;
  margin: 0 auto;
}

.guide {
  margin: 0 0 20px;
  font-size: 13px;
  color: #908980;
}

.find-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-error {
  margin: 0;
  font-size: 13px;
  color: #d64545;
}

.submit-row {
  display: grid;
  margin-top: 8px;
}

/* 마이페이지 빈 상태(AppliedBenefits·FavoriteBenefits)와 같은 형태.
     이 앱은 상태를 알리는 화면을 카드에 담지 않는다 */
.result {
  padding: 40px 0;
  text-align: center;
}

.result-title {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: #2e2a24;
}

.result-id {
  margin: 12px 0 0;
  font-size: 24px;
  font-weight: 700;
  color: #2e2a24;
  word-break: break-all;
}

.result-date {
  margin: 6px 0 0;
  font-size: 12px;
  color: #908980;
}

.result-actions {
  display: grid;
  gap: 8px;
  margin-top: 24px;
}
</style>
