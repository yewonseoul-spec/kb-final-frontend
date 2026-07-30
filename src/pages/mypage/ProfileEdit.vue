<script setup>
import { onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import mypageApi, { validateProfile } from '@/api/mypageApi';
import KbButton from '@/components/common/KbButton.vue';
import KbCard from '@/components/common/KbCard.vue';
import ProfileForm from '@/components/mypage/ProfileForm.vue';

const router = useRouter();

// 서버는 미입력 항목을 null 로 주고 input/select 는 '' 를 쓴다. 불러올 때 '' 로 바꾸고,
// 보낼 때는 mypageApi 의 sanitize 가 다시 null 로 되돌린다.
const FIELDS = [
  'birthDate',
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
  // TODO: 마이페이지 요약 화면(MYP-03)이 생기면 '/mypage' 로 바꾼다.
  //       지금은 /mypage 가 이 화면으로 리다이렉트돼서 제자리걸음이 된다.
  router.push('/');
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
        <KbButton type="primary" @click="router.push('/mypage/infosetup')">
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
</style>
