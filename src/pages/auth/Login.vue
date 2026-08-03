<script setup>
import { computed, reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import KbInput from '@/components/common/KbInput.vue';
import KbButton from '@/components/common/KbButton.vue';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();

const member = reactive({
  loginId: '',
  password: '',
});

const error = ref(
  route.query.error === 'login_required' ? '로그인이 필요한 서비스입니다' : '',
);
const disableSubmit = computed(() => !(member.loginId && member.password));

const login = async () => {
  error.value = '';
  try {
    await auth.login(member);
    router.push({ name: 'Home' });
  } catch (e) {
    error.value = e.response?.data || '로그인 중 오류가 발생했어요';
  }
};
</script>

<template>
  <div class="login">
    <div class="intro">
      <div class="intro-mark">⭐</div>
      <h1 class="intro-title">놓치는 청년혜택 없이<br />내 것부터 챙기기</h1>
      <p class="intro-sub">로그인하면 마감 임박한 혜택부터 알려드려요</p>
    </div>

    <form class="login-form" @submit.prevent="login">
      <KbInput
        v-model="member.loginId"
        label="아이디"
        placeholder="아이디를 입력하세요"
      />
      <KbInput
        v-model="member.password"
        type="password"
        label="비밀번호"
        placeholder="비밀번호를 입력하세요"
      />

      <!-- 필드 단위가 아니라 폼 단위(로그인 실패) 오류라 KbInput 의 errorMessage 를 쓰지 않는다 -->
      <p v-if="error" class="login-error">{{ error }}</p>

      <!-- KbButton 은 inline-flex 라서 grid 아이템으로 두어 폭을 꽉 채운다 -->
      <!-- KbButton 이 렌더하는 button 에 type 이 없어 폼 안에서는 submit 으로 동작한다. -->
      <!--@click 을 달면 두 번 실행된다 -->
      <div class="submit-row">
        <KbButton type="primary" :disabled="disableSubmit">로그인</KbButton>
      </div>
    </form>

    <p class="login-footer">
      아이디 조회 · 암호 설정
      <RouterLink class="signup-link" :to="{ name: 'SignUp' }"
        >회원가입</RouterLink
      >
    </p>
  </div>
</template>

<style scoped>
/* 바깥 DefaultLayout 이 my-5 px-3 을 이미 주므로 여기서는 정렬과 폭만 맡는다 */
.login {
  max-width: 500px;
  margin: 0 auto;
}

.intro {
  margin-bottom: 32px;
  text-align: center;
}

.intro-mark {
  font-size: 40px;
}

.intro-title {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 700;
  line-height: 1.5;
  color: #2e2a24;
}

.intro-sub {
  margin: 8px 0 0;
  font-size: 13px;
  color: #908980;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.login-error {
  margin: 0;
  font-size: 13px;
  color: #d64545;
}

.submit-row {
  display: grid;
  margin-top: 8px;
}

.login-footer {
  margin: 24px 0 0;
  text-align: center;
  font-size: 13px;
  color: #908980;
}

.signup-link {
  color: #2e2a24;
  font-weight: 600;
}
</style>
