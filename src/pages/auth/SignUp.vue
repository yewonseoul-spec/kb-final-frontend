<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import authApi from '@/api/authApi';
import termsApi from '@/api/termsApi';
import { useAuthStore } from '@/stores/auth';
import KbInput from '@/components/common/KbInput.vue';
import KbButton from '@/components/common/KbButton.vue';
import KbCheckbox from '@/components/common/KbCheckbox.vue';
import KbBadge from '@/components/common/KbBadge.vue';
import KbCard from '@/components/common/KbCard.vue';

const router = useRouter();
const auth = useAuthStore();

const member = reactive({
  realName: '',
  loginId: '',
  password: '',
  passwordConfirm: '',
  email: '',
});

const terms = ref([]);
const agreed = reactive({});

const idAvailable = ref(null);
const emailAvailable = ref(null);
const error = ref('');

// 값 수정 시 중복확인 결과 무효화
watch(
  () => member.loginId,
  () => (idAvailable.value = null),
);
watch(
  () => member.email,
  () => (emailAvailable.value = null),
);

// KbInput 은 루트가 div 라 maxlength 가 input 까지 가지 않는다. DB 컬럼 길이를 넘기면
// MySQL 1406 으로 500 이 나므로 여기서 잘라 둔다. KbInput 이 속성을 넘기게 되면 지울 코드.
const LENGTH_LIMIT = { realName: 20, loginId: 30, email: 100 };
Object.entries(LENGTH_LIMIT).forEach(([field, limit]) => {
  watch(
    () => member[field],
    (v) => {
      if (v.length > limit) member[field] = v.slice(0, limit);
    },
  );
});

onMounted(async () => {
  terms.value = await termsApi.getSignupTerms();
  terms.value.forEach((t) => (agreed[t.termsNo] = false));
});

const checkId = async () => {
  idAvailable.value = !(await authApi.checkId(member.loginId));
};

const checkEmail = async () => {
  emailAvailable.value = !(await authApi.checkEmail(member.email));
};

// 영문·숫자·특수문자 포함 8자 이상
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const passwordValid = computed(() => PASSWORD_RULE.test(member.password));
const passwordMatch = computed(
  () => !!member.password && member.password === member.passwordConfirm,
);

const allAgreed = computed({
  get: () =>
    terms.value.length > 0 && terms.value.every((t) => agreed[t.termsNo]),
  set: (v) => terms.value.forEach((t) => (agreed[t.termsNo] = v)),
});

const requiredAgreed = computed(() =>
  terms.value.filter((t) => t.required).every((t) => agreed[t.termsNo]),
);

const disableSubmit = computed(
  () =>
    !(
      member.realName.trim() &&
      idAvailable.value === true &&
      passwordValid.value &&
      passwordMatch.value &&
      emailAvailable.value === true &&
      requiredAgreed.value
    ),
);

const signup = async () => {
  error.value = '';
  try {
    await authApi.signup({
      loginId: member.loginId,
      password: member.password,
      email: member.email,
      realName: member.realName.trim(),
      terms: terms.value.map((t) => ({
        termsNo: t.termsNo,
        agreed: !!agreed[t.termsNo],
      })),
    });
    // 방금 입력받은 자격증명으로 바로 로그인시켜 온보딩까지 한 흐름으로 잇는다.
    // 가입은 이미 성공했으므로, 로그인만 실패하면 로그인 화면으로 보내되 가입 실패로 표시하지 않는다.
    try {
      await auth.login({ loginId: member.loginId, password: member.password });
      router.push('/mypage/infosetup');
    } catch {
      router.push('/login');
    }
  } catch (e) {
    error.value = e.response?.data || '회원가입 중 오류가 발생했어요';
  }
};
</script>

