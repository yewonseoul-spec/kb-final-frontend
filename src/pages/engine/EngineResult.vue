<template>
  <div class="container py-4">

    <!-- 로딩 -->
    <div v-if="loading" class="text-center py-5">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">로딩 중</span>
      </div>
      <p class="mt-2 text-muted small">추천 결과를 분석하는 중...</p>
    </div>

    <!-- 에러 -->
    <div v-else-if="error" class="alert alert-danger">{{ error }}</div>

    <!-- 프로필 미입력 -->
    <div v-else-if="isProfileRequired" class="card text-center py-5">
      <div class="card-body">
        <div class="fs-1 mb-3">📋</div>
        <h5 class="fw-bold">프로필을 먼저 입력해주세요</h5>
        <p class="text-muted mb-3">추천을 받으려면 아래 정보가 필요합니다.</p>
        <ul class="list-unstyled mb-4">
          <li v-for="f in result.missingFields" :key="f" class="text-danger small">
            · {{ fieldLabel(f) }}
          </li>
        </ul>
        <a href="/mypage" class="btn btn-primary">프로필 입력하러 가기</a>
      </div>
    </div>

    <!-- 정상 결과 -->
    <div v-else-if="isOk">

      <!-- 상단 요약 -->
      <div class="mb-4">
        <h5 class="fw-bold mb-1">내 맞춤 혜택 조합</h5>
        <p class="text-muted small mb-3">
          {{ result.benefits.length }}개 자격조건 통과 정책 중 상위 {{ result.topBenefits.length }}개 후보에서
          중복수혜 없는 최적 조합을 선별했습니다.
        </p>
        <div class="row g-2" v-if="combination">
          <div class="col-6 col-md-3">
            <div class="card border-0 bg-light text-center py-3">
              <div class="fs-3 fw-bold text-primary">{{ combination.benefits.length }}</div>
              <div class="small text-muted">추천 정책 수</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card border-0 bg-light text-center py-3">
              <div class="fs-3 fw-bold text-primary">{{ combination.distinctCategoryCount }}</div>
              <div class="small text-muted">생활 영역 수</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card border-0 bg-light text-center py-3">
              <div class="fs-3 fw-bold"
                   :class="allWarningCount > 0 ? 'text-warning' : 'text-success'">
                {{ allWarningCount > 0 ? allWarningCount + '건' : '없음' }}
              </div>
              <div class="small text-muted">수혜 주의 경고</div>
            </div>
          </div>
          <div class="col-6 col-md-3">
            <div class="card border-0 bg-light text-center py-3">
              <div class="fs-3 fw-bold text-primary">{{ combination.averageScore.toFixed(0) }}</div>
              <div class="small text-muted">평균 적합도</div>
            </div>
          </div>
        </div>
      </div>

      <!-- 경고 -->
      <div v-if="result.warnings.length > 0 || result.externalWarnings.length > 0" class="mb-4">
        <h6 class="fw-bold mb-2">⚠️ 중복수혜 확인 사항</h6>
        <div v-for="w in result.warnings" :key="'w-' + w.benefitNo"
             class="alert alert-warning py-2 mb-2 small">
          <span class="badge bg-warning text-dark me-2">{{ w.conflictType }}</span>
          <strong>{{ w.plcyNm }}</strong> — {{ w.ruleText }}
        </div>
        <div v-for="w in result.externalWarnings" :key="'ew-' + w.benefitNo"
             class="alert alert-info py-2 mb-2 small">
          <span class="badge bg-info text-dark me-2">외부 제도</span>
          <strong>{{ w.plcyNm }}</strong> — {{ w.ruleText }}
        </div>
      </div>

      <!-- 추천 조합 카드 -->
      <div v-if="combination" class="mb-4">
        <h6 class="fw-bold mb-3">추천 정책 {{ combination.benefits.length }}개</h6>
        <div class="row g-3">
          <div class="col-12 col-md-4"
               v-for="b in combination.benefits" :key="b.benefitNo">
            <div class="card h-100">
              <div class="card-body d-flex flex-column">
                <div class="mb-2">
                  <span class="badge bg-secondary me-1">{{ categoryName(b.categoryCode) }}</span>
                  <span v-if="warningFor(b.benefitNo)"
                        class="badge bg-warning text-dark">{{ warningFor(b.benefitNo).conflictType }}</span>
                </div>
                <h6 class="card-title fw-bold">{{ b.plcyNm }}</h6>
                <ul class="list-unstyled small text-muted flex-grow-1">
                  <li>📅 {{ deadlineText(b) }}</li>
                  <li>💰 {{ incomeText(b) }}</li>
                  <li v-if="b.earnCndSeCd === '0043003' && b.earnEtcCn"
                      class="text-warning small">
                    ※ {{ b.earnEtcCn }}
                  </li>
                  <li v-if="warningFor(b.benefitNo)" class="text-warning mt-1">
                    ⚠️ {{ warningFor(b.benefitNo).ruleText }}
                  </li>
                </ul>
                <!-- 조건 상세 접기/펼치기 -->
                <div class="mt-2">
                  <button class="btn btn-link btn-sm p-0 text-muted text-decoration-none"
                          @click="toggleDetail(b.benefitNo)">
                    {{ openDetails[b.benefitNo] ? '접기 ▲' : '조건 상세 보기 ▼' }}
                  </button>
                  <ul v-if="openDetails[b.benefitNo]"
                      class="list-unstyled small mt-2 mb-0 ps-1">
                    <li v-for="d in b.scoreDetail" :key="d" class="text-muted py-1 border-bottom">
                      {{ d }}
                    </li>
                  </ul>
                </div>
              </div>
              <div class="card-footer bg-transparent d-flex justify-content-between align-items-center">
                <span class="small text-muted">적합도 {{ b.score }}점</span>
                <a v-if="b.plcyNo"
                   :href="`https://www.youthcenter.go.kr/gourde/details.do?plcyNo=${b.plcyNo}`"
                   target="_blank" rel="noopener"
                   class="btn btn-sm btn-outline-primary">신청하기</a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 상위 후보 접기/펼치기 -->
      <div>
        <button class="btn btn-outline-secondary btn-sm mb-3"
                @click="showAllCandidates = !showAllCandidates">
          {{ showAllCandidates
             ? '후보 목록 접기 ▲'
             : `다른 상위 후보 보기 (${result.topBenefits.length}건) ▼` }}
        </button>
        <div v-if="showAllCandidates" class="row g-2">
          <div class="col-12 col-sm-6 col-md-4"
               v-for="b in result.topBenefits" :key="b.benefitNo">
            <div class="card border-0 bg-light h-100">
              <div class="card-body py-2 px-3">
                <div class="mb-1">
                  <span class="badge bg-light text-muted border small">
                    {{ categoryName(b.categoryCode) }}
                  </span>
                </div>
                <p class="mb-1 small fw-bold">{{ b.plcyNm }}</p>
                <p class="mb-0 small text-muted">{{ deadlineText(b) }} · 적합도 {{ b.score }}점</p>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
