<template>
  <main class="benefit-main-page">
    <!-- 검색창 -->
    <button type="button" class="search-entry" @click="moveToSearch">
      <span class="search-icon">⌕</span>

      <span> 혜택을 검색해보세요 </span>
    </button>

    <!-- 추천 방식 탭 -->
    <section class="recommendation-tabs">
      <button
        v-for="tab in recommendationTabs"
        :key="tab.value"
        type="button"
        class="recommendation-tab"
        :class="{
          active: activeRecommendation === tab.value,
        }"
        @click="changeRecommendation(tab.value)"
      >
        {{ tab.label }}
      </button>
    </section>

    <!-- 현재 프로필 필터 -->
    <section
      v-if="activeRecommendation === 'condition'"
      class="profile-filter-summary"
    >
      <div class="profile-summary-header">
        <div>
          <span class="profile-summary-label"> 나의 조건에 맞는 혜택 </span>

          <strong> {{ totalCount }}건 </strong>
        </div>

        <button
          type="button"
          class="filter-button"
          @click="isFilterOpen = true"
        >
          필터
        </button>
      </div>

      <div v-if="activeFilterChips.length" class="filter-chip-list">
        <button
          v-for="chip in activeFilterChips"
          :key="chip.key"
          type="button"
          class="filter-chip"
        >
          {{ chip.label }}
        </button>
      </div>
    </section>

    <!-- 요약 : 건수 · 목표 · 추천 이유 -->
    <section
      v-if="activeRecommendation === 'goal' && !loading && hasGoalBenefits"
      class="tab-summary"
    >
      <div class="tab-summary-header">
        <span class="tab-summary-label">{{ goalName }} 목표 추천 혜택</span>

        <strong class="tab-summary-count">{{ goalTotalCount }}건</strong>
      </div>

      <p v-if="goalReason" class="tab-summary-reason">{{ goalReason }}</p>
    </section>

    <!-- 프로필 미완성 안내 배너 -->
    <button
      v-if="showProfileBanner"
      type="button"
      class="profile-completion-banner"
      @click="moveToProfile"
    >
      <div class="profile-banner-header">
        <strong>프로필 입력</strong>

        <span> {{ completedProfileCount }} / 6 항목 </span>
      </div>

      <div class="profile-progress">
        <span
          v-for="index in 6"
          :key="index"
          class="profile-progress-bar"
          :class="{
            completed: index <= completedProfileCount,
          }"
        />
      </div>

      <div class="profile-banner-bottom">
        <p>
          {{ profileGuideText }}
        </p>

        <span class="profile-arrow"> › </span>
      </div>
    </button>

    <!-- 로딩 -->
    <section v-if="loading" class="state-box">맞춤 혜택을 찾고 있어요.</section>

    <section
      v-if="!loading && activeRecommendation === 'consumption'"
      class="tab-summary"
    >
      <div class="tab-summary-header">
        <span class="tab-summary-label">소비 조건에 맞는 혜택</span>

        <strong class="tab-summary-count">{{ totalCount }}건</strong>
      </div>

      <p v-if="consumptionMessage" class="tab-summary-reason">
        {{ consumptionMessage }}
      </p>
    </section>

    <!-- 조건 탭 외 : 프로필 입력 안내 (한 줄) -->
    <button
      v-if="showProfileHint"
      type="button"
      class="profile-completion-banner profile-hint"
      @click="moveToProfile"
    >
      <div class="profile-banner-bottom">
        <p>프로필 조건을 입력하면 혜택 추천이 더 정확해져요.</p>

        <span class="profile-arrow"> › </span>
      </div>
    </button>

    <!-- 조건 기반 추천 -->
    <section
      v-if="
        !loading &&
        (activeRecommendation === 'condition' ||
          activeRecommendation === 'consumption')
      "
      class="benefit-list"
    >
      <BenefitCard
        v-for="item in benefitList"
        :key="item.benefitNo"
        :benefit="item"
        class="benefit-card-item"
        role="button"
        tabindex="0"
        @click="moveToDetail(item.benefitNo)"
        @keydown.enter="moveToDetail(item.benefitNo)"
      >
        <template #action>
          <button
            type="button"
            class="favorite-button"
            :class="{
              'is-on': favoriteNos.has(item.benefitNo),
            }"
            :aria-label="
              favoriteNos.has(item.benefitNo)
                ? '관심 혜택 해제'
                : '관심 혜택 등록'
            "
            :aria-pressed="favoriteNos.has(item.benefitNo)"
            @click.stop="toggleFavorite(item.benefitNo)"
          >
            {{ favoriteNos.has(item.benefitNo) ? '♥' : '♡' }}
          </button>
        </template>
      </BenefitCard>

      <div
        v-if="!benefitList.length && activeRecommendation === 'condition'"
        class="empty-box"
      >
        프로필 조건에 맞는 혜택이 없어요.
      </div>
    </section>

    <!-- 목표 기반 추천 -->
    <template v-if="!loading && activeRecommendation === 'goal'">
      <!-- 비로그인 -->
      <section v-if="!auth.isLogin" class="state-box goal-empty">
        <p>로그인하면 목표에 맞는 혜택을 추천해 드려요.</p>

        <KbButton @click="moveToLogin">로그인하러 가기</KbButton>
      </section>

      <!-- 조회 실패 -->
      <section v-else-if="goalError" class="state-box">
        목표 혜택을 불러오지 못했어요.
      </section>

      <!-- 목표 미설정 -->
      <section v-else-if="!goalType" class="state-box goal-empty">
        <p>아직 목표를 정하지 않았어요.</p>

        <KbButton @click="moveToGoal">목표 설정하러 가기</KbButton>
      </section>

      <!-- 목표는 있지만 조건에 맞는 혜택이 없음 -->
      <section v-else-if="!hasGoalBenefits" class="empty-box">
        목표에 맞으면서 내 조건으로 받을 수 있는 혜택이 없어요.
      </section>

      <!-- 추천 결과 -->
      <template v-else>
        <section
          v-for="section in goalSections"
          :key="section.key"
          class="goal-section"
        >
          <h2 class="goal-section-title">{{ section.title }}</h2>

          <div class="benefit-list">
            <BenefitCard
              v-for="item in section.benefits"
              :key="item.benefitNo"
              :benefit="item"
              class="benefit-card-item"
              role="button"
              tabindex="0"
              @click="moveToDetail(item.benefitNo)"
              @keydown.enter="moveToDetail(item.benefitNo)"
            >
              <template #action>
                <button
                  type="button"
                  class="favorite-button"
                  :class="{
                    'is-on': favoriteNos.has(item.benefitNo),
                  }"
                  :aria-label="
                    favoriteNos.has(item.benefitNo)
                      ? '관심 혜택 해제'
                      : '관심 혜택 등록'
                  "
                  :aria-pressed="favoriteNos.has(item.benefitNo)"
                  @click.stop="toggleFavorite(item.benefitNo)"
                >
                  {{ favoriteNos.has(item.benefitNo) ? '♥' : '♡' }}
                </button>
              </template>
            </BenefitCard>
          </div>

          <button
            v-if="section.hasMore"
            type="button"
            class="goal-more-button"
            @click="showMoreGoalBenefits(section.key)"
          >
            더 보기
          </button>
        </section>
      </template>
    </template>

    <!-- 기존 필터 모달 재사용 -->
    <BenefitFilterModal
      v-model="isFilterOpen"
      :category-code="filter.categoryCode"
      :category-name="filter.categoryName"
      :province-code="filter.provinceCode"
      :province-name="filter.provinceName"
      :city-code="filter.cityCode"
      :city-name="filter.cityName"
      :district-code="filter.districtCode"
      :district-name="filter.districtName"
      :plcy-major-cd="filter.plcyMajorCd"
      :major-name="filter.majorName"
      :school-cd="filter.schoolCd"
      :school-name="filter.schoolName"
      :job-cd="filter.jobCd"
      :job-name="filter.jobName"
      :mrg-stts-cd="filter.mrgSttsCd"
      :marriage-name="filter.marriageName"
      :age="filter.age"
      @apply="handleApplyFilter"
    />
  </main>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue';

