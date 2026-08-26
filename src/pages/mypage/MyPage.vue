<script setup>
import { computed, onMounted, ref } from 'vue';
import { RouterLink, useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import BenefitCard from '@/components/benefit/BenefitCard.vue';
import mypageApi from '@/api/mypageApi';
import KbButton from '@/components/common/KbButton.vue';

const auth = useAuthStore();
const router = useRouter();

const profile = ref(null); // 404 면 null 유지 = 미입력
const goal = ref(null); // 404 면 null 유지 = 미설정
const favorites = ref([]);
const applied = ref([]);
const isLoading = ref(true);
const message = ref('');

const moveToDetail = (benefitNo) => {
  router.push({ name: 'benefit-detail', params: { benefitNo } });
};

// 추천 엔진의 필수 필드와 같은 목록.
// 소득은 추천에 쓰지 않기로 해서 뺐다.
const PROFILE_FIELDS = [
  { key: 'birthDate', label: '생년월일' },
  { key: 'regionCode', label: '지역' },
  { key: 'employStatus', label: '취업상태' },
  { key: 'major', label: '전공' },
  { key: 'education', label: '학력' },
  { key: 'mrgSttsCd', label: '혼인 여부' },
];

// goal_type ENUM → 표시명·아이콘. GoalSelect.vue 의 GOALS 와 같은 값이다.
const GOALS = {
  INDEPENDENCE: {
    icon: '🏠',
    name: '독립',
    examples: ['보증금·월세 지원', '전세자금 대출이자 지원'],
  },
  EMPLOYMENT: {
    icon: '💼',
    name: '취업',
    examples: ['구직활동 지원', '인턴·일자리 지원'],
  },
  STARTUP: {
    icon: '🚀',
    name: '창업',
    examples: ['창업 지원금'],
  },
  MARRIAGE: {
    icon: '💍',
    name: '결혼',
    examples: ['신혼부부 전세자금 지원', '주거비 지원'],
  },
  STUDY_ABROAD: {
    icon: '✈️',
    name: '유학',
    examples: ['장학금 지원', '학자금·교육비 지원'],
  },
};

// 404 는 '미입력·미설정' 이라 오류가 아니다. 그 외 응답 오류만 문구를 띄운다.
// 401 이면 인터셉터가 로그인 화면으로 보내는 중이라 e.response 가 없다.
const loadOne = async (fn) => {
  try {
    return await fn();
  } catch (e) {
    if (e.response && e.response.status !== 404) {
      message.value = '일부 정보를 불러오지 못했어요.';
    }
    return null;
  }
};

const load = async () => {
  const [p, g, f, a] = await Promise.all([
    loadOne(() => mypageApi.getProfile()),
    loadOne(() => mypageApi.getGoal()),
    loadOne(() => mypageApi.getFavoriteBenefits()),
    loadOne(() => mypageApi.getAppliedBenefits()),
  ]);

  profile.value = p;
  goal.value = g;
  favorites.value = f ?? [];
  applied.value = a ?? [];
  isLoading.value = false;
};

onMounted(load);

const age = computed(() => {
  const raw = profile.value?.birthDate;
  if (!raw) return null;

  // 'yyyy-MM-dd' 만 넘기면 UTC 자정으로 파싱돼 KST 에서 날짜가 밀린다.
  const birth = new Date(`${raw}T00:00:00`);
  const today = new Date();

  let years = today.getFullYear() - birth.getFullYear();
  const monthGap = today.getMonth() - birth.getMonth();
  if (monthGap < 0 || (monthGap === 0 && today.getDate() < birth.getDate())) {
    years -= 1;
  }
  return years;
});

// region_name 은 '경기도 수원시 장안구' 같은 전체 이름이라 한 줄을 넘긴다.
// '도·시' 접미사를 떼는 축약은 서울특별시·세종특별자치시 같은 예외가 많아 하지 않는다.
const shortRegion = computed(() => {
  const name = profile.value?.regionName;
  return name ? name.split(' ').slice(0, 2).join(' ') : '';
});

const subTitle = computed(() =>
  [shortRegion.value, age.value == null ? '' : `만 ${age.value}세`]
    .filter(Boolean)
    .join(' · '),
);

const filledCount = computed(
  () => PROFILE_FIELDS.filter((field) => profile.value?.[field.key]).length,
);

const missingFields = computed(() =>
  PROFILE_FIELDS.filter((field) => !profile.value?.[field.key]),
);

// 받침이 있으면 '을', 없으면 '를'. '지역을' / '혼인 여부를' 처럼 갈린다.
const objectParticle = (word) => {
  const code = word.charCodeAt(word.length - 1);
  if (code < 0xac00 || code > 0xd7a3) return '를';
  return (code - 0xac00) % 28 > 0 ? '을' : '를';
};

const missingText = computed(() => {
  const names = missingFields.value.map((field) => field.label).join(', ');
  return `${names}${objectParticle(names)}`;
});

const currentGoal = computed(() => GOALS[goal.value?.goalType] ?? null);

// 목록 화면과 같은 순서로 위에서 3건만 보여준다.
// 서버가 saved_at DESC / applied_at DESC 로 정렬해 주므로 추가 정렬이 필요 없다.
const topFavorites = computed(() => favorites.value.slice(0, 3));
const topApplied = computed(() => applied.value.slice(0, 3));
</script>

<template>
  <div class="mypage-main">
    <p v-if="message" class="message">{{ message }}</p>

    <template v-if="!isLoading">
      <section class="summary">
        <div class="card-head">
          <h1 class="member-name">{{ auth.realName || auth.loginId }} 님</h1>
          <KbButton
            type="secondary"
            size="small"
            @click="router.push({ name: 'ProfileEdit' })"
          >
            수정
          </KbButton>
        </div>
        <p v-if="subTitle" class="summary-sub">{{ subTitle }}</p>
      </section>

      <section class="info-card">
        <div class="card-head">
          <h2 class="info-card-title">프로필 입력</h2>
          <span class="count">
            {{ filledCount }} / {{ PROFILE_FIELDS.length }} 항목
          </span>
        </div>

        <div class="dots">
          <span
            v-for="index in PROFILE_FIELDS.length"
            :key="index"
            :class="['dot', { on: index <= filledCount }]"
          />
        </div>

        <p v-if="missingFields.length" class="card-desc">
          {{ missingText }} 입력하면<br />
          맞춤 혜택 추천이 더 정확해져요
        </p>
        <p v-else class="card-desc">프로필을 모두 입력했어요 ✓</p>
      </section>

      <section class="info-card">
        <div class="card-head">
          <h2 class="info-card-title">
            목표<template v-if="currentGoal">
              : <span class="goal-icon">{{ currentGoal.icon }}</span>
              {{ currentGoal.name }}</template
            >
          </h2>
          <RouterLink class="link" :to="{ name: 'GoalEdit' }">
            {{ currentGoal ? '변경 ›' : '설정 ›' }}
          </RouterLink>
        </div>

        <!-- 목표 기반 추천이 들어오면 이 줄을 대체한다. -->
        <p v-if="currentGoal" class="card-desc">
          예: {{ currentGoal.examples.join(', ') }}
        </p>
        <p v-else class="card-desc">아직 목표를 정하지 않았어요</p>
      </section>

      <section class="info-card">
        <div class="card-head">
          <h2 class="info-card-title">관심 혜택 {{ favorites.length }}건</h2>
          <RouterLink class="link" :to="{ name: 'FavoriteBenefits' }">
            전체 ›
          </RouterLink>
        </div>
        <BenefitCard
          v-for="benefit in topFavorites"
          :key="benefit.benefitNo"
          :benefit="benefit"
          role="button"
          tabindex="0"
          @click="moveToDetail(benefit.benefitNo)"
          @keydown.enter="moveToDetail(benefit.benefitNo)"
        />
        <p v-if="!favorites.length" class="card-desc">
          아직 저장한 혜택이 없어요
        </p>
      </section>

      <section class="info-card">
        <div class="card-head">
          <h2 class="info-card-title">신청한 혜택 {{ applied.length }}건</h2>
          <RouterLink class="link" :to="{ name: 'AppliedBenefits' }">
            전체 ›
          </RouterLink>
        </div>
        <BenefitCard
          v-for="benefit in topApplied"
          :key="benefit.benefitNo"
          :benefit="benefit"
          role="button"
          tabindex="0"
          @click="moveToDetail(benefit.benefitNo)"
          @keydown.enter="moveToDetail(benefit.benefitNo)"
        />
        <p v-if="!applied.length" class="card-desc">
          아직 신청한 혜택이 없어요
        </p>
      </section>
    </template>
  </div>
</template>

<style scoped>
/* 탭바가 position:fixed 라 여백이 없으면 마지막 항목을 덮는다 */
.mypage-main {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-bottom: 96px;
}

.card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  margin: 0;
  font-size: 19px;
  font-weight: 700;
  color: #2e2a24;
}

.summary-sub {
  margin: 0;
  font-size: 13px;
  color: #908980;
}

.info-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 18px;
  border: 1px solid #efece4;
  border-radius: 14px;
  background: #fff;
}

.info-card-title {
  margin: 0;
  font-size: 17px;
  font-weight: 700;
  color: #2e2a24;
}

.card-desc {
  margin: 0;
  font-size: 13px;
  line-height: 1.6;
  color: #908980;
  word-break: keep-all;
}

.count {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #908980;
}

.link {
  flex-shrink: 0;
  font-size: 13px;
  font-weight: 600;
  color: #908980;
  text-decoration: none;
}

.dots {
  display: flex;
  gap: 6px;
}

.dot {
  width: 22px;
  height: 6px;
  border-radius: 3px;
  background: #efece4;
}

.dot.on {
  background: #ffbc00;
}

.message {
  margin: 0;
  font-size: 13px;
  color: #908980;
  word-break: keep-all;
}

.goal-icon {
  font-size: 20px;
}
</style>
