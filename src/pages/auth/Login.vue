<script setup>
import { computed, reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';

const router = useRouter();
const auth = useAuthStore();

const member = reactive({
  loginId: '',
  password: '',
});

const error = ref('');
const disableSubmit = computed(() => !(member.loginId && member.password));

const login = async () => {
  error.value = '';
  try {
    await auth.login(member);
    router.push('/');
  } catch (e) {
    error.value = e.response?.data || '로그인 중 오류가 발생했어요';
  }
};
</script>

<template>
  <div class="mt-5 mx-auto" style="max-width: 500px">
    <div class="text-center my-5">
      <div class="fs-1">⭐</div>
      <h1 class="h4 fw-bold">놓치는 청년혜택 없이<br />내 것부터 챙기기</h1>
      <p class="text-muted">로그인하면 마감 임박한 혜택부터 알려드려요</p>
    </div>

    <form @submit.prevent="login">
      <div class="mb-3 mt-3">
        <label for="loginId" class="form-label">
          <i class="fa-solid fa-user"></i>
          아이디
        </label>
        <input
          type="text"
          id="loginId"
          class="form-control"
          placeholder="아이디를 입력하세요"
          v-model="member.loginId"
        />
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">
          <i class="fa-solid fa-lock"></i>
          비밀번호
        </label>
        <input
          type="password"
          id="password"
          class="form-control"
          placeholder="비밀번호를 입력하세요"
          v-model="member.password"
        />
      </div>

      <div v-if="error" class="text-danger">{{ error }}</div>

      <button
        type="submit"
        class="btn btn-warning w-100 mt-4"
        :disabled="disableSubmit"
      >
        <i class="fa-solid fa-right-to-bracket"></i>
        로그인
      </button>
    </form>

    <p class="text-center text-muted mt-3 mb-0">
      아이디 조회 · 암호 설정 · 회원가입
    </p>
  </div>
</template>