import { useRoute, useRouter } from 'vue-router';

import {
  getBenefit,
  getBenefitGoalRecommend,
  getBenefitProfileFilter,
  getConsumptionRecommendedBenefits,
} from '@/api/benefitApi';

import BenefitCard from '@/components/benefit/BenefitCard.vue';
import KbButton from '@/components/common/KbButton.vue';

import BenefitFilterModal from '@/components/benefit/BenefitFilterModal.vue';
import mypageApi from '@/api/mypageApi';
import { useAuthStore } from '@/stores/auth';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const consumptionMessage = ref('');

const recommendationTabs = [
  {
    label: '조건 기반 추천',
    value: 'condition',
  },
  {
    label: '소비 기반 추천',
    value: 'consumption',
  },
  {
    label: '목표 기반 추천',
    value: 'goal',
  },
];

const validTabs = ['condition', 'consumption', 'goal'];

const getTabFromRoute = () => {
  const tab = route.query.tab;

  return validTabs.includes(tab) ? tab : 'condition';
};

const activeRecommendation = ref(getTabFromRoute());

const isFilterOpen = ref(false);
const loading = ref(false);

const conditionBenefits = ref([]);
const conditionTotalCount = ref(0);

const consumptionBenefits = ref([]);
const consumptionTotalCount = ref(0);

