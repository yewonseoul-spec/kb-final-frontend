<script setup>
import { computed, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import KbInput from '@/components/common/KbInput.vue';
import KbButton from '@/components/common/KbButton.vue';
import mypageApi from '@/api/mypageApi';

const router = useRouter();

const form = reactive({
  oldPassword: '',
  newPassword: '',
  newPasswordConfirm: '',
});

// 성공은 일찍, 실패는 늦게.
// 첫 글자에서 빨간 문구가 뜨지 않게 focusout 이후에만 검사한다.
const touched = reactive({ newPassword: false, newPasswordConfirm: false });

// SignUp.vue 와 같은 규칙.
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;

const newValid = computed(() => PASSWORD_RULE.test(form.newPassword));
const isMatched = computed(() => form.newPassword === form.newPasswordConfirm);

const newPasswordError = computed(() =>
  touched.newPassword && form.newPassword && !newValid.value
    ? '영문·숫자·특수문자를 포함해 8자 이상이어야 해요.'
    : '',
);

const confirmError = computed(() =>
  touched.newPasswordConfirm && form.newPasswordConfirm && !isMatched.value
    ? '새 비밀번호와 달라요.'
    : '',
);

const canSubmit = computed(
  () => !!form.oldPassword && newValid.value && isMatched.value,
);

const isSaving = ref(false);
const message = ref('');
const isError = ref(false);

const onSave = async () => {
  message.value = '';
  isError.value = false;
  isSaving.value = true;
  try {
    await mypageApi.changePassword(form.oldPassword, form.newPassword);
    form.oldPassword = '';
    form.newPassword = '';
    form.newPasswordConfirm = '';
    touched.newPassword = false;
    touched.newPasswordConfirm = false;
    message.value = '비밀번호를 변경했어요.';
  } catch (e) {
    // 현재 비밀번호 불일치는 서버가 400 + 문구를 준다.
    // 401 은 api/index.js 인터셉터가 처리한다.
    isError.value = true;
    message.value =
      e.response?.data || '변경에 실패했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    isSaving.value = false;
  }
};

const onCancel = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  router.push({ name: 'MyPage' });
};
</script>

<template>
  <div class="change-password">
    <p class="guide">영문·숫자·특수문자를 포함해 8자 이상으로 정해 주세요.</p>

    <KbInput
      v-model="form.oldPassword"
      label="현재 비밀번호"
      type="password"
      placeholder="현재 비밀번호"
    />

    <KbInput
      v-model="form.newPassword"
      label="새 비밀번호"
      type="password"
      placeholder="새 비밀번호"
      :is-error="!!newPasswordError"
      :error-message="newPasswordError"
      @focusout="touched.newPassword = true"
    />

    <KbInput
      v-model="form.newPasswordConfirm"
      label="새 비밀번호 확인"
      type="password"
      placeholder="새 비밀번호 확인"
      :is-error="!!confirmError"
      :error-message="confirmError"
      @focusout="touched.newPasswordConfirm = true"
    />

    <p v-if="message" :class="['message', { error: isError }]">
      {{ message }}
    </p>

    <div class="button-row two">
      <KbButton type="secondary" :disabled="isSaving" @click="onCancel">
        취소
      </KbButton>
      <KbButton
        type="primary"
        :disabled="isSaving || !canSubmit"
        @click="onSave"
      >
        {{ isSaving ? '변경 중…' : '변경' }}
      </KbButton>
    </div>
  </div>
</template>

<style scoped>
/* 탭바가 position:fixed 라 여백이 없으면 버튼을 덮는다 */
.change-password {
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
