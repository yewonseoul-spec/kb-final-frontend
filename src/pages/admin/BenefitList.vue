<template>
  <div>
    <div class="a-head">
      <div><h1>혜택 관리</h1></div>
      <p>온통청년에서 수집한 청년혜택을 조회하고 노출 상태를 관리합니다.</p>
    </div>

    <!-- 필터 -->
    <div class="a-card mb-3">
      <div class="a-card-b">
        <div class="f-top">
          <div class="a-search">
            <span class="f-ico">⌕</span>
            <input v-model="filters.keyword" type="text"
                   placeholder="혜택명 검색" @keyup.enter="search" />
          </div>
          <button class="a-btn a-btn-dark a-btn-fix" @click="search">조회</button>
          <button class="a-btn a-btn-fix" @click="resetFilters">초기화</button>
        </div>

        <div class="a-filters">
          <div>
            <div class="a-fl">노출 상태</div>
            <div class="a-seg">
              <button v-for="opt in activeOptions" :key="opt.value"
                      :class="{ 'is-on': filters.isActive === opt.value }"
                      @click="selectActive(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="a-fl">카테고리</div>
            <div class="a-seg">
              <button v-for="opt in categoryOptions" :key="opt.value"
                      :class="{ 'is-on': filters.categoryCode === opt.value }"
                      @click="selectCategory(opt.value)">
                {{ opt.label }}
              </button>
            </div>
          </div>

          <div>
            <div class="a-fl">마감</div>
            <div class="a-seg">
              <button :class="{ 'is-on': !filters.deadlineSoon }"
                      @click="selectDeadline(false)">전체</button>
              <button :class="{ 'is-on': filters.deadlineSoon }"
                      @click="selectDeadline(true)">30일 이내</button>
            </div>
          </div>

          <div>
            <div class="a-fl">중복수혜</div>
            <div class="a-seg">
              <button :class="{ 'is-on': !filters.hasConflict }"
                      @click="selectConflict(false)">전체</button>
              <button :class="{ 'is-on': filters.hasConflict }"
                      @click="selectConflict(true)">관리 대상</button>
            </div>
          </div>

          <div>
            <div class="a-fl">관리자 지정</div>
            <div class="a-seg">
              <button :class="{ 'is-on': !filters.adminManagedOnly }"
                      @click="selectAdminManaged(false)">전체</button>
              <button :class="{ 'is-on': filters.adminManagedOnly }"
                      @click="selectAdminManaged(true)">지정만</button>
            </div>
          </div>
        </div>

        <!--
          배지 뜻풀이. 중복수혜 필터를 켰을 때만 보여준다.
          평소에는 표에 잘 안 걸리는 정보라 항상 띄우면 화면만 복잡해진다.
        -->
        <div v-if="filters.hasConflict" class="a-hint f-legend">
          <span class="a-bdg a-bdg-mute">G01</span> 같은 묶음의 혜택은 하나만 받을 수 있음
          <span class="f-sep">·</span>
          <span class="a-bdg a-bdg-info">개별</span> 엔진이 후보에서 빼거나 감점함
          <span class="f-sep">·</span>
          <span class="a-bdg a-bdg-warn">외부</span> 우리 DB에 없는 제도라 안내만 함
          <span class="f-sep">·</span>
          <span class="a-bdg a-bdg-plain a-bdg-dash">검수</span> 아직 확인 전이라 엔진이 무시함
        </div>

        <div v-if="deletedOnly" class="a-hint f-legend">
          온통청년 오픈 API에서 더 이상 제공되지 않는 정책입니다.
          데이터는 삭제하지 않고 숨김 처리만 하므로, 다시 제공되면 자동으로 복구됩니다.
        </div>

        <div v-if="filters.adminManagedOnly" class="a-hint f-legend">
          관리자가 노출 상태를 직접 지정한 정책입니다.
          지정값은 동기화 대상이 아니므로 온통청년 값이 바뀌어도 유지됩니다.
        </div>
      </div>
    </div>

    <!-- 목록 -->
    <div class="a-card">
      <div v-if="loading" class="a-loading">
        <span class="a-spin"></span> 불러오는 중
      </div>

      <!-- 목록 자체를 못 불러온 경우는 표가 있을 자리에 그대로 둔다.
           토스트로 띄우면 잠시 뒤 사라져서 왜 비어 있는지 알 수 없다 -->
      <div v-else-if="loadError" class="a-card-b">
        <div class="a-notice a-notice-dngr">{{ loadError }}</div>
      </div>

      <template v-else-if="data">
        <div class="a-card-h">
          <h2>전체 <span class="a-num">{{ data.totalCount.toLocaleString() }}</span>건</h2>
          <span class="a-sub">{{ sortLabel }}</span>
        </div>

        <div class="t-wrap">
          <table class="a-tbl">
            <!-- 혜택명만 폭을 정하지 않아 남는 공간을 가져간다 -->
            <colgroup>
              <col style="width:112px">
              <col>
              <col style="width:170px">
              <col style="width:124px">
              <col style="width:96px">
              <col style="width:180px">
              <col style="width:198px">
            </colgroup>
            <thead>
              <tr>
                <!-- 상태·중복수혜는 위에 필터가 있어 정렬을 넣지 않는다 -->
                <th>상태</th>

                <th class="a-th-sort" @click="toggleSort('plcyNm')">
                  혜택명 <span class="a-th-mark">{{ sortMark('plcyNm') }}</span>
                </th>
                <th class="a-th-sort" @click="toggleSort('sprvsnInstCdNm')">
                  주관기관 <span class="a-th-mark">{{ sortMark('sprvsnInstCdNm') }}</span>
                </th>
                <th class="a-th-sort" @click="toggleSort('deadline')">
                  마감 <span class="a-th-mark">{{ sortMark('deadline') }}</span>
                </th>
                <th class="a-r a-th-sort" @click="toggleSort('inqCnt')">
                  조회수 <span class="a-th-mark">{{ sortMark('inqCnt') }}</span>
                </th>

                <th>중복수혜</th>
                <th>관리</th>
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
                  <span class="a-bdg a-bdg-fix" :class="statusBadge(b)">
                    <span class="a-dot">{{ statusMark(b) }}</span>{{ statusText(b) }}
                  </span>
                  <div v-if="b.adminIsActive && b.apiDeletedYn !== 'Y'" class="t-mark">
                    관리자 지정
                    <button class="t-clear"
                            :disabled="togglingNo === b.benefitNo"
                            title="지정을 해제하고 다시 온통청년 값을 따릅니다"
                            @click="askClear(b)">해제</button>
                  </div>
                </td>

                <!-- 카테고리는 별도 열이 아니라 이름 아래에 둔다.
                     색으로 나누면 정해둔 다섯 가지 뜻 밖의 색이 늘어난다 -->
                <td>
                  <div class="a-t-name">{{ b.plcyNm }}</div>
                  <div class="a-t-sub">{{ categoryName(b.categoryCode) }}</div>
                </td>

                <td class="a-dim">{{ b.sprvsnInstCdNm }}</td>

                <!-- D-day는 남은 기간이라 언제 끝나는지는 알 수 없다.
                     상세를 열지 않아도 판단할 수 있게 날짜를 같이 보여준다. -->
                <td>
                  <span class="a-bdg" :class="ddayBadge(b)">{{ deadlineText(b) }}</span>
                  <div v-if="b.applyEndDate" class="a-t-sub a-num">
                    {{ formatDate(b.applyEndDate) }}
                  </div>
                </td>

                <td class="a-r a-num" :class="numClass(b.inqCnt)">
                  {{ (b.inqCnt ?? 0).toLocaleString() }}
                </td>

                <!--
                  그룹 코드만 보여주면 개별쌍 규칙에만 걸린 혜택이 '-' 로 나와서,
                  중복수혜 필터로 걸러낸 목록인데도 아무 표시가 없는 행이 생긴다.
                  엔진의 처리 방식이 다르므로 합치지 않고 넷으로 나눠 보여준다.
                -->
                <td>
                  <div v-if="hasRule(b)" class="t-rules">
                    <span v-if="b.conflictGroupCode"
                          class="a-bdg a-bdg-mute"
                          title="같은 그룹 코드가 붙은 혜택끼리는 하나만 받을 수 있습니다">
                      {{ b.conflictGroupCode }}
                    </span>
                    <span v-if="b.pairRuleCount > 0"
                          class="a-bdg a-bdg-info"
                          title="다른 혜택과 짝으로 등록된 규칙입니다. 엔진이 후보에서 빼거나 점수를 깎습니다">
                      개별 {{ b.pairRuleCount }}
                    </span>
                    <span v-if="b.externalRuleCount > 0"
                          class="a-bdg a-bdg-warn"
                          title="상대가 온통청년 정책이 아니라 우리 DB에 없습니다. 회원이 받고 있는지 알 수 없어 안내만 하고 점수는 건드리지 않습니다">
                      외부 {{ b.externalRuleCount }}
                    </span>
                    <span v-if="b.reviewRuleCount > 0"
                          class="a-bdg a-bdg-plain a-bdg-dash"
                          title="아직 공고문으로 확인되지 않은 규칙입니다. 엔진은 무시하며 관리자가 검수해야 합니다">
                      검수 {{ b.reviewRuleCount }}
                    </span>
                  </div>
                  <span v-else class="a-none">—</span>
                </td>

                <td class="a-t-act">
                  <button class="a-btn a-btn-xs a-btn-dark a-btn-fix-sm"
                          @click="openDetail(b.benefitNo)">상세</button>

                  <!-- 원천에서 사라진 정책은 켜도 보여줄 내용이 없으므로 잠근다 -->
                  <button v-if="b.apiDeletedYn === 'Y'"
                          class="a-btn a-btn-xs a-btn-fix-sm" disabled
                          title="온통청년에서 삭제된 정책이라 노출할 수 없습니다">
                    잠김
                  </button>
                  <button v-else class="a-btn a-btn-xs a-btn-quiet a-btn-fix-sm"
                          :disabled="togglingNo === b.benefitNo"
                          @click="askToggle(b)">
                    {{ b.effectiveStatus === 'Y' ? '비활성화' : '활성화' }}
                  </button>
                </td>
              </tr>

              <tr v-if="data.benefits.length === 0">
                <td colspan="7">
                  <div class="a-empty">
                    조건에 맞는 혜택이 없습니다. 검색어나 필터를 바꿔보세요.
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!--
          페이지 이동.
          137페이지짜리 목록에서 번호를 직접 누르는 경우는 거의 없다.
          지금 어디인지와 앞뒤로 옮기는 것만 남긴다.
        -->
        <div v-if="data.totalCount > 0" class="a-pager">
          <span>
            전체 <b class="a-num">{{ data.totalCount.toLocaleString() }}</b>건 중
            <span class="a-num">{{ rangeText }}</span> 표시
          </span>
          <div class="a-pager-grp">
            <span>
              <b class="a-num">{{ data.page }}</b>
              <span class="t-slash">/</span>
              <span class="a-num">{{ data.totalPages }}</span>
            </span>
            <button class="a-pg" :disabled="data.page <= 1"
                    @click="goPage(data.page - 1)">‹</button>
            <button class="a-pg" :disabled="data.page >= data.totalPages"
                    @click="goPage(data.page + 1)">›</button>
          </div>
        </div>
      </template>
    </div>

    <!-- 상세 -->
    <div v-if="detail" class="a-modal-back" @click.self="closeDetail">
      <div class="a-modal a-modal-wide">
        <div class="a-modal-h">
          <div>
            <div class="d-badges">
              <span class="a-bdg a-bdg-plain">{{ categoryName(detail.categoryCode) }}</span>
              <span class="a-bdg" :class="statusBadge(detail)">
                <span class="a-dot">{{ statusMark(detail) }}</span>{{ statusText(detail) }}
              </span>
              <span v-if="detail.adminIsActive && detail.apiDeletedYn !== 'Y'"
                    class="a-bdg a-bdg-ok"
                    title="관리자가 지정한 상태입니다">지정값</span>
            </div>
            <div class="a-modal-t">{{ detail.plcyNm }}</div>
            <div class="a-t-sub">{{ detail.sprvsnInstCdNm }}</div>
          </div>
          <button class="a-modal-x" @click="closeDetail">✕</button>
        </div>

        <div class="a-modal-b">
          <!-- 원천에서 사라진 정책은 왜 안 보이는지가 가장 먼저 필요한 정보다 -->
          <div v-if="detail.apiDeletedYn === 'Y'" class="a-notice a-notice-dngr mb-3">
            <div>
              <b>온통청년에서 더 이상 제공되지 않습니다.</b>
              {{ formatDate(detail.apiDeletedDt) }}에 삭제 처리되었습니다.
              데이터는 지워지지 않았으며 다시 제공되면 자동으로 복구됩니다.
            </div>
          </div>

          <!--
            관리자 지정이 있으면 온통청년 원본과 무엇이 다른지 보여준다.
            목록에는 '관리자 지정'만 나오는데, 관리자가 실제로 알아야 할 것은
            '지금 API는 뭐라고 하는가'다. 두 값이 같아지면 자동으로 해제되므로
            이 배너는 아직 API가 관리자 판단을 따라오지 않았다는 뜻이기도 하다.
          -->
          <div v-else-if="detail.adminIsActive" class="a-notice mb-3">
            <div>
              <b>온통청년 값과 다릅니다.</b>
              온통청년은 이 정책을
              <strong>{{ detail.apiIsActive === 'Y' ? '활성' : '비활성' }}</strong>으로 주고 있으나,
              관리자가
              <strong>{{ detail.adminIsActive === 'Y' ? '활성' : '비활성' }}</strong>으로 지정해 두었습니다.
              온통청년 값이 같아지면 지정은 자동으로 해제됩니다.
            </div>
          </div>

          <dl class="a-dl">
            <div class="a-dl-row">
              <span class="a-dl-k">혜택번호</span>
              <span class="a-dl-v a-num">{{ detail.plcyNo }}</span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">신청 기간</span>
              <span class="a-dl-v">{{ periodText(detail) }}</span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">연령</span>
              <span class="a-dl-v">{{ ageText(detail) }}</span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">소득 조건</span>
              <span class="a-dl-v">
                {{ incomeText(detail) }}
                <div v-if="detail.earnEtcCn" class="a-t-sub">{{ detail.earnEtcCn }}</div>
              </span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">지역 매핑</span>
              <span class="a-dl-v">
                <span class="a-num">{{ detail.regionCount?.toLocaleString() }}</span>개 지역
                <span v-if="detail.regionCount > 200" class="d-note">
                  · 전국 코드가 부여된 혜택입니다
                </span>
              </span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">중복수혜 그룹</span>
              <span class="a-dl-v">{{ detail.conflictGroupCode || '없음' }}</span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">조회수</span>
              <span class="a-dl-v a-num">{{ (detail.inqCnt ?? 0).toLocaleString() }}</span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">등록일</span>
              <span class="a-dl-v a-num">{{ formatDate(detail.frstRegDt) }}</span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">지원 내용</span>
              <span class="a-dl-v">{{ detail.plcySprtCn || '-' }}</span>
            </div>
            <div class="a-dl-row">
              <span class="a-dl-k">신청 방법</span>
              <span class="a-dl-v">{{ detail.plcyAplyMthdCn || '-' }}</span>
            </div>
          </dl>

          <!--
            신청 링크 관리.
            원본·참고·지정값을 함께 보여주는 이유는, 원본이 비어 있거나 잘못된 값인 경우가
            많아서 '왜 바꿔야 했는지'가 화면에서 바로 보여야 하기 때문이다.
            원본은 지우지 않으므로 지정을 해제하면 언제든 되돌아간다.
          -->
          <div class="d-url">
            <div class="d-url-h">
              <b>신청 링크</b>
              <span class="a-t-sub">동기화해도 지정값은 유지됩니다</span>
            </div>

            <div class="d-url-row">
              <span class="d-url-k">원본</span>
              <span v-if="originText" class="d-url-v">{{ originText }}</span>
              <span v-else class="d-url-v a-none">비어 있음 (온통청년이 값을 주지 않음)</span>
            </div>

            <div class="d-url-row">
              <span class="d-url-k">참고</span>
              <span v-if="refText" class="d-url-v">{{ refText }}</span>
              <span v-else class="d-url-v a-none">없음</span>
            </div>

            <div class="d-url-row">
              <span class="d-url-k">사용자 노출</span>
              <span v-if="effectiveUrl" class="d-url-v">
                {{ effectiveUrl }}
                <span v-if="detail.customApplyUrl" class="a-bdg a-bdg-ok">지정값</span>
                <span v-else-if="!originText && refText" class="a-bdg a-bdg-warn">참고</span>
              </span>
              <span v-else class="d-url-v d-none">
                없음 — 사용자 화면에서 신청 버튼이 비활성됩니다
              </span>
            </div>

            <div class="d-url-form">
              <input v-model="urlDraft" type="text"
                     placeholder="https:// 로 시작하는 주소"
                     :disabled="urlSaving"
                     @keyup.enter="saveCustomUrl" />
              <button class="a-btn a-btn-dark a-btn-fix"
                      :disabled="urlSaving"
                      @click="saveCustomUrl">지정</button>
              <button class="a-btn a-btn-fix"
                      :disabled="urlSaving || !detail.customApplyUrl"
                      @click="clearCustomUrl">해제</button>
            </div>

            <!-- 입력 오류와 결과는 입력칸 바로 아래에 둔다.
                 토스트로 띄우면 무엇을 고쳐야 하는지와 떨어진다 -->
            <div v-if="urlError" class="a-notice a-notice-dngr mt-2">
              <div>{{ urlError }}</div>
            </div>
            <div v-else-if="urlMessage" class="a-notice a-notice-ok mt-2">
              <div>{{ urlMessage }}</div>
            </div>
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
import { useAdminDialog } from '@/composables/useAdminDialog';