const benefitList = computed(() => {
  if (activeRecommendation.value === 'consumption') {
    return consumptionBenefits.value;
  }

  if (activeRecommendation.value === 'condition') {
    return conditionBenefits.value;
  }

  return [];
});

const totalCount = computed(() => {
  if (activeRecommendation.value === 'consumption') {
    return consumptionTotalCount.value;
  }

  if (activeRecommendation.value === 'condition') {
    return conditionTotalCount.value;
  }

  return 0;
});
const favoriteNos = ref(new Set());
const pendingNos = ref(new Set());
/*
 * 프로필 배너 판정용. filter 와 따로 둔다.
 * filter 는 사용자가 필터 모달에서 직접 바꾸는 값이라
 * 프로필 입력 여부의 근거로 쓸 수 없다.
 */
const memberProfile = ref(null);

// 프로필 기본 필터는 한 번만 건다. 두 번 걸면 사용자가 모달에서 고친 값이 덮인다
const profileFilterApplied = ref(false);

// 조회를 시도했는지. 응답 전에 배너가 0/6 으로 깜빡이는 것을 막는다
const profileLoaded = ref(false);

/*
 * 목표 기반 추천
 *
 * 섹션 정의를 배열로 둔다. 나중에 "한 목록으로 합치자"가 되면
 * 이 배열을 하나로 줄이고 로드에서 두 응답을 이어 붙이면 끝난다.
 * 카드 렌더링·하트·상세 이동은 손대지 않는다.
 */
const GOAL_SECTIONS = [
  {
    key: 'primary',
    title: '목표에 딱 맞는 혜택',
  },
  {
    key: 'secondary',
    title: '함께 보면 좋은 혜택',
  },
];

// 처음 보여 줄 건수. "더 보기"를 누를 때마다 이만큼 늘린다
const GOAL_PAGE_SIZE = 20;
/*
 * goal_type ENUM → 표시명.
 * GoalSelect.vue 의 GOALS · MyPage.vue 의 GOALS 와 같은 값이고,
 * 여기서는 이름만 쓰므로 아이콘·예시는 두지 않는다.
 */
const GOAL_NAMES = {
  INDEPENDENCE: '독립',
  EMPLOYMENT: '취업',
  STARTUP: '창업',
  MARRIAGE: '결혼',
  STUDY_ABROAD: '유학',
};

const goalType = ref(null);
const goalError = ref(false);

const goalGroups = reactive({
  primary: {
    benefits: [],
    visibleCount: GOAL_PAGE_SIZE,
  },

  secondary: {
    benefits: [],
    visibleCount: GOAL_PAGE_SIZE,
  },
});
/*
 * 섹션별로 백엔드가 좁힌 중분류 이름. 칩과 설명 문구에 쓴다.
 *
 * goalGroups 에 합치지 않는다.
 * goalSections 는 결과 0건인 섹션을 filter 로 걸러 내는데,
 * 칩·설명은 매핑 기준이라 결과가 0건이어도 이름은 떠야 한다.
 */