import axios from 'axios';

// TODO: 재훈님 JWT 합의 후 store에서 꺼내는 방식으로 교체
const MEMBER_NO = 2;

const CATEGORY = {
  '1': '일자리', '2': '주거', '3': '교육', '4': '복지·문화', '5': '참여·권리',
};

const FIELD_LABEL = {
  birthDate: '생년월일',
  regionCode: '거주 지역',
  income: '소득',
  employStatus: '취업 상태',
  major: '전공',
  education: '학력',
  mrgSttsCd: '혼인 상태',
};

export default {
  name: 'EngineResult',

  data() {
    return {
      loading: false,
      result: null,
      error: null,
      showAllCandidates: false,
      openDetails: {},
    };
  },

  computed: {
    isProfileRequired() {
      return this.result?.status === 'PROFILE_REQUIRED';
    },
    isOk() {
      return this.result?.status === 'OK';
    },
    combination() {
      return this.result?.recommendedCombinations?.[0] || null;
    },
    allWarningCount() {
      return (this.result?.warnings?.length || 0) + (this.result?.externalWarnings?.length || 0);
    },
  },

  methods: {
    async loadResult() {
      this.loading = true;
      this.error = null;
      try {
        const { data } = await axios.get(`/api/engine/benefits/${MEMBER_NO}`);
        this.result = data;
      } catch (e) {
        this.error = '추천 결과를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.';
      } finally {
        this.loading = false;
      }
    },

    categoryName(code) {
      return CATEGORY[code] || '기타';
    },

    fieldLabel(f) {
      return FIELD_LABEL[f] || f;
    },

    deadlineText(b) {
      if (!b.applyEndDate) return '상시 모집';
      const d = new Date(b.applyEndDate);
      const diff = Math.ceil((d - Date.now()) / 86400000);
      const str = `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
      if (diff <= 0) return `마감 (${str})`;
      if (diff <= 30) return `D-${diff} 마감 (${str})`;
      return `~${str}`;
    },

    incomeText(b) {
      if (b.earnCndSeCd === '0043001') return '소득 조건 없음';
      if (b.earnCndSeCd === '0043002') return '소득 기준 충족 확인';
      if (b.earnCndSeCd === '0043003') return '소득 조건 별도 확인 필요';
      return '';
    },

    warningFor(benefitNo) {
      return this.result?.warnings?.find(w => w.benefitNo === benefitNo) || null;
    },

    toggleDetail(benefitNo) {
      this.openDetails = {
        ...this.openDetails,
        [benefitNo]: !this.openDetails[benefitNo],
      };
    },
  },

  mounted() {
    this.loadResult();
  },
};
</script>