/*
 * 확인창과 알림은 관리자 화면 공용 상자를 쓴다.
 *
 * 예전에는 이 화면이 자체 모달 두 개를 갖고 있었다. 동작은 문제없었지만
 * 화면마다 확인창 생김새가 달라 관리자가 매번 다시 읽어야 했다.
 *
 * 그리고 상태 변경이 실패하면 loadError 에 담아 목록 맨 위에 띄웠다.
 * 표 아래쪽 버튼을 누른 경우 화면 밖이라 보이지 않았다.
 */
const { toastSuccess, toastError, confirmDialog } = useAdminDialog();

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

/*
 * 지금 몇 번째부터 몇 번째를 보고 있는지.
 * 페이지 번호만 있으면 '3페이지'가 전체에서 어디쯤인지 감이 오지 않는다.
 */
const rangeText = computed(() => {
  if (!data.value || data.value.totalCount === 0) return '';
  const start = (data.value.page - 1) * PAGE_SIZE + 1;
  const end = Math.min(data.value.page * PAGE_SIZE, data.value.totalCount);
  return `${start}–${end}`;
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
    toastError('혜택 상세를 불러오지 못했습니다.');
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

/**
 * 노출 상태 변경.
 * 되돌릴 수 있는 작업이지만 추천 결과가 즉시 달라지므로 한 번 확인한다.
 */
async function askToggle(b) {
  const turningOff = b.effectiveStatus === 'Y';

  const ok = await confirmDialog({
    title: turningOff ? '비활성화할까요?' : '다시 활성화할까요?',
    message: b.plcyNm,
    detail: turningOff
      ? '비활성화하면 추천 대상에서 제외됩니다. 데이터는 삭제되지 않습니다.\n'
        + '지정한 상태는 원본과 별도로 저장되므로 동기화를 실행해도 유지됩니다.'
      : '다시 추천 대상에 포함됩니다.\n'
        + '지정한 상태는 원본과 별도로 저장되므로 동기화를 실행해도 유지됩니다.',
    confirmText: turningOff ? '비활성화' : '활성화',
  });
  if (!ok) return;

  const next = turningOff ? 'N' : 'Y';
  togglingNo.value = b.benefitNo;

  try {
    // 목록 전체를 다시 부르지 않고 해당 행만 갱신한다.
    // 내가 보낸 값이 아니라 응답을 그대로 반영해야 한다.
    // API 원본과 같은 값을 지정하면 서버가 지정을 만들지 않고 바로 해제하는데,
    // 보낸 값을 쓰면 화면만 '지정됨'으로 남아 새로고침해야 맞아진다.
    const updated = await adminApi.changeBenefitActive(b.benefitNo, next);
    b.isActive = updated.isActive;
    b.adminIsActive = updated.adminIsActive;
    b.apiIsActive = updated.apiIsActive;
    b.effectiveStatus = updated.effectiveStatus;

    toastSuccess(
      updated.effectiveStatus === 'Y'
        ? '활성으로 바꿨습니다. 추천 대상에 포함됩니다.'
        : '비활성으로 바꿨습니다. 추천 대상에서 제외됩니다.'
    );
  } catch (e) {
    toastError('상태 변경에 실패했습니다.');
    console.error(e);
  } finally {
    togglingNo.value = null;
  }
}

/**
 * 관리자 지정 해제.
 * 해제하면 다음 동기화에서 상태가 바뀔 수 있으므로 한 번 확인한다.
 */
async function askClear(b) {
  const ok = await confirmDialog({
    title: '관리자 지정을 해제할까요?',
    message: b.plcyNm,
    detail: '해제하면 이 정책은 다시 온통청년이 내려주는 상태를 따릅니다.\n'
          + '다음 동기화에서 상태가 바뀔 수 있습니다.',
    confirmText: '해제',
  });
  if (!ok) return;

  togglingNo.value = b.benefitNo;

  try {
    // 빈 값을 보내면 서버가 지정을 해제하고 다시 원본을 따르게 한다
    const updated = await adminApi.changeBenefitActive(b.benefitNo, '');
    b.isActive = updated.isActive;
    b.adminIsActive = updated.adminIsActive;
    b.apiIsActive = updated.apiIsActive;
    b.effectiveStatus = updated.effectiveStatus;

    toastSuccess('지정을 해제했습니다. 다시 온통청년 값을 따릅니다.');
  } catch (e) {
    toastError('지정 해제에 실패했습니다.');
    console.error(e);
  } finally {
    togglingNo.value = null;
  }
}

// 네 종류 중 하나라도 있으면 배지 영역을, 하나도 없으면 '—' 를 보여준다
function hasRule(b) {
  return !!b.conflictGroupCode
      || b.pairRuleCount > 0
      || b.externalRuleCount > 0
      || b.reviewRuleCount > 0;
}

function categoryName(code) {
  return CATEGORY[code] || '기타';
}

/**
 * 최종 노출 상태의 색과 문구.
 * 세 컬럼(api_deleted_yn · admin_is_active · is_active)을 서버가 합쳐
 * effectiveStatus 하나로 내려주므로 화면은 그것만 본다.
 */
function statusBadge(b) {
  if (b.effectiveStatus === 'D') return 'a-bdg-dngr';
  return b.effectiveStatus === 'Y' ? 'a-bdg-ok' : 'a-bdg-mute';
}

/*
 * 색과 함께 형태도 같이 실어준다.
 * 색만으로 구분하면 색약인 사람과 흑백 인쇄에서 활성·비활성이 같아 보인다.
 */
function statusMark(b) {
  if (b.effectiveStatus === 'D') return '✕';
  return b.effectiveStatus === 'Y' ? '●' : '○';
}

function statusText(b) {
  if (b.effectiveStatus === 'D') return '삭제';
  return b.effectiveStatus === 'Y' ? '활성' : '비활성';
}

// 값이 0이면 흐리게 뺀다
function numClass(v) {
  return Number(v || 0) === 0 ? 'a-zero' : 'a-val';
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

/*
 * 마감 임박의 색.
 *
 * 예전에는 3일 이내를 빨강으로 칠했다. 빨강은 되돌릴 수 없는 것(삭제)에만
 * 쓰기로 했으므로 여기서는 쓰지 않는다. 마감은 시간이 지나면 저절로 오는 것이지
 * 관리자가 잘못한 것이 아니다.
 */
function ddayBadge(b) {
  if (b.aplyPrdSeCd === '0057003') return 'a-bdg-mute';
  if (b.aplyPrdSeCd === '0057002') return 'a-bdg-plain';
  if (b.dday === null || b.dday === undefined) return 'a-bdg-plain';
  if (b.dday < 0) return 'a-bdg-mute';
  if (b.dday <= 7) return 'a-bdg-warn';
  return 'a-bdg-plain';
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
.mb-3 { margin-bottom: 14px; }
.mt-2 { margin-top: 10px; }

/* ---- 필터 ---- */
.f-top {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 18px;
}

.f-ico { color: var(--a-c400); }

.f-legend {
  margin-top: 16px;
  line-height: 2.1;
}

.f-sep {
  margin: 0 7px;
  color: var(--a-c300);
}

/* ---- 표 ---- */
/* 열이 많아 좁은 창에서는 표만 가로로 흐르게 한다.
   화면 전체가 흔들리면 사이드바까지 밀린다 */
.t-wrap { overflow-x: auto; }

.a-tbl td { word-break: keep-all; }

/* 관리 열은 다른 문자 열처럼 왼쪽에서 읽고,
   버튼 뒤에는 카드 경계와 맞닿지 않도록 여백을 남긴다. */
.a-t-act {
  text-align: left;
  padding-right: 24px;
}

.t-rules {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.t-slash { color: var(--a-c300); margin: 0 2px; }

/* 관리자가 지정한 상태임을 배지 아래 작게 알리고 되돌릴 길을 함께 둔다 */
.t-mark {
  font-size: var(--a-t-cap);
  color: var(--a-c400);
  margin-top: 4px;
  white-space: nowrap;
}

.t-clear {
  border: 0;
  background: none;
  padding: 0 0 0 5px;
  font-family: var(--a-font);
  font-size: var(--a-t-cap);
  color: var(--a-c400);
  text-decoration: underline;
  cursor: pointer;
}

.t-clear:hover { color: var(--a-c900); }
.t-clear:disabled { opacity: 0.4; cursor: default; }

/* ---- 상세 ---- */
.d-badges { display: flex; gap: 5px; flex-wrap: wrap; }

.d-note { color: var(--a-warn); }

.d-url {
  margin-top: 20px;
  background: var(--a-c50);
  border: var(--a-bd);
  border-radius: var(--a-r);
  padding: 16px;
}

.d-url-h {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 10px;
}

.d-url-row {
  display: flex;
  gap: 10px;
  font-size: var(--a-t-sm);
  line-height: 1.8;
}

.d-url-k {
  flex: 0 0 76px;
  color: var(--a-c500);
}

/* 긴 주소가 상자 폭을 밀어내지 않도록 강제로 줄바꿈한다 */
.d-url-v {
  flex: 1 1 auto;
  word-break: break-all;
}

.d-none { color: var(--a-dngr); }

.d-url-form {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}

.d-url-form input {
  flex: 1 1 auto;
  height: var(--a-h);
  border: var(--a-bd-ctl);
  border-radius: var(--a-r);
  padding: 0 12px;
  font-family: var(--a-font);
  font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md);
  outline: 0;
  color: var(--a-c900);
  background: var(--a-c0);
}

.d-url-form input:focus { border-color: var(--a-c400); }
</style>