const goalCategories = reactive({
  primary: [],
  secondary: [],
});

const goalSections = computed(() =>
  GOAL_SECTIONS.map((section) => {
    const group = goalGroups[section.key];

    return {
      key: section.key,
      title: section.title,
      benefits: group.benefits.slice(0, group.visibleCount),
      hasMore: group.benefits.length > group.visibleCount,
    };
  }).filter((section) => section.benefits.length),
);

const hasGoalBenefits = computed(() => goalSections.value.length > 0);

// setGoalGroup 이 CLOSED 를 이미 걸렀으므로 실제로 보이는 건수와 같다
const goalTotalCount = computed(() =>
  GOAL_SECTIONS.reduce(
    (sum, { key }) => sum + goalGroups[key].benefits.length,
    0,
  ),
);

const goalName = computed(() => GOAL_NAMES[goalType.value] || '');

const goalReason = computed(() => {
  const { primary, secondary } = goalCategories;

  if (!goalName.value || !primary.length) {
    return '';
  }

  const primaryText = `${goalName.value} 목표에 맞춰 ${primary.join('·')} 혜택을`;

  if (!secondary.length) {
    return `${primaryText} 추천했어요.`;
  }

  return `${primaryText} 먼저 보여드리고, ${secondary.join('·')} 혜택을 함께 추천했어요.`;
});

const filter = reactive({
  // 카테고리는 기본 전체
  categoryCode: '',
  categoryName: '전체',

  provinceCode: '',
  provinceName: '전국',

  cityCode: '',
  cityName: '',

  districtCode: '',
  districtName: '',

  plcyMajorCd: '',
  majorName: '전체',

  schoolCd: '',
  schoolName: '전체',

  jobCd: '',
  jobName: '전체',

  mrgSttsCd: '',
  marriageName: '전체',

  age: null,
});

const apiParams = computed(() => {
  /*
   * 지역은 현재 프로필의 region_code를
   * provinceCode에 저장하는 구조다.
   */
  const zipCd =
    filter.districtCode || filter.cityCode || filter.provinceCode || undefined;

  return {
    categoryCode: filter.categoryCode || undefined,

    zipCd,

    plcyMajorCd: filter.plcyMajorCd || undefined,

    schoolCd: filter.schoolCd || undefined,

    jobCd: filter.jobCd || undefined,

    mrgSttsCd: filter.mrgSttsCd || undefined,

    age: filter.age ?? undefined,
  };
});

const selectedRegionLabel = computed(() => {
  return [filter.provinceName, filter.cityName, filter.districtName]
    .filter(Boolean)
    .join(' ');
});

const activeFilterChips = computed(() => {
  const chips = [];

  // 지역
  if (selectedRegionLabel.value && selectedRegionLabel.value !== '전국') {
    chips.push({
      key: 'region',
      label: selectedRegionLabel.value,
    });
  }

  if (filter.age !== null && filter.age !== undefined && filter.age !== '') {
    chips.push({
      key: 'age',
      label: `만 ${filter.age}세`,
    });
  }

  if (filter.majorName && filter.majorName !== '전체') {
    chips.push({
      key: 'major',
      label: filter.majorName,
    });
  }

  if (filter.schoolName && filter.schoolName !== '전체') {
    chips.push({
      key: 'school',
      label: filter.schoolName,
    });
  }

  if (filter.jobName && filter.jobName !== '전체') {
    chips.push({
      key: 'job',
      label: filter.jobName,
    });
  }

  if (filter.marriageName && filter.marriageName !== '전체') {
    chips.push({
      key: 'marriage',
      label: filter.marriageName,
    });
  }

  return chips;
});

const profileItems = computed(() => {
  const profile = memberProfile.value;

  return [
    {
      label: '거주지역',
      completed: !!profile?.provinceCode,
    },
    {
      label: '나이',
      completed: profile?.age != null,
    },
    {
      label: '전공',
      completed: !!profile?.plcyMajorCd,
    },
    {
      label: '학력',
      completed: !!profile?.schoolCd,
    },
    {
      label: '취업상태',
      completed: !!profile?.jobCd,
    },
    {
      label: '혼인 여부',
      completed: !!profile?.mrgSttsCd,
    },
  ];
});