<template>
  <div class="signup">
    <h1 class="page-title">회원가입</h1>

    <form class="signup-form" @submit.prevent="signup">
      <KbInput
        v-model="member.realName"
        label="실명"
        placeholder="실명을 입력하세요"
      />

      <div class="field">
        <div class="field-row">
          <KbInput
            v-model="member.loginId"
            class="field-input"
            label="아이디"
            placeholder="아이디를 입력하세요"
            :is-error="idAvailable === false"
          />
          <!-- KbButton 은 폼 안에서 submit 으로 동작해 회원가입이 제출된다. 중복확인은 네이티브 button 유지 -->
          <button
            type="button"
            class="check-btn"
            :disabled="!member.loginId"
            @click="checkId"
          >
            중복 확인
          </button>
        </div>
        <p v-if="member.loginId && idAvailable === null" class="field-msg">
          중복 확인을 해주세요
        </p>
        <p v-if="idAvailable === true" class="field-msg ok">
          사용할 수 있는 아이디예요
        </p>
        <p v-if="idAvailable === false" class="field-msg err">
          이미 사용 중인 아이디예요
        </p>
      </div>

      <div class="field">
        <KbInput
          v-model="member.password"
          type="password"
          label="비밀번호"
          placeholder="비밀번호를 입력하세요"
          :is-error="!!member.password && !passwordValid"
        />
        <p class="field-msg">영문·숫자·특수문자 포함 8자 이상</p>
        <p v-if="member.password && !passwordValid" class="field-msg err">
          비밀번호 조건을 만족하지 않아요
        </p>
      </div>

      <div class="field">
        <KbInput
          v-model="member.passwordConfirm"
          type="password"
          label="비밀번호 확인"
          placeholder="비밀번호를 다시 입력하세요"
          :is-error="!!member.passwordConfirm && !passwordMatch"
        />
        <p
          v-if="member.passwordConfirm && !passwordMatch"
          class="field-msg err"
        >
          비밀번호가 일치하지 않아요
        </p>
      </div>

      <div class="field">
        <div class="field-row">
          <KbInput
            v-model="member.email"
            class="field-input"
            type="email"
            label="이메일"
            placeholder="name@example.com"
            :is-error="emailAvailable === false"
          />
          <button
            type="button"
            class="check-btn"
            :disabled="!member.email"
            @click="checkEmail"
          >
            중복 확인
          </button>
        </div>
        <p class="field-msg">알림 수신에 사용돼요</p>
        <p v-if="member.email && emailAvailable === null" class="field-msg">
          중복 확인을 해주세요
        </p>
        <p v-if="emailAvailable === true" class="field-msg ok">
          사용할 수 있는 이메일이에요
        </p>
        <p v-if="emailAvailable === false" class="field-msg err">
          이미 사용 중인 이메일이에요
        </p>
      </div>

      <KbCard>
        <KbCheckbox v-model="allAgreed" class="agree-all">
          약관에 모두 동의
        </KbCheckbox>

        <hr class="terms-divider" />

        <div v-for="t in terms" :key="t.termsNo" class="terms-row">
          <KbCheckbox v-model="agreed[t.termsNo]" class="terms-check">
            {{ t.title }}
          </KbCheckbox>
          <KbBadge :variant="t.required ? 'danger' : 'gray'">
            {{ t.required ? '필수' : '선택' }}
          </KbBadge>
        </div>
      </KbCard>

      <p v-if="error" class="signup-error">{{ error }}</p>

      <!-- KbButton 은 inline-flex 라서 grid 아이템으로 두어 폭을 꽉 채운다 -->
      <div class="submit-row">
        <KbButton type="primary" :disabled="disableSubmit">가입하기</KbButton>
      </div>
    </form>
  </div>
</template>

<style scoped>
/* 바깥 DefaultLayout 이 my-5 px-3 을 이미 주므로 여기서는 정렬과 폭만 맡는다 */
.signup {
  max-width: 500px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 32px;
  font-size: 20px;
  font-weight: 700;
  color: #2e2a24;
}

.signup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* 라벨 높이만큼 입력칸이 내려가므로 아래를 기준으로 버튼을 맞춘다 */
.field-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.field-input {
  flex: 1;
  min-width: 0;
}

/* KbButton secondary 와 같은 모양. KbButton 이 native type 을 받게 되면 교체할 것 */
.check-btn {
  box-sizing: border-box;
  flex-shrink: 0;
  height: 48px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  color: #2e2a24;
  white-space: nowrap;
  cursor: pointer;
  transition: all 0.2s;
}

.check-btn:disabled {
  background-color: #f8f7f2;
  border-color: #e4e0d6;
  color: #a1998d;
  cursor: not-allowed;
}

.field-msg {
  margin: 0;
  font-size: 12px;
  color: #908980;
}
.field-msg.ok {
  color: #43a047;
}
.field-msg.err {
  color: #d64545;
}

/* KbCheckbox 안쪽 글자라 :deep 이 필요하다 */
.agree-all :deep(.label-text) {
  font-weight: 700;
}

.terms-divider {
  margin: 4px 0;
  border: 0;
  border-top: 1px solid #efece4;
}

.terms-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.terms-check {
  flex: 1;
}

.signup-error {
  margin: 0;
  font-size: 13px;
  color: #d64545;
}

.submit-row {
  display: grid;
  margin-top: 8px;
}
</style>
