<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import KbInput from '@/components/common/KbInput.vue';
import KbButton from '@/components/common/KbButton.vue';
import authApi from '@/api/authApi';
import { errorMessage } from '@/api';

const router = useRouter();

// verify(본인확인) → reset(새 비밀번호) → done(완료)
const step = ref('verify');

const form = reactive({
  loginId: '',
  email: '',
  newPassword: '',
  newPasswordConfirm: '',
});

// 성공은 일찍, 실패는 늦게. 첫 글자에서 빨간 문구가 뜨지 않게 focusout 이후에만 검사한다
const touched = reactive({
  email: false,
  newPassword: false,
  newPasswordConfirm: false,
});

const isSubmitting = ref(false);
const error = ref('');

// SignUp.vue 와 같은 규칙
const EMAIL_RULE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailValid = computed(() => EMAIL_RULE.test(form.email));
const emailError = computed(() =>
  touched.email && form.email && !emailValid.value
    ? '이메일 형식이 올바르지 않아요.'
    : '',
);
const canVerify = computed(() => !!form.loginId.trim() && emailValid.value);

// SignUp.vue·ChangePassword.vue 와 같은 규칙
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const passwordValid = computed(() => PASSWORD_RULE.test(form.newPassword));
const isMatched = computed(() => form.newPassword === form.newPasswordConfirm);

const passwordError = computed(() =>
  touched.newPassword && form.newPassword && !passwordValid.value
    ? '영문·숫자·특수문자를 포함해 8자 이상이어야 해요.'
    : '',
);
const confirmError = computed(() =>
  touched.newPasswordConfirm && form.newPasswordConfirm && !isMatched.value
    ? '새 비밀번호와 달라요.'
    : '',
);
const canReset = computed(() => passwordValid.value && isMatched.value);

const onVerify = async () => {
  error.value = '';
  isSubmitting.value = true;
  try {
    await authApi.verifyResetPassword(form.loginId.trim(), form.email.trim());
    step.value = 'reset';
  } catch (e) {
    // 아이디·이메일 중 무엇이 틀렸는지는 서버도 구분해 주지 않는다
    error.value = errorMessage(e, '본인확인 중 오류가 발생했어요.');
  } finally {
    isSubmitting.value = false;
  }
};

const onReset = async () => {
  error.value = '';
  isSubmitting.value = true;
  try {
    await authApi.resetPassword(
      form.loginId.trim(),
      form.email.trim(),
      form.newPassword,
    );
    step.value = 'done';
  } catch (e) {
    error.value = errorMessage(e, '비밀번호 재설정 중 오류가 발생했어요.');
  } finally {
    isSubmitting.value = false;
  }
};

// 완료 후 뒤로가기로 재설정 폼에 돌아오지 않도록 replace 를 쓴다
const goLogin = () => router.replace({ name: 'Login' });
</script>

<template>
  <div class="reset-password">
    <!-- 1단계: 본인확인 -->
    <form
      v-if="step === 'verify'"
      class="reset-form"
      @submit.prevent="onVerify"
    >
      <p class="guide">
        가입할 때 등록한 아이디와 이메일이 모두 일치해야 재설정할 수 있어요.
      </p>

      <KbInput
        v-model="form.loginId"
        label="아이디"
        placeholder="아이디를 입력하세요"
        :maxlength="20"
      />

      <KbInput
        v-model="form.email"
        label="이메일"
        placeholder="name@example.com"
        :maxlength="100"
        :is-error="!!emailError"
        :error-message="emailError"
        @focusout="touched.email = true"
      />

      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="submit-row">
        <KbButton type="primary" :disabled="isSubmitting || !canVerify">
          {{ isSubmitting ? '확인 중…' : '확인' }}
        </KbButton>
      </div>

      <!-- 링크 뒤에 조사가 오면 태그 사이 줄바꿈이 공백으로 렌더링된다. 링크를 문장 끝에 둔다 -->
      <p class="form-hint">
        아이디를 잊으셨나요?
        <RouterLink class="hint-link" :to="{ name: 'FindId' }">
          아이디 찾기
        </RouterLink>
      </p>
    </form>

    <!-- 2단계: 새 비밀번호 -->
    <form
      v-else-if="step === 'reset'"
      class="reset-form"
      @submit.prevent="onReset"
    >
      <p class="guide">
        <strong>{{ form.loginId.trim() }}</strong> 계정의 비밀번호를 새로 정해
        주세요.<br />
        영문·숫자·특수문자를 포함해 8자 이상이어야 해요.
      </p>

      <KbInput
        v-model="form.newPassword"
        type="password"
        label="새 비밀번호"
        placeholder="새 비밀번호"
        :is-error="!!passwordError"
        :error-message="passwordError"
        @focusout="touched.newPassword = true"
      />

      <KbInput
        v-model="form.newPasswordConfirm"
        type="password"
        label="새 비밀번호 확인"
        placeholder="새 비밀번호 확인"
        :is-error="!!confirmError"
        :error-message="confirmError"
        @focusout="touched.newPasswordConfirm = true"
      />

      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="submit-row">
        <KbButton type="primary" :disabled="isSubmitting || !canReset">
          {{ isSubmitting ? '변경 중…' : '비밀번호 변경' }}
        </KbButton>
      </div>
    </form>

    <!-- 3단계: 완료 -->
    <div v-else class="result">
      <p class="result-title">비밀번호를 변경했어요</p>
      <p class="result-desc">새 비밀번호로 로그인해 주세요.</p>

      <div class="result-actions">
        <KbButton type="primary" @click="goLogin">로그인하러 가기</KbButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.reset-password {
  max-width: 500px;
  margin: 0 auto;
}

.reset-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.guide {
  margin: 0 0 4px;
  font-size: 13px;
  line-height: 1.6;
  color: #908980;
}

.guide strong {
  color: #2e2a24;
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

.form-hint {
  margin: 0;
  text-align: center;
  font-size: 12px;
  color: #908980;
}

.hint-link {
  display: inline-block;
  margin-left: 6px;
  padding: 4px 2px;
  color: #2e2a24;
  font-weight: 600;
}

/* 값은 KbCard(앱 표준 카드)와 맞춘다. 세로 여백만 결과 화면답게 넉넉히 준다 */
.result {
  padding: 32px 20px;
  text-align: center;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 14px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
}

.result-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2e2a24;
}

.result-desc {
  margin: 8px 0 0;
  font-size: 13px;
  color: #908980;
}

.result-actions {
  display: grid;
  margin-top: 24px;
}
</style>
