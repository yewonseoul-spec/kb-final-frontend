<template>
  <div>
    <div class="mb-4">
      <h4 class="mb-1 fw-bold">혜택 관리</h4>
      <small class="text-muted">온통청년에서 수집한 청년혜택을 조회하고 노출 상태를 관리합니다.</small>
    </div>

    <!-- 필터 -->
    <div class="card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="row g-3 align-items-end">
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">혜택명</label>
            <input v-model="filters.keyword" type="text" placeholder="혜택명 검색"
                   class="form-control form-control-sm" style="width:260px"
                   @keyup.enter="search" />
          </div>

          <div class="col-auto">
            <button class="btn btn-sm btn-dark px-4" @click="search">조회</button>
            <button class="btn btn-sm btn-outline-secondary" @click="resetFilters">초기화</button>
          </div>
        </div>

        <hr class="my-3" />

        <div class="d-flex flex-wrap gap-4">
          <div>
            <div class="small text-muted mb-1">노출 상태</div>
            <div class="btn-group btn-group-sm">
              <button v-for="opt in activeOptions" :key="opt.value"
                      class="btn"
                      :class="filters.isActive === opt.value ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectActive(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">카테고리</div>
            <div class="btn-group btn-group-sm">
              <button v-for="opt in categoryOptions" :key="opt.value"
                      class="btn"
                      :class="filters.categoryCode === opt.value ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectCategory(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">마감</div>
            <div class="btn-group btn-group-sm">
              <button class="btn"
                      :class="!filters.deadlineSoon ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectDeadline(false)">전체</button>
              <button class="btn"
                      :class="filters.deadlineSoon ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectDeadline(true)">30일 이내</button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">중복수혜</div>
            <div class="btn-group btn-group-sm">
              <button class="btn"
                      :class="!filters.hasConflict ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectConflict(false)">전체</button>
              <button class="btn"
                      :class="filters.hasConflict ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectConflict(true)">관리 대상</button>
            </div>
          </div>

          <div>
            <div class="small text-muted mb-1">관리자 지정</div>
            <div class="btn-group btn-group-sm">
              <button class="btn"
                      :class="!filters.adminManagedOnly ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectAdminManaged(false)">전체</button>
              <button class="btn"
                      :class="filters.adminManagedOnly ? 'btn-dark' : 'btn-outline-secondary'"
                      @click="selectAdminManaged(true)">지정한 것만</button>
            </div>
          </div>
        </div>

        <!--
          배지 뜻풀이. 중복수혜 필터를 켰을 때만 보여준다.
          평소에는 표에 잘 안 걸리는 정보라 항상 띄우면 화면만 복잡해진다.
        -->
        <div v-if="filters.hasConflict" class="rule-legend mt-3">
          <span class="badge rule rule-group">G01</span> 같은 묶음의 혜택은 하나만 받을 수 있음
          <span class="sep">·</span>
          <span class="badge rule rule-pair">개별</span> 엔진이 후보에서 빼거나 감점함
          <span class="sep">·</span>
          <span class="badge rule rule-external">외부</span> 우리 DB에 없는 제도라 안내만 함
          <span class="sep">·</span>
          <span class="badge rule rule-review">검수</span> 아직 확인 전이라 엔진이 무시함
        </div>

        <div v-if="deletedOnly" class="rule-legend mt-3">
          온통청년 오픈 API에서 더 이상 제공되지 않는 정책입니다.
          데이터는 삭제하지 않고 숨김 처리만 하므로, 다시 제공되면 자동으로 복구됩니다.
        </div>

        <div v-if="filters.adminManagedOnly" class="rule-legend mt-3">
          관리자가 노출 상태를 직접 지정한 정책입니다.
          지정값은 동기화 대상이 아니므로 온통청년 값이 바뀌어도 유지됩니다.
        </div>
      </div>
    </div>

    <!-- 목록 -->
    <div class="card border-0 shadow-sm">
      <div class="card-body">

        <div v-if="loading" class="text-center py-5">
          <div class="spinner-border text-secondary" role="status">
            <span class="visually-hidden">불러오는 중</span>
          </div>
        </div>

        <div v-else-if="loadError" class="alert alert-danger py-2 small mb-0">
          {{ loadError }}
        </div>

        <template v-else-if="data">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <div class="d-flex align-items-baseline gap-2">
              <h6 class="mb-0 fw-bold">전체 {{ data.totalCount.toLocaleString() }}건</h6>
              <small class="text-muted">{{ sortLabel }}</small>
            </div>
            <small class="text-muted" v-if="data.totalPages > 0">
              {{ data.page }} / {{ data.totalPages }} 페이지
            </small>
          </div>

          <div class="table-responsive">
            <table class="table table-sm align-middle mb-0">
              <thead class="table-light">
                <tr class="small text-muted">
                  <!-- 상태·카테고리·중복규칙은 위에 필터가 있어 정렬을 넣지 않는다 -->
                  <th style="width:110px">상태</th>
                  <th style="width:90px">카테고리</th>

                  <th style="min-width:260px" class="sortable" @click="toggleSort('plcyNm')">
                    혜택명 <span class="sort-mark">{{ sortMark('plcyNm') }}</span>
                  </th>
                  <th style="min-width:140px" class="sortable" @click="toggleSort('sprvsnInstCdNm')">
                    주관기관 <span class="sort-mark">{{ sortMark('sprvsnInstCdNm') }}</span>
                  </th>
                  <th style="width:130px" class="sortable" @click="toggleSort('deadline')">
                    마감 <span class="sort-mark">{{ sortMark('deadline') }}</span>
                  </th>
                  <th class="text-end sortable" style="width:90px" @click="toggleSort('inqCnt')">
                    조회수 <span class="sort-mark">{{ sortMark('inqCnt') }}</span>
                  </th>

                  <th style="width:150px">중복규칙</th>
                  <th style="width:170px">관리</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="b in data.benefits" :key="b.benefitNo">
                  <!--
                    상태는 세 컬럼이 겹쳐 있어 서버가 하나로 합쳐 내려준다.
                    관리자가 직접 지정한 경우에는 원본과 다르다는 것을 알려야
                    '왜 API 값과 다르지'를 바로 판단할 수 있고,
                    되돌릴 방법도 같은 자리에 있어야 관리가 된다.
                  -->
                  <td>
                    <span class="badge" :class="statusBadge(b)">
                      {{ statusText(b) }}
                    </span>
                    <div v-if="b.adminIsActive && b.apiDeletedYn !== 'Y'" class="admin-mark">
                      관리자 지정
                      <button class="clear-link"
                              :disabled="togglingNo === b.benefitNo"
                              title="지정을 해제하고 다시 온통청년 값을 따릅니다"
                              @click="askClear(b)">해제</button>
                    </div>
                  </td>
                  <td>
                    <span class="badge cat" :class="categoryClass(b.categoryCode)">
                      {{ categoryName(b.categoryCode) }}
                    </span>
                  </td>
                  <td class="small">{{ b.plcyNm }}</td>
                  <td class="small text-muted">{{ b.sprvsnInstCdNm }}</td>
                  <!-- D-day는 남은 기간이라 언제 끝나는지는 알 수 없다.
                       상세를 열지 않아도 판단할 수 있게 날짜를 같이 보여준다. -->
                  <td class="small">
                    <div :class="ddayTone(b)">{{ deadlineText(b) }}</div>
                    <div v-if="b.applyEndDate" class="deadline-date">
                      {{ formatDate(b.applyEndDate) }}
                    </div>
                  </td>
                  <td class="text-end small">{{ (b.inqCnt ?? 0).toLocaleString() }}</td>

                  <!--
                    그룹 코드만 보여주면 개별쌍 규칙에만 걸린 혜택이 '-' 로 나와서,
                    중복수혜 필터로 걸러낸 목록인데도 아무 표시가 없는 행이 생긴다.
                    엔진의 처리 방식이 다르므로 합치지 않고 넷으로 나눠 보여준다.
                  -->
                  <td>
                    <div v-if="hasRule(b)" class="d-flex flex-wrap gap-1">
                      <span v-if="b.conflictGroupCode"
                            class="badge rule rule-group"
                            title="같은 그룹 코드가 붙은 혜택끼리는 하나만 받을 수 있습니다">
                        {{ b.conflictGroupCode }}
                      </span>
                      <span v-if="b.pairRuleCount > 0"
                            class="badge rule rule-pair"
                            title="다른 혜택과 짝으로 등록된 규칙입니다. 엔진이 후보에서 빼거나 점수를 깎습니다">
                        개별 {{ b.pairRuleCount }}
                      </span>
                      <span v-if="b.externalRuleCount > 0"
                            class="badge rule rule-external"
                            title="상대가 온통청년 정책이 아니라 우리 DB에 없습니다. 회원이 받고 있는지 알 수 없어 안내만 하고 점수는 건드리지 않습니다">
                        외부 {{ b.externalRuleCount }}
                      </span>
                      <span v-if="b.reviewRuleCount > 0"
                            class="badge rule rule-review"
                            title="아직 공고문으로 확인되지 않은 규칙입니다. 엔진은 무시하며 관리자가 검수해야 합니다">
                        검수 {{ b.reviewRuleCount }}
                      </span>
                    </div>
                    <span v-else class="text-muted small">-</span>
                  </td>

                  <td>
                    <button class="btn btn-sm btn-outline-secondary me-1"
                            @click="openDetail(b.benefitNo)">상세</button>

                    <!-- 원천에서 사라진 정책은 켜도 보여줄 내용이 없으므로 잠근다 -->
                    <button v-if="b.apiDeletedYn === 'Y'"
                            class="btn btn-sm btn-outline-secondary" disabled
                            title="온통청년에서 삭제된 정책이라 노출할 수 없습니다">
                      삭제됨
                    </button>
                    <button v-else class="btn btn-sm"
                            :class="b.effectiveStatus === 'Y' ? 'btn-outline-danger' : 'btn-outline-success'"
                            :disabled="togglingNo === b.benefitNo"
                            @click="askToggle(b)">
                      {{ b.effectiveStatus === 'Y' ? '비활성화' : '활성화' }}
                    </button>
                  </td>
                </tr>

                <tr v-if="data.benefits.length === 0">
                  <td colspan="8" class="text-center text-muted small py-5">
                    조건에 맞는 혜택이 없습니다. 검색어나 필터를 바꿔보세요.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 페이지네이션 -->
          <nav v-if="data.totalPages > 1" class="mt-3">
            <ul class="pagination pagination-sm justify-content-center mb-0">
              <li class="page-item" :class="{ disabled: data.page <= 1 }">
                <button class="page-link" @click="goPage(data.page - 1)">이전</button>
              </li>
              <li v-for="p in pageNumbers" :key="p"
                  class="page-item" :class="{ active: p === data.page }">
                <button class="page-link" @click="goPage(p)">{{ p }}</button>
              </li>
              <li class="page-item" :class="{ disabled: data.page >= data.totalPages }">
                <button class="page-link" @click="goPage(data.page + 1)">다음</button>
              </li>
            </ul>
          </nav>
        </template>
      </div>
    </div>

    <!-- 상태 변경 확인 -->
    <div v-if="pendingToggle" class="modal-backdrop-custom" @click.self="pendingToggle = null">
      <div class="modal-box">
        <h6 class="fw-bold mb-3">
          {{ pendingToggle.effectiveStatus === 'Y' ? '비활성화할까요?' : '다시 활성화할까요?' }}
        </h6>
        <p class="small mb-2">{{ pendingToggle.plcyNm }}</p>
        <p class="small text-muted mb-4">
          <template v-if="pendingToggle.effectiveStatus === 'Y'">
            비활성화하면 추천 대상에서 제외됩니다. 데이터는 삭제되지 않습니다.
          </template>
          <template v-else>
            다시 추천 대상에 포함됩니다.
          </template>
          <span class="d-block mt-2">
            지정한 상태는 원본과 별도로 저장되므로 동기화를 실행해도 유지됩니다.
          </span>
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="pendingToggle = null">취소</button>
          <button class="btn btn-sm btn-dark" @click="confirmToggle">확인</button>
        </div>
      </div>
    </div>

    <!-- 지정 해제 확인 -->
    <div v-if="pendingClear" class="modal-backdrop-custom" @click.self="pendingClear = null">
      <div class="modal-box">
        <h6 class="fw-bold mb-3">관리자 지정을 해제할까요?</h6>
        <p class="small mb-2">{{ pendingClear.plcyNm }}</p>
        <p class="small text-muted mb-4">
          해제하면 이 정책은 다시 온통청년이 내려주는 상태를 따릅니다.
          다음 동기화에서 상태가 바뀔 수 있습니다.
        </p>
        <div class="d-flex justify-content-end gap-2">
          <button class="btn btn-sm btn-outline-secondary" @click="pendingClear = null">취소</button>
          <button class="btn btn-sm btn-dark" @click="confirmClear">해제</button>
        </div>
      </div>
    </div>

    <!-- 상세 -->
    <div v-if="detail" class="modal-backdrop-custom" @click.self="closeDetail">
      <div class="modal-box modal-wide">
        <div class="d-flex justify-content-between align-items-start mb-3">
          <div>
            <span class="badge cat me-1" :class="categoryClass(detail.categoryCode)">
              {{ categoryName(detail.categoryCode) }}
            </span>
            <span class="badge" :class="statusBadge(detail)">
              {{ statusText(detail) }}
            </span>
            <span v-if="detail.adminIsActive && detail.apiDeletedYn !== 'Y'"
                  class="badge rule rule-custom ms-1"
                  title="관리자가 지정한 상태입니다">지정값</span>
            <h6 class="fw-bold mt-2 mb-0">{{ detail.plcyNm }}</h6>
            <small class="text-muted">{{ detail.sprvsnInstCdNm }}</small>
          </div>
          <button class="btn-close" @click="closeDetail"></button>
        </div>

        <!-- 원천에서 사라진 정책은 왜 안 보이는지가 가장 먼저 필요한 정보다 -->
        <div v-if="detail.apiDeletedYn === 'Y'" class="alert alert-danger py-2 px-3 small mb-3">
          온통청년 오픈 API에서 더 이상 제공되지 않아
          {{ formatDate(detail.apiDeletedDt) }}에 숨김 처리되었습니다.
          데이터는 삭제되지 않았으며 다시 제공되면 자동으로 복구됩니다.
        </div>

        <dl class="row small mb-0">
          <dt class="col-4 col-md-3 text-muted fw-normal">혜택번호</dt>
          <dd class="col-8 col-md-9">{{ detail.plcyNo }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">신청 기간</dt>
          <dd class="col-8 col-md-9">{{ periodText(detail) }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">연령</dt>
          <dd class="col-8 col-md-9">{{ ageText(detail) }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">소득 조건</dt>
          <dd class="col-8 col-md-9">
            {{ incomeText(detail) }}
            <div v-if="detail.earnEtcCn" class="text-muted mt-1">{{ detail.earnEtcCn }}</div>
          </dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">지역 매핑</dt>
          <dd class="col-8 col-md-9">
            {{ detail.regionCount?.toLocaleString() }}개 지역
            <span v-if="detail.regionCount > 200" class="text-warning-emphasis">
              · 전국 코드가 부여된 혜택입니다
            </span>
          </dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">중복수혜 그룹</dt>
          <dd class="col-8 col-md-9">{{ detail.conflictGroupCode || '없음' }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">조회수</dt>
          <dd class="col-8 col-md-9">{{ (detail.inqCnt ?? 0).toLocaleString() }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">등록일</dt>
          <dd class="col-8 col-md-9">{{ formatDate(detail.frstRegDt) }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">지원 내용</dt>
          <dd class="col-8 col-md-9">{{ detail.plcySprtCn || '-' }}</dd>

          <dt class="col-4 col-md-3 text-muted fw-normal">신청 방법</dt>
          <dd class="col-8 col-md-9 mb-0">{{ detail.plcyAplyMthdCn || '-' }}</dd>
        </dl>

        <!--
          신청 링크 관리.
          원본·참고·지정값을 함께 보여주는 이유는, 원본이 비어 있거나 잘못된 값인 경우가
          많아서 '왜 바꿔야 했는지'가 화면에서 바로 보여야 하기 때문이다.
          원본은 지우지 않으므로 지정을 해제하면 언제든 되돌아간다.
        -->
        <div class="url-box mt-4">
          <div class="d-flex justify-content-between align-items-baseline mb-2">
            <div class="fw-bold small">신청 링크</div>
            <small class="text-muted">동기화해도 지정값은 유지됩니다</small>
          </div>

          <div class="url-row">
            <span class="url-label">원본</span>
            <span v-if="originText" class="url-value">{{ originText }}</span>
            <span v-else class="url-value text-muted">비어 있음 (온통청년이 값을 주지 않음)</span>
          </div>

          <div class="url-row">
            <span class="url-label">참고</span>
            <span v-if="refText" class="url-value">{{ refText }}</span>
            <span v-else class="url-value text-muted">없음</span>
          </div>

          <div class="url-row">
            <span class="url-label">사용자 노출</span>
            <span v-if="effectiveUrl" class="url-value">
              {{ effectiveUrl }}
              <span v-if="detail.customApplyUrl" class="badge rule rule-custom ms-1">지정값</span>
              <span v-else-if="!originText && refText" class="badge rule rule-external ms-1">참고</span>
            </span>
            <span v-else class="url-value text-danger">
              없음 — 사용자 화면에서 신청 버튼이 비활성됩니다
            </span>
          </div>

          <div class="d-flex gap-2 mt-3">
            <input v-model="urlDraft" type="text"
                   class="form-control form-control-sm"
                   placeholder="https:// 로 시작하는 주소"
                   :disabled="urlSaving"
                   @keyup.enter="saveCustomUrl" />
            <button class="btn btn-sm btn-dark px-3"
                    :disabled="urlSaving"
                    @click="saveCustomUrl">지정</button>
            <button class="btn btn-sm btn-outline-secondary px-3"
                    :disabled="urlSaving || !detail.customApplyUrl"
                    @click="clearCustomUrl">해제</button>
          </div>

          <div v-if="urlError" class="alert alert-danger py-2 px-3 small mt-2 mb-0">
            {{ urlError }}
          </div>
          <div v-else-if="urlMessage" class="alert alert-success py-2 px-3 small mt-2 mb-0">
            {{ urlMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import adminApi from '@/api/adminApi';

const route = useRoute();

const PAGE_SIZE = 20;

const CATEGORY = {
  1: '일자리', 2: '주거', 3: '교육', 4: '복지·문화', 5: '참여·권리',
};

// 'D'는 관리자가 끈 것이 아니라 원천에서 사라진 것이라 다른 축이지만,
// 관리자 입장에서는 '이 혜택이 지금 보이느냐'라는 하나의 질문이므로 같은 줄에 둔다
const activeOptions = [
  { value: '', label: '전체' },
  { value: 'Y', label: '활성' },
  { value: 'N', label: '비활성' },
  { value: 'D', label: 'API 삭제' },
];

const categoryOptions = [
  { value: '', label: '전체' },
  { value: '1', label: '일자리' },
  { value: '2', label: '주거' },
  { value: '3', label: '교육' },
  { value: '4', label: '복지·문화' },
  { value: '5', label: '참여·권리' },
];

const filters = reactive({
  keyword: '',
  isActive: '',
  categoryCode: '',
  deadlineSoon: false,
  hasConflict: false,
  adminManagedOnly: false,
});

// 서버는 활성 필터와 삭제 필터를 따로 받는다
const deletedOnly = computed(() => filters.isActive === 'D');

// 정렬은 서버가 처리한다. 목록이 2,700건이라 현재 페이지 20건만 정렬하면
// '마감 임박순'이 전체 기준이 아니게 되어 잘못된 결과를 보여준다.
// sort 가 비어 있으면 서버 기본값(최신 등록순)을 쓴다.
const sort = reactive({ key: '', order: 'asc' });

const SORT_LABEL = {
  plcyNm: '혜택명',
  sprvsnInstCdNm: '주관기관',
  deadline: '마감',
  inqCnt: '조회수',
};

const loading = ref(false);
const loadError = ref('');
const data = ref(null);
const detail = ref(null);
const pendingToggle = ref(null);
const pendingClear = ref(null);
const togglingNo = ref(null);

// 신청 링크 지정
const urlDraft = ref('');
const urlSaving = ref(false);
const urlError = ref('');
const urlMessage = ref('');

const sortLabel = computed(() => {
  if (!sort.key) return '· 최신 등록순';
  const dir = sort.order === 'asc' ? '오름차순' : '내림차순';
  return `· ${SORT_LABEL[sort.key]} ${dir}`;
});

// 원본은 빈 문자열·공백만 있는 경우가 많아 그대로 쓰면 '값이 있는 것처럼' 보인다
const originText = computed(() => (detail.value?.aplyUrlAddr || '').trim());

// 참고 주소. 신청 주소가 비어 있을 때 공고 확인용으로 쓰인다
const refText = computed(() => (detail.value?.refUrlAddr1 || '').trim());

// 사용자에게 실제로 나가는 링크. 서버의 폴백 순서와 같은 규칙이라
// 관리자가 저장 전에 결과를 미리 확인할 수 있다
const effectiveUrl = computed(() => {
  if (!detail.value) return '';
  return (detail.value.customApplyUrl || '').trim()
      || originText.value
      || refText.value;
});

// 현재 페이지 주변 최대 5개만 노출한다
const pageNumbers = computed(() => {
  if (!data.value) return [];
  const total = data.value.totalPages;
  const cur = data.value.page;
  let start = Math.max(1, cur - 2);
  const end = Math.min(total, start + 4);
  start = Math.max(1, end - 4);

  const list = [];
  for (let i = start; i <= end; i++) list.push(i);
  return list;
});

async function load(page = 1) {
  loading.value = true;
  loadError.value = '';
  try {
    data.value = await adminApi.getBenefits({
      keyword: filters.keyword || undefined,
      // 'D'는 삭제 필터로 보내고 활성 필터는 비운다
      isActive: deletedOnly.value ? undefined : (filters.isActive || undefined),
      deletedOnly: deletedOnly.value || undefined,
      adminManagedOnly: filters.adminManagedOnly || undefined,
      categoryCode: filters.categoryCode || undefined,
      deadlineSoon: filters.deadlineSoon || undefined,
      hasConflict: filters.hasConflict || undefined,
      sort: sort.key || undefined,
      order: sort.key ? sort.order : undefined,
      page,
      size: PAGE_SIZE,
    });
  } catch (e) {
    loadError.value = '혜택 목록을 불러오지 못했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}

// 필터가 바뀌면 항상 1페이지부터 다시 본다
function search() {
  load(1);
}

/**
 * 같은 컬럼을 계속 누르면 오름차순 → 내림차순 → 해제(기본) 로 돈다.
 * 해제를 넣은 이유는 기본 정렬(최신 등록순)로 되돌릴 방법이 필요해서다.
 */
function toggleSort(key) {
  if (sort.key !== key) {
    sort.key = key;
    sort.order = 'asc';
  } else if (sort.order === 'asc') {
    sort.order = 'desc';
  } else {
    sort.key = '';
    sort.order = 'asc';
  }
  load(1);
}

function sortMark(key) {
  if (sort.key !== key) return '⇅';
  return sort.order === 'asc' ? '▲' : '▼';
}

function selectActive(value) {
  filters.isActive = value;
  search();
}

function selectCategory(value) {
  filters.categoryCode = value;
  search();
}

function selectDeadline(value) {
  filters.deadlineSoon = value;
  search();
}

function selectConflict(value) {
  filters.hasConflict = value;
  search();
}

// 관리자가 손댄 정책만 모아 본다. 2,700건 중에서 되짚을 방법이 없으면
// 지정 기능이 있어도 관리가 되지 않는다
function selectAdminManaged(value) {
  filters.adminManagedOnly = value;
  search();
}

function resetFilters() {
  filters.keyword = '';
  filters.isActive = '';
  filters.categoryCode = '';
  filters.deadlineSoon = false;
  filters.hasConflict = false;
  filters.adminManagedOnly = false;
  sort.key = '';
  sort.order = 'asc';
  search();
}

function goPage(page) {
  if (page < 1 || page > data.value.totalPages || page === data.value.page) return;
  load(page);
}

async function openDetail(benefitNo) {
  try {
    detail.value = await adminApi.getBenefitDetail(benefitNo);
    // 입력창은 항상 현재 지정값에서 시작한다. 이전 혜택의 입력이 남으면 안 된다
    urlDraft.value = detail.value.customApplyUrl || '';
    urlError.value = '';
    urlMessage.value = '';
  } catch (e) {
    loadError.value = '혜택 상세를 불러오지 못했습니다.';
    console.error(e);
  }
}

function closeDetail() {
  detail.value = null;
  urlDraft.value = '';
  urlError.value = '';
  urlMessage.value = '';
}

/**
 * 서버도 같은 형식을 검사하지만 여기서 먼저 걸러낸다.
 * 스킴 빠뜨림이 가장 흔한 실수인데, 서버까지 갔다 오면 500 응답이 되어
 * 무엇이 잘못됐는지 화면에 제대로 나오지 않는다.
 */
function validateUrl(value) {
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) {
    return 'https:// 또는 http:// 로 시작하는 주소를 입력해 주세요.';
  }
  if (value.length > 500) {
    return '주소가 너무 깁니다. 500자 이내로 입력해 주세요.';
  }
  return '';
}

async function saveCustomUrl() {
  const value = urlDraft.value.trim();

  const message = validateUrl(value);
  if (message) {
    urlError.value = message;
    urlMessage.value = '';
    return;
  }
  if (!value) {
    urlError.value = '지정할 주소를 입력해 주세요. 되돌리려면 해제를 눌러주세요.';
    urlMessage.value = '';
    return;
  }

  await applyCustomUrl(value, '지정했습니다. 사용자 화면에 이 주소가 나갑니다.');
}

async function clearCustomUrl() {
  await applyCustomUrl('', '해제했습니다. 원본 주소로 되돌아갑니다.');
}

async function applyCustomUrl(value, successMessage) {
  urlSaving.value = true;
  urlError.value = '';
  urlMessage.value = '';

  try {
    // 응답이 갱신된 상세라 화면 전체가 한 번에 최신 상태가 된다
    detail.value = await adminApi.changeCustomApplyUrl(detail.value.benefitNo, value);
    urlDraft.value = detail.value.customApplyUrl || '';
    urlMessage.value = successMessage;
  } catch (e) {
    urlError.value = '저장하지 못했습니다. 주소 형식을 확인하거나 잠시 후 다시 시도해 주세요.';
    console.error(e);
  } finally {
    urlSaving.value = false;
  }
}

// 되돌릴 수 있는 작업이지만 추천 결과가 즉시 달라지므로 한 번 확인한다
function askToggle(benefit) {
  pendingToggle.value = benefit;
}

async function confirmToggle() {
  const b = pendingToggle.value;
  const next = b.effectiveStatus === 'Y' ? 'N' : 'Y';

  pendingToggle.value = null;
  togglingNo.value = b.benefitNo;

  try {
    await adminApi.changeBenefitActive(b.benefitNo, next);
    // 목록 전체를 다시 부르지 않고 해당 행만 갱신한다.
    // 지정값과 최종 상태를 함께 바꿔야 배지와 버튼이 동시에 맞는다
    b.adminIsActive = next;
    b.effectiveStatus = next;
  } catch (e) {
    loadError.value = '상태 변경에 실패했습니다.';
    console.error(e);
  } finally {
    togglingNo.value = null;
  }
}

// 해제하면 다음 동기화에서 상태가 바뀔 수 있으므로 한 번 확인한다
function askClear(benefit) {
  pendingClear.value = benefit;
}

async function confirmClear() {
  const b = pendingClear.value;

  pendingClear.value = null;
  togglingNo.value = b.benefitNo;

  try {
    // 빈 값을 보내면 서버가 지정을 해제하고 다시 원본을 따르게 한다
    const updated = await adminApi.changeBenefitActive(b.benefitNo, '');
    b.adminIsActive = null;
    b.effectiveStatus = updated.effectiveStatus;
  } catch (e) {
    loadError.value = '지정 해제에 실패했습니다.';
    console.error(e);
  } finally {
    togglingNo.value = null;
  }
}

// 네 종류 중 하나라도 있으면 배지 영역을, 하나도 없으면 '-' 를 보여준다
function hasRule(b) {
  return !!b.conflictGroupCode
      || b.pairRuleCount > 0
      || b.externalRuleCount > 0
      || b.reviewRuleCount > 0;
}

function categoryName(code) {
  return CATEGORY[code] || '기타';
}

// 카테고리를 색으로 구분해 목록에서 한눈에 묶이도록 한다
function categoryClass(code) {
  return `cat-${CATEGORY[code] ? code : 'etc'}`;
}

/**
 * 최종 노출 상태의 색과 문구.
 * 세 컬럼(api_deleted_yn · admin_is_active · is_active)을 서버가 합쳐
 * effectiveStatus 하나로 내려주므로 화면은 그것만 본다.
 * 화면이 직접 계산하면 서버의 우선순위와 어긋날 수 있다.
 */
function statusBadge(b) {
  if (b.effectiveStatus === 'D') return 'bg-danger-subtle text-danger';
  return b.effectiveStatus === 'Y'
    ? 'bg-success-subtle text-success'
    : 'bg-secondary-subtle text-secondary';
}

function statusText(b) {
  if (b.effectiveStatus === 'D') return 'API 삭제';
  return b.effectiveStatus === 'Y' ? '활성' : '비활성';
}

// apply_end_date가 NULL인 경우가 상시모집(0057002)과 마감(0057003) 두 가지라
// dday만 보면 마감된 혜택이 '상시 모집'으로 표시된다. 구분 코드를 먼저 본다.
function deadlineText(b) {
  if (b.aplyPrdSeCd === '0057003') return '접수 마감';
  if (b.aplyPrdSeCd === '0057002') return '상시 모집';

  if (b.dday === null || b.dday === undefined) return '기간 미정';
  if (b.dday < 0) return '마감';
  if (b.dday === 0) return '오늘 마감';
  return `D-${b.dday}`;
}

function ddayTone(b) {
  if (b.aplyPrdSeCd === '0057003') return 'text-muted';
  if (b.dday === null || b.dday === undefined) return 'text-muted';
  if (b.dday < 0) return 'text-muted';
  if (b.dday <= 3) return 'text-danger fw-semibold';
  if (b.dday <= 7) return 'text-warning-emphasis';
  return '';
}

function periodText(d) {
  if (d.aplyPrdSeCd === '0057002') return '상시 모집';
  if (d.aplyPrdSeCd === '0057003') return '접수 마감';
  const s = formatDate(d.applyStartDate);
  const e = formatDate(d.applyEndDate);
  if (s === '-' && e === '-') return '-';
  return `${s} ~ ${e}`;
}

function ageText(d) {
  if (d.sprtTrgtMinAge == null && d.sprtTrgtMaxAge == null) return '제한 없음';
  return `만 ${d.sprtTrgtMinAge ?? 0}세 ~ ${d.sprtTrgtMaxAge ?? 99}세`;
}

function incomeText(d) {
  if (d.earnCndSeCd === '0043001') return '제한 없음';
  if (d.earnCndSeCd === '0043002') {
    const max = d.earnMaxAmt ? `${d.earnMaxAmt.toLocaleString()}만원 이하` : '기준 있음';
    return `연소득 ${max}`;
  }
  if (d.earnCndSeCd === '0043003') return '기타 (자연어 조건이라 자동 판정 불가)';
  return '-';
}

function formatDate(ms) {
  if (!ms) return '-';
  const d = new Date(ms);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

onMounted(() => {
  // 대시보드 카드에서 조회 조건을 달고 넘어오는 경우를 받는다
  if (route.query.isActive) filters.isActive = String(route.query.isActive);
  if (route.query.categoryCode) filters.categoryCode = String(route.query.categoryCode);
  if (route.query.deadlineSoon === 'true') filters.deadlineSoon = true;
  if (route.query.hasConflict === 'true') filters.hasConflict = true;
  if (route.query.keyword) filters.keyword = String(route.query.keyword);

  load(1);
});
</script>

<style scoped>
.table td { word-break: keep-all; }

/* 정렬 가능한 컬럼임을 알린다 */
.sortable {
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
}

.sortable:hover { color: #2e2a24; }

.sort-mark {
  font-size: 10px;
  opacity: 0.55;
  margin-left: 2px;
}

/* 관리자가 지정한 상태임을 배지 아래 작게 알리고 되돌릴 길을 함께 둔다 */
.admin-mark {
  font-size: 10px;
  color: #8a857c;
  margin-top: 3px;
  white-space: nowrap;
}

.clear-link {
  border: 0;
  background: none;
  padding: 0 0 0 5px;
  font-size: 10px;
  color: #8a857c;
  text-decoration: underline;
  cursor: pointer;
}

.clear-link:hover { color: #2e2a24; }
.clear-link:disabled { opacity: .4; cursor: default; }

/* 카테고리 색상 — 목록에서 같은 분야가 한눈에 묶이도록 한다 */
.cat {
  border: 1px solid transparent;
  font-weight: 600;
}

.cat-1 { background-color: #e8f0fe; color: #1a56c4; border-color: #cfe0fb; }  /* 일자리 */
.cat-2 { background-color: #e6f5ec; color: #1e7a45; border-color: #c9e8d6; }  /* 주거 */
.cat-3 { background-color: #f0e9fb; color: #6b3fa0; border-color: #ddd0f4; }  /* 교육 */
.cat-4 { background-color: #fff2d6; color: #98701a; border-color: #f7e2b0; }  /* 복지·문화 */
.cat-5 { background-color: #e3f4f4; color: #16706e; border-color: #c7e8e7; }  /* 참여·권리 */
.cat-etc { background-color: #efece4; color: #6f6860; border-color: #e2ddd2; }

/*
  중복수혜 규칙 배지.
  카테고리 배지와 같은 줄에 놓이므로 채도를 낮춰 카테고리 쪽이 먼저 읽히게 한다.
  검수만 점선 테두리를 쓰는데, '아직 확정되지 않았다'를 색이 아니라
  형태로 구분하면 색약인 사용자도 구분할 수 있다.
*/
.rule {
  border: 1px solid transparent;
  font-weight: 600;
  font-size: 11px;
  cursor: help;
}

.rule-group    { background-color: #eceff4; color: #414a58; border-color: #d6dbe4; }
.rule-pair     { background-color: #fdecec; color: #a83232; border-color: #f5d2d2; }
.rule-external { background-color: #fdf0e0; color: #9a5f16; border-color: #f2ddbe; }
.rule-review   { background-color: #fff;    color: #7a736a; border-color: #b9b2a8; border-style: dashed; }
.rule-custom   { background-color: #e6f5ec; color: #1e7a45; border-color: #c9e8d6; cursor: default; }

/* 배지 뜻풀이 줄 */
.rule-legend {
  font-size: 12px;
  color: #6f6860;
  line-height: 2;
}

.rule-legend .sep {
  margin: 0 6px;
  color: #cfc9bf;
}

/* 신청 링크 관리 영역 */
.url-box {
  background: #faf9f6;
  border: 1px solid #e8e4da;
  border-radius: 10px;
  padding: 16px;
}

.url-row {
  display: flex;
  gap: 10px;
  font-size: 12px;
  line-height: 1.7;
}

.url-label {
  flex: 0 0 72px;
  color: #908980;
}

/* 긴 주소가 모달 폭을 밀어내지 않도록 강제로 줄바꿈한다 */
.url-value {
  flex: 1 1 auto;
  word-break: break-all;
}

/* D-day 아래 붙는 실제 마감일. 주가 아니므로 작고 흐리게 둔다 */
.deadline-date {
  font-size: 11px;
  color: #908980;
  margin-top: 1px;
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  padding: 20px;
}

.modal-box {
  background: #fff;
  border-radius: 14px;
  padding: 24px;
  width: 100%;
  max-width: 420px;
  max-height: 85vh;
  overflow-y: auto;
}

.modal-wide { max-width: 680px; }
</style>