const completedProfileCount = computed(
  () => profileItems.value.filter((item) => item.completed).length,
);

const isProfileComplete = computed(() => completedProfileCount.value === 6);

const missingProfileLabels = computed(() =>
  profileItems.value
    .filter((item) => !item.completed)
    .map((item) => item.label),
);

const profileGuideText = computed(() => {
  if (!missingProfileLabels.value.length) {
    return '프로필을 모두 입력했어요.';
  }

  return `${missingProfileLabels.value.join(
    ', ',
  )}을 입력하면 맞춤 혜택 추천이 더 정확해져요.`;
});

const moveToProfile = () => {
  router.push('/mypage/profile');
};

const applyProfileFilter = (profile) => {
  /*
   * 프로필 region_code가
   * 41000처럼 시도 단위이므로
   * provinceCode에 설정한다.
   */
  filter.provinceCode = profile.provinceCode || profile.zipCd || '';

  filter.provinceName = profile.provinceName || profile.regionName || '전국';

  filter.cityCode = profile.cityCode || '';

  filter.cityName = profile.cityName || '';

  filter.districtCode = profile.districtCode || '';

  filter.districtName = profile.districtName || '';

  filter.age = profile.age ?? null;

  filter.plcyMajorCd = profile.plcyMajorCd || '';

  filter.majorName = profile.majorName || '전체';

  filter.schoolCd = profile.schoolCd || '';

  filter.schoolName = profile.schoolName || '전체';

  filter.jobCd = profile.jobCd || '';

  filter.jobName = profile.jobName || '전체';

  filter.mrgSttsCd = profile.mrgSttsCd || '';

  filter.marriageName = profile.marriageName || '전체';

  filter.categoryCode = '';
  filter.categoryName = '전체';
};

const loadBenefits = async () => {
  loading.value = true;

  try {
    const response = await getBenefit(apiParams.value);

    const benefits = Array.isArray(response)
      ? response
      : response.content || response.list || response.benefits || [];

    const activeBenefits = benefits.filter(
      (item) => item.benefitStatus !== 'CLOSED',
    );

    conditionBenefits.value = activeBenefits;

    conditionTotalCount.value = activeBenefits.length;
  } catch (error) {
    console.error('맞춤 혜택 조회 실패:', error);

    conditionBenefits.value = [];
    conditionTotalCount.value = 0;
  } finally {
    loading.value = false;
  }
};

const loadMemberProfile = async () => {
  if (!auth.isLogin) {
    memberProfile.value = null;
    profileLoaded.value = true;

    return null;
  }

  try {
    const profile = await getBenefitProfileFilter();

    memberProfile.value = profile;

    return profile;
  } catch (error) {
    /*
     * 프로필 미입력이면 404 다.
     * 오류가 아니라 '아직 안 채운 상태'로 다뤄 배너가 뜨게 둔다.
     */
    console.error('프로필 기본 필터 조회 실패:', error);

    memberProfile.value = null;

    return null;
  } finally {
    profileLoaded.value = true;
  }
};

const ensureProfileFilter = async () => {
  // 마운트 중에 프로필이 바뀔 일이 없으므로 한 번만 받는다
  const profile = profileLoaded.value
    ? memberProfile.value
    : await loadMemberProfile();

  /*
   * 기본 필터는 한 번만 건다.
   * 두 번 걸면 사용자가 필터 모달에서 고친 값이 조용히 덮인다.
   */
  if (profile && !profileFilterApplied.value) {
    applyProfileFilter(profile);

    profileFilterApplied.value = true;
  }
};

const loadProfileRecommendation = async () => {
  loading.value = true;

  try {
    await ensureProfileFilter();

    await loadBenefits();
  } finally {
    loading.value = false;
  }
};

const setGoalGroup = (key, benefits) => {
  /*
   * 조건 기반 탭과 같은 규칙으로 마감 혜택은 뺀다.
   * 상한 안에 마감이 섞여 오면 그만큼 줄어든다.
   */
  goalGroups[key].benefits = (benefits || []).filter(
    (item) => item.benefitStatus !== 'CLOSED',
  );

  goalGroups[key].visibleCount = GOAL_PAGE_SIZE;
};

