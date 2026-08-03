<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import mypageApi, { validateProfile } from '@/api/mypageApi';
import KbButton from '@/components/common/KbButton.vue';
import KbCard from '@/components/common/KbCard.vue';
import ProfileForm from '@/components/mypage/ProfileForm.vue';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const auth = useAuthStore();

// 서버는 미입력 항목을 null 로 주고 input/select 는 '' 를 쓴다. 불러올 때 '' 로 바꾸고,
// 보낼 때는 mypageApi 의 sanitize 가 다시 null 로 되돌린다.
const FIELDS = [
  'birthDate',
  'regionCode',
  'income',
  'employStatus',
  'major',
  'householdSize',
  'education',
  'mrgSttsCd',
];

const form = reactive(Object.fromEntries(FIELDS.map((field) => [field, ''])));
const errors = reactive({});

const isLoading = ref(true);
const isSaving = ref(false);
const isEmpty = ref(false); // 프로필 미입력(404)
const message = ref('');
const isError = ref(false);

const fill = (profile) => {
  FIELDS.forEach((field) => {
    form[field] = profile[field] ?? '';
  });
};

onMounted(async () => {
  try {
    const profile = await mypageApi.getProfile();
    fill(profile);
  } catch (e) {
    // 404 는 오류가 아니라 '프로필 미입력' 이다. 에러 문구 대신 입력을 유도한다.
    if (e.response?.status === 404) {
      isEmpty.value = true;
    } else {
      isError.value = true;
      message.value = '프로필을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
  } finally {
    isLoading.value = false;
  }
});

const onSave = async () => {
  message.value = '';
  isError.value = false;

  Object.keys(errors).forEach((key) => delete errors[key]);
  Object.assign(errors, validateProfile(form));
  if (Object.keys(errors).length > 0) return;

  isSaving.value = true;
  try {
    // PUT 은 전체 교체다. 폼이 항목 전체를 들고 있으므로 그대로 보낸다.
    await mypageApi.updateProfile(form);
    message.value = '저장했어요.';
  } catch (e) {
    isError.value = true;
    if (e.response?.status === 404) {
      // 프로필이 없는 상태에서 PUT 하면 404 → 입력 화면으로 유도
      isEmpty.value = true;
    } else {
      message.value =
        e.response?.data || '저장에 실패했어요. 잠시 후 다시 시도해 주세요.';
    }
  } finally {
    isSaving.value = false;
  }
};

// 마이페이지 요약 화면에서 '수정' 으로 들어오는 서브 화면이라 취소는 그 화면으로 돌아간다.
// 다만 주소창 직접 진입이나 새로고침 직후에는 히스토리가 없어 back() 이 앱 밖으로 나가버리므로
// 그때는 대체 목적지로 보낸다.
const onCancel = () => {
  if (window.history.state?.back) {
    router.back();
    return;
  }
  // TODO: 마이페이지 요약 화면이 생기면 { name: 'MyPage' } 로 바꾼다.
  //       지금 MyPage 로 보내면 이 화면으로 다시 리다이렉트돼 제자리걸음이라 Home 으로 둔다.
  router.push({ name: 'Home' });
};

// 회원 탈퇴 — 재확인 절차
// 공통에 모달 컴포넌트가 없어 이 화면 안에 둔다. 공통 KbModal 이 생기면 교체할 것.
const showWithdrawConfirm = ref(false);
const isWithdrawing = ref(false);
const isWithdrawn = ref(false);
const withdrawError = ref('');

const onWithdraw = async () => {
  withdrawError.value = '';
  isWithdrawing.value = true;
  try {
    await mypageApi.withdraw();
    isWithdrawn.value = true; // 모달을 완료 안내로 바꾼다
  } catch (e) {
    // 401 은 인터셉터가 처리한다(그 경우 e.response 가 없어 옵셔널 체이닝이 필요)
    withdrawError.value =
      e.response?.data || '탈퇴에 실패했어요. 잠시 후 다시 시도해 주세요.';
  } finally {
    isWithdrawing.value = false;
  }
};

// 탈퇴는 soft delete 라 서버 세션이 따로 없다. 로컬 토큰을 직접 지우지 않으면
// 죽은 계정의 토큰이 남아 다음 요청이 401 이 된다.
const onWithdrawDone = () => {
  auth.logout();
  router.replace('/');
};
</script>

<template>
  <div v-if="!isLoading" class="profile-edit">
    <h1 class="page-title">{{ isEmpty ? '프로필 입력' : '프로필 수정' }}</h1>

    <template v-if="isEmpty">
      <KbCard yellow-bg>
        <p class="empty-main">아직 프로필을 입력하지 않으셨어요.</p>
        <p class="empty-sub">입력하면 받을 수 있는 혜택을 골라드려요.</p>
      </KbCard>
      <div class="button-row">
        <KbButton type="primary" @click="router.push({ name: 'ProfileSetup' })">
          프로필 입력하러 가기
        </KbButton>
      </div>
    </template>

    <template v-else>
      <ProfileForm :profile="form" :errors="errors" />

      <p v-if="message" :class="['message', { error: isError }]">
        {{ message }}
      </p>

      <p class="guide">수정하면 맞춤 추천에 바로 반영돼요</p>

      <div class="button-row two">
        <KbButton type="secondary" :disabled="isSaving" @click="onCancel">
          취소
        </KbButton>
        <KbButton type="primary" :disabled="isSaving" @click="onSave">
          {{ isSaving ? '저장 중…' : '저장' }}
        </KbButton>
      </div>
    </template>

    <button
      type="button"
      class="goal-link"
      @click="router.push({ name: 'GoalEdit' })"
    >
      목표 설정
    </button>

    <button
      type="button"
      class="withdraw-link"
      @click="showWithdrawConfirm = true"
    >
      회원 탈퇴
    </button>

    <div v-if="showWithdrawConfirm" class="modal-overlay">
      <div class="modal-card">
        <template v-if="isWithdrawn">
          <h4 class="modal-title">탈퇴가 완료되었습니다</h4>
          <p class="modal-desc">그동안 이용해 주셔서 감사합니다.</p>
          <div class="modal-actions">
            <KbButton type="primary" @click="onWithdrawDone">확인</KbButton>
          </div>
        </template>

        <template v-else>
          <h4 class="modal-title">회원 탈퇴</h4>
          <p class="modal-desc">
            탈퇴하면 같은 아이디로 다시 로그인할 수 없어요.<br />
            정말 탈퇴하시겠어요?
          </p>
          <p v-if="withdrawError" class="modal-error">{{ withdrawError }}</p>
          <div class="modal-actions two">
            <KbButton
              type="secondary"
              :disabled="isWithdrawing"
              @click="showWithdrawConfirm = false"
            >
              취소
            </KbButton>
            <KbButton
              type="danger"
              :disabled="isWithdrawing"
              @click="onWithdraw"
            >
              {{ isWithdrawing ? '처리 중…' : '탈퇴' }}
            </KbButton>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-edit {
  display: flex;
  flex-direction: column;
  gap: 20px;
  /* 하단 고정 탭바(80px)에 버튼이 가리지 않도록 */
  padding-bottom: 96px;
}

.page-title {
  margin: 0;
  font-size: 22px;
  font-weight: 700;
  color: #2e2a24;
}

.empty-main {
  margin: 0;
  font-size: 14px;
  color: #2e2a24;
}

.empty-sub {
  margin: 0;
  font-size: 13px;
  color: #908980;
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

.guide {
  margin: 0;
  text-align: center;
  font-size: 13px;
  color: #908980;
}

.button-row {
  display: grid;
}

.button-row.two {
  grid-template-columns: 1fr 2fr;
  gap: 12px;
}

.withdraw-link {
  align-self: center;
  background: none;
  border: none;
  padding: 4px;
  font-size: 14px;
  font-weight: 700;
  color: #d64545;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-card {
  width: 90%;
  max-width: 300px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.modal-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #2e2a24;
}

.modal-desc {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #908980;
  word-break: keep-all; /* 한글을 음절이 아니라 어절(띄어쓰기) 단위로 끊는다 */
}

.modal-error {
  margin: 0 0 12px;
  font-size: 13px;
  color: #d64545;
}

/* KbButton 이 inline-flex 라 grid 아이템으로 두어 폭을 채운다 (.button-row 와 같은 방식) */
.modal-actions {
  display: grid;
  width: 100%;
  gap: 10px;
}

.modal-actions.two {
  grid-template-columns: 1fr 1fr;
}

.goal-link {
  align-self: center;
  background: none;
  border: none;
  padding: 0;
  font-size: 14px;
  font-weight: 600;
  color: #2e2a24;
  cursor: pointer;
}
</style>
