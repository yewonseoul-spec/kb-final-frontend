<script setup>
import { computed, reactive, ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRoute, useRouter } from 'vue-router';
import KbInput from '@/components/common/KbInput.vue';
import KbButton from '@/components/common/KbButton.vue';
import { errorMessage } from '@/api';

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
    error.value = errorMessage(e, '로그인 중 오류가 발생했어요');
  }
};
</script>

<template>
  <div class="login">
    <div class="intro">
      <div class="intro-mark">⭐</div>
      <h1 class="intro-title">놓치는 청년혜택 없이<br />내 것부터 챙기기</h1>
      <p class="intro-sub">로그인하면 내 조건에 맞는 혜택을 보여드려요</p>
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
      <RouterLink class="footer-link" :to="{ name: 'FindId' }">
        아이디 찾기
      </RouterLink>
      <span class="footer-divider" aria-hidden="true"></span>
      <RouterLink class="footer-link" :to="{ name: 'ResetPassword' }">
        비밀번호 재설정
      </RouterLink>
      <span class="footer-divider" aria-hidden="true"></span>
      <RouterLink class="footer-link" :to="{ name: 'SignUp' }">
        회원가입
      </RouterLink>
    </p>
    <!-- 로그인 화면은 hideTabBar 라 탭바가 없다. 첫 화면으로 뜨는 만큼
           로그인하지 않고 나갈 출구가 하나는 있어야 한다 -->
    <div class="browse-row">
      <RouterLink class="browse-link" :to="{ name: 'Home' }">
        로그인 없이 둘러보기
      </RouterLink>
    </div>
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

/* 로그인 버튼과 붙어 보이지 않게 간격을 벌린다 */
.login-footer {
  margin: 32px 0 0;
  text-align: center;
  font-size: 13px;
  color: #908980;
}

/* 밑줄은 브라우저 기본값이라 명시적으로 꺼야 한다.
       짧은 링크 3개에 선이 세 번 그어지면 줄이 어수선해진다 */
.footer-link {
  display: inline-block;
  padding: 6px 4px;
  color: #908980;
  text-decoration: none;
}

/* 점 대신 얇은 선. 글자가 아니라 도형이라 크기·색을 정확히 통제할 수 있다 */
.footer-divider {
  display: inline-block;
  width: 1px;
  height: 10px;
  margin: 0 8px;
  background-color: #ddd8ce;
  vertical-align: middle;
}

.browse-row {
  margin-top: 20px;
  text-align: center;
}

.browse-row {
  margin-top: 12px;
  text-align: center;
}

.browse-link {
  font-size: 13px;
  color: #908980;
  text-decoration: underline;
}
</style>