const resetGoalGroups = () => {
  setGoalGroup('primary', []);
  setGoalGroup('secondary', []);

  goalCategories.primary = [];
  goalCategories.secondary = [];
};

const loadGoalRecommendation = async () => {
  goalError.value = false;

  /*
   * 🔴 비로그인 가드 필수.
   * 401 을 받으면 인터셉터가 로그인 화면으로 튕긴다.
   */
  if (!auth.isLogin) {
    goalType.value = null;

    resetGoalGroups();

    return;
  }

  loading.value = true;

  try {
    // 배너 판정에 필요하다. 목표 탭도 프로필로 걸러진 결과를 보여 준다
    await loadMemberProfile();

    const data = await getBenefitGoalRecommend();

    goalType.value = data.goalType || null;

    /*
     * 응답 키가 GOAL_SECTIONS 의 key 와 같아 그대로 돈다.
     * { goalType, primary: { categories, benefits }, secondary: { ... } }
     */
    GOAL_SECTIONS.forEach(({ key }) => {
      const section = data[key] || {};

      setGoalGroup(key, section.benefits);

      goalCategories[key] = section.categories || [];
    });
  } catch (error) {
    console.error('목표 기반 추천 조회 실패:', error);

    /*
     * 실패를 '목표 미설정' 으로 보이게 하면 안 된다.
     * 이미 목표를 정한 사람에게 목표를 정하라고 안내하게 된다.
     */
    goalError.value = true;

    goalType.value = null;

    resetGoalGroups();
  } finally {
    loading.value = false;
  }
};

const showMoreGoalBenefits = (key) => {
  goalGroups[key].visibleCount += GOAL_PAGE_SIZE;
};

const moveToGoal = () => {
  router.push('/mypage/goal');
};

const moveToLogin = () => {
  router.push({
    name: 'Login',
  });
};

// 프로필이 덜 찼고 안내를 띄울 수 있는 상태인지. 표시 형태는 탭별로 가른다
const needsProfileGuide = computed(
  () => auth.isLogin && profileLoaded.value && !isProfileComplete.value,
);

const showProfileBanner = computed(
  () => needsProfileGuide.value && activeRecommendation.value === 'condition',
);

/*
 * 목표 탭은 진행바 배너 대신 한 줄 안내만 띄운다.
 * 요약 블록(건수·추천 이유·칩) 위에 배너까지 쌓이면
 * 정작 혜택 카드가 첫 화면 밖으로 밀린다.
 *
 * 목표가 없으면 목표 설정 CTA 가 먼저다 — 한 화면에 CTA 는 하나.
 */
/*
 * 조건 탭 외에는 진행바 배너 대신 한 줄 안내만 띄운다.
 * 요약 블록 위에 배너까지 쌓이면 정작 혜택 카드가 첫 화면 밖으로 밀린다.
 *
 * 목표 탭은 목표가 없을 때 숨긴다 — 목표 설정 CTA 가 먼저다. 한 화면에 CTA 는 하나.
 */
const showProfileHint = computed(() => {
  if (!needsProfileGuide.value || loading.value) {
    return false;
  }

  if (activeRecommendation.value === 'consumption') {
    return true;
  }

  return activeRecommendation.value === 'goal' && !!goalType.value;
});

const loadFavorites = async () => {
  if (!auth.isLogin) return;

  try {
    const list = await mypageApi.getFavoriteBenefits();

    favoriteNos.value = new Set(list.map((item) => item.benefitNo));
  } catch (error) {
    favoriteNos.value = new Set();

    console.error('관심 혜택 조회 실패:', error);
  }
};

const handleApplyFilter = async (appliedFilter) => {
  Object.assign(filter, appliedFilter);

  if (filter.age === '') {
    filter.age = null;
  }

  isFilterOpen.value = false;

  await loadBenefits();
};

const changeRecommendation = async (type) => {
  await router.replace({
    query: {
      ...route.query,
      tab: type,
    },
  });
};

