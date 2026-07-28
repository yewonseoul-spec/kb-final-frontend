<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import authApi from '@/api/authApi';
import termsApi from '@/api/termsApi';

const router = useRouter();

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
    router.push('/login');
  } catch (e) {
    error.value = e.response?.data || '회원가입 중 오류가 발생했어요';
  }
};
</script>

<template>
  <div class="mt-5 mx-auto" style="max-width: 500px">
    <h1 class="h4 fw-bold my-5">회원가입</h1>

    <form @submit.prevent="signup">
      <div class="mb-3">
        <label for="realName" class="form-label">실명</label>
        <input
          id="realName"
          v-model="member.realName"
          type="text"
          class="form-control"
          maxlength="20"
          placeholder="실명을 입력하세요"
        />
      </div>

      <div class="mb-3">
        <label for="loginId" class="form-label">아이디</label>
        <div class="input-group">
          <input
            id="loginId"
            v-model="member.loginId"
            type="text"
            class="form-control"
            maxlength="30"
            placeholder="아이디를 입력하세요"
          />
          <button
            type="button"
            class="btn btn-outline-secondary"
            :disabled="!member.loginId"
            @click="checkId"
          >
            중복 확인
          </button>
        </div>
        <div
          v-if="member.loginId && idAvailable === null"
          class="text-secondary small"
        >
          중복 확인을 해주세요
        </div>
        <div v-if="idAvailable === true" class="text-success small">
          사용할 수 있는 아이디예요
        </div>
        <div v-if="idAvailable === false" class="text-danger small">
          이미 사용 중인 아이디예요
        </div>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">비밀번호</label>
        <input
          id="password"
          v-model="member.password"
          type="password"
          class="form-control"
          placeholder="비밀번호를 입력하세요"
        />
        <div class="form-text">영문·숫자·특수문자 포함 8자 이상</div>
        <div v-if="member.password && !passwordValid" class="text-danger small">
          비밀번호 조건을 만족하지 않아요
        </div>
      </div>

      <div class="mb-3">
        <label for="passwordConfirm" class="form-label">비밀번호 확인</label>
        <input
          id="passwordConfirm"
          v-model="member.passwordConfirm"
          type="password"
          class="form-control"
          placeholder="비밀번호를 다시 입력하세요"
        />
        <div
          v-if="member.passwordConfirm && !passwordMatch"
          class="text-danger small"
        >
          비밀번호가 일치하지 않아요
        </div>
      </div>

      <div class="mb-3">
        <label for="email" class="form-label">이메일</label>
        <div class="input-group">
          <input
            id="email"
            v-model="member.email"
            type="email"
            class="form-control"
            maxlength="100"
            placeholder="name@example.com"
          />
          <button
            type="button"
            class="btn btn-outline-secondary"
            :disabled="!member.email"
            @click="checkEmail"
          >
            중복 확인
          </button>
        </div>
        <div class="form-text">알림 수신에 사용돼요</div>
        <div
          v-if="member.email && emailAvailable === null"
          class="text-secondary small"
        >
          중복 확인을 해주세요
        </div>
        <div v-if="emailAvailable === true" class="text-success small">
          사용할 수 있는 이메일이에요
        </div>
        <div v-if="emailAvailable === false" class="text-danger small">
          이미 사용 중인 이메일이에요
        </div>
      </div>

      <div class="border rounded p-3 mb-3">
        <div class="form-check fw-bold mb-2">
          <input
            id="allAgreed"
            v-model="allAgreed"
            type="checkbox"
            class="form-check-input"
          />
          <label for="allAgreed" class="form-check-label"
            >약관에 모두 동의</label
          >
        </div>
        <hr />
        <div
          v-for="t in terms"
          :key="t.termsNo"
          class="form-check d-flex align-items-center gap-2"
        >
          <input
            :id="`terms-${t.termsNo}`"
            v-model="agreed[t.termsNo]"
            type="checkbox"
            class="form-check-input"
          />
          <label
            :for="`terms-${t.termsNo}`"
            class="form-check-label flex-grow-1"
          >
            {{ t.title }}
          </label>
          <span
            class="badge"
            :class="t.required ? 'bg-danger' : 'bg-secondary'"
          >
            {{ t.required ? '필수' : '선택' }}
          </span>
        </div>
      </div>

      <div v-if="error" class="text-danger">{{ error }}</div>

      <button
        type="submit"
        class="btn btn-warning w-100 mt-2"
        :disabled="disableSubmit"
      >
        가입하기
      </button>
    </form>
  </div>
</template>