watch(
  () => route.query.tab,

  async (newTab) => {
    const tab = validTabs.includes(newTab) ? newTab : 'condition';

    activeRecommendation.value = tab;

    if (tab === 'condition') {
      await loadProfileRecommendation();
      return;
    }

    if (tab === 'consumption') {
      await loadConsumptionRecommendation();
      return;
    }

    if (tab === 'goal') {
      await loadGoalRecommendation();
      return;
    }
  },
);

const moveToSearch = () => {
  router.push({
    name: 'BenefitSearch',
  });
};

const moveToDetail = (benefitNo) => {
  router.push({
    name: 'benefit-detail',
    params: {
      benefitNo,
    },
  });
};

const toggleFavorite = async (benefitNo) => {
  if (pendingNos.value.has(benefitNo)) {
    return;
  }

  pendingNos.value.add(benefitNo);

  const wasFavorite = favoriteNos.value.has(benefitNo);

  // 화면의 하트를 먼저 변경
  if (wasFavorite) {
    favoriteNos.value.delete(benefitNo);
  } else {
    favoriteNos.value.add(benefitNo);
  }

  try {
    if (wasFavorite) {
      await mypageApi.deleteFavoriteBenefit(benefitNo);
    } else {
      await mypageApi.createFavoriteBenefit(benefitNo);
    }
  } catch (error) {
    // 삭제 요청의 404는 이미 삭제된 상태이므로 그대로 둠
    if (error.response?.status !== 404) {
      // API 실패 시 하트 원상복구
      if (wasFavorite) {
        favoriteNos.value.add(benefitNo);
      } else {
        favoriteNos.value.delete(benefitNo);
      }
    }

    console.error('관심 혜택 변경 실패:', error);
  } finally {
    pendingNos.value.delete(benefitNo);
  }
};

//소비기반 추천함수
const loadConsumptionRecommendation = async () => {
  loading.value = true;

  try {
    // 소비기반도 프로필 기본값 준비
    await ensureProfileFilter();

    const response = await getConsumptionRecommendedBenefits(apiParams.value);

    const benefits = Array.isArray(response?.benefits) ? response.benefits : [];

    consumptionBenefits.value = benefits.filter(
      (item) => item.benefitStatus !== 'CLOSED',
    );

    consumptionTotalCount.value = consumptionBenefits.value.length;

    consumptionMessage.value = response?.message || '';
  } catch (error) {
    console.error('소비 기반 추천 조회 실패:', error);

    consumptionBenefits.value = [];
    consumptionTotalCount.value = 0;

    consumptionMessage.value = '소비 기반 추천을 불러오지 못했어요.';
  } finally {
    loading.value = false;
  }
};

onMounted(async () => {
  await loadFavorites();

  const tab = getTabFromRoute();

  activeRecommendation.value = tab;

  if (tab === 'condition') {
    await loadProfileRecommendation();
    return;
  }

  if (tab === 'consumption') {
    await loadConsumptionRecommendation();
    return;
  }

  if (tab === 'goal') {
    await loadGoalRecommendation();
  }
});
</script>

<style scoped>
.benefit-main-page {
  min-height: 100%;
  padding: 20px 18px 110px;
  background: #ffffff;
  color: #2e2a24;
}

.search-entry {
  display: flex;
  align-items: center;
  width: 100%;
  height: 50px;
  padding: 0 16px;
  border: 0;
  border-radius: 16px;
  background: #f4f1eb;
  color: #9b958c;
  font-size: 14px;
  text-align: left;
  cursor: pointer;
}

.search-icon {
  margin-right: 10px;
  color: #4f4941;
}

.recommendation-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 5px;
  margin-top: 14px;
  padding: 5px;
  border-radius: 11px;
  background: #f0f1f3;
}

.recommendation-tab {
  min-height: 36px;
  padding: 0 6px;
  border: 0;
  border-radius: 8px;
  background: transparent;
  color: #99948b;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.recommendation-tab.active {
  background: #ffffff;
  color: #312d27;
  box-shadow: 0 2px 8px rgba(55, 50, 43, 0.1);
}

.profile-filter-summary {
  margin-top: 14px;
}

.profile-summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-summary-header > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.profile-summary-label {
  color: #8b847b;
  font-size: 12px;
}

.profile-summary-header strong {
  font-size: 17px;
}

.filter-button {
  min-width: 52px;
  height: 36px;
  padding: 0 15px;
  border: 0;
  border-radius: 18px;
  background: #ffbc00;
  color: #2e2a24;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
}

.filter-chip-list {
  display: flex;
  gap: 8px;
  margin-top: 12px;
  padding-bottom: 3px;
  overflow-x: auto;
  scrollbar-width: none;
}

.filter-chip-list::-webkit-scrollbar {
  display: none;
}

.filter-chip {
  flex-shrink: 0;
  height: 32px;
  padding: 0 13px;
  border: 1px solid #e3ddd2;
  border-radius: 17px;
  background: #fffaf0;
  color: #675f55;
  font-size: 11px;
  cursor: pointer;
}

.benefit-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
  margin-top: 15px;
}

.benefit-card-item {
  cursor: pointer;
}

.favorite-button {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  padding: 0;
  border: 0;
  background: transparent;
  color: #6f685f;
  font-size: 26px;
  cursor: pointer;
}
.favorite-button.is-on {
  color: #d64545;
}

.state-box,
.empty-box {
  padding: 80px 20px;
  color: #928b82;
  font-size: 14px;
  line-height: 1.6;
  text-align: center;
}

.profile-completion-banner {
  width: 100%;
  margin-top: 14px;
  padding: 16px;
  border: 1px solid #f3b400;
  border-radius: 16px;
  background: #fffdf7;
  color: #2e2a24;
  text-align: left;
  cursor: pointer;
}

.profile-banner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.profile-banner-header strong {
  font-size: 14px;
  font-weight: 700;
}

.profile-banner-header span {
  color: #756f67;
  font-size: 11px;
}

.profile-progress {
  display: flex;
  gap: 5px;
  margin-top: 10px;
}

.profile-progress-bar {
  width: 24px;
  height: 5px;
  border-radius: 3px;
  background: #ebe8e1;
}

.profile-progress-bar.completed {
  background: #f5b400;
}

.profile-banner-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-top: 10px;
}

.profile-banner-bottom p {
  margin: 0;
  color: #827b72;
  font-size: 11px;
  line-height: 1.6;
}

.profile-arrow {
  flex-shrink: 0;
  color: #b0a89e;
  font-size: 20px;
}

/*
   * 목표 탭 전용. 조건 탭 배너에서 진행바와 n/6 을 뺀 한 줄짜리다.
   * 껍데기는 .profile-completion-banner 를 그대로 쓰고 여백·글자만 덮는다.
*/
.profile-hint {
  margin-top: 10px;
  padding: 12px 16px;
}

/* 진행바가 사라졌으므로 위 여백이 필요 없다 */
.profile-hint .profile-banner-bottom {
  margin-top: 0;
}

/* 이제 배너의 유일한 내용이라 11px·연회색은 너무 묻힌다 */
.profile-hint .profile-banner-bottom p {
  color: #2e2a24;
  font-size: 13px;
  line-height: 1.4;
  word-break: keep-all;
}

.profile-hint .profile-arrow {
  font-size: 16px;
  line-height: 1;
}

.tab-summary {
  margin-top: 14px;
}

.tab-summary-header {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.tab-summary-label {
  color: #8b847b;
  font-size: 12px;
}

.tab-summary-count {
  color: #2e2a24;
  font-size: 17px;
  font-weight: 750;
}

.tab-summary-reason {
  margin: 12px 0 0;
  padding: 14px 16px;
  border: 1px solid #f3b400;
  border-radius: 16px;
  background: #fffdf7;
  color: #2e2a24;
  font-size: 13px;
  line-height: 1.6;
  word-break: keep-all; /* 한글을 음절이 아니라 어절 단위로 끊는다*/
}

.goal-section {
  margin-top: 24px;
}

.goal-section-title {
  margin: 0 0 12px;
  font-size: 16px;
  font-weight: 700;
}

.goal-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.goal-more-button {
  width: 100%;
  margin-top: 12px;
  padding: 12px;
  border: 1px solid #e5e5e5;
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}
</style>
