<template>
  <div>
    <div class="a-head">
      <div><h1>중복수혜 검수</h1></div>
      <p>AI가 찾은 정책 관계를 한 건씩 확인하고 확정합니다.</p>
      <div class="a-head-act">
        <button class="a-btn" :disabled="running" @click="onRunAll">
          {{ running ? '분석 중…' : 'AI 분석 실행' }}
        </button>
        <button class="a-btn a-btn-dark" :disabled="publishing" @click="onPublish">
          {{ publishing ? '반영 중…' : '확정분 엔진 반영' }}
        </button>
      </div>
    </div>

    <!--
      전체 그림.

      윗줄이 흐름, 아랫줄이 그 안에서 무엇이 어디로 갔는지다.
      ★ 두 줄의 칸 경계를 맞춘다. 아래 칸이 위 칸 안쪽에 들어가 있어야
        141건이 어디서 셋으로 갈라졌는지가 선만 보고 읽힌다.
      칸 폭은 안에 든 개수에 맞춰 나눈다.
    -->
    <div v-if="sum" class="flow">
      <div class="f-grid">
        <div class="fn">
          <div class="fn-v a-num">{{ n(sum.total_benefit) }}</div>
          <div class="fn-l">전체 정책</div>
          <div class="fn-d">동기화로 적재된 건수</div>
        </div>
        <div class="fn">
          <div class="fn-v a-num">{{ n(sum.candidate) }}</div>
          <div class="fn-l">AI가 뽑은 관계</div>
          <div class="fn-d">제한 표현을 찾은 건</div>
        </div>
        <div class="fn">
          <div class="fn-v a-num">{{ n(autoCount) }}</div>
          <div class="fn-l">자동 처리</div>
          <div class="fn-d">사람 손이 필요 없던 건</div>
        </div>
        <div class="fn is-end">
          <div class="fn-v a-num">{{ n(mineCount) }}</div>
          <div class="fn-l">사람이 볼 것</div>
          <div class="fn-d">근거만으로 결론 낼 수 없던 건</div>
        </div>
      </div>

      <div class="f-grid f-grid2">
        <!--
          전체 정책 아래.
          이 숫자가 사실 이 시스템에서 가장 중요하다.
          2,700건을 전부 AI에 태우지 않고 걸러냈다는 뜻이기 때문이다.
        -->
        <div class="slot">
          <div class="subs subs-1">
            <div class="sub">
              <div class="sub-top"><span class="sub-n">AI 미호출</span>
                <b class="sub-v a-num">{{ n(notCalled) }}</b></div>
              <div class="sub-d">제한 표현이 없어 읽지 않음</div>
            </div>
          </div>
        </div>

        <div class="slot">
          <div class="subs subs-1">
            <div class="sub">
              <div class="sub-top"><span class="sub-n">정보 대기</span>
                <b class="sub-v a-num" :class="zeroClass(sum.pending_data)">
                  {{ n(sum.pending_data) }}</b></div>
              <div class="sub-d">상대 정책을 특정하지 못함</div>
            </div>
          </div>
        </div>

        <div class="slot">
          <div class="subs subs-3">
            <div class="sub">
              <div class="sub-top"><span class="sub-n">외부 안내</span>
                <b class="sub-v a-num" :class="zeroClass(sum.auto_warning)">
                  {{ n(sum.auto_warning) }}</b></div>
              <div class="sub-d">DB에 없는 제도</div>
            </div>
            <div class="sub">
              <div class="sub-top"><span class="sub-n">자동 규칙</span>
                <b class="sub-v a-num" :class="zeroClass(sum.auto_rule)">
                  {{ n(sum.auto_rule) }}</b></div>
              <div class="sub-d">양쪽이 서로 지목</div>
            </div>
            <div class="sub">
              <div class="sub-top"><span class="sub-n">폐기</span>
                <b class="sub-v a-num" :class="zeroClass(sum.discarded)">
                  {{ n(sum.discarded) }}</b></div>
              <div class="sub-d">같은 사업 안의 조건</div>
            </div>
          </div>
        </div>

        <div class="slot">
          <div class="subs subs-2">
            <div class="sub is-mine">
              <div class="sub-top"><span class="sub-n">확인 필요</span>
                <b class="sub-v a-num">{{ reviewCount }}</b></div>
              <div class="sub-d">지금 판정할 것</div>
            </div>
            <div class="sub is-mine">
              <div class="sub-top"><span class="sub-n">보류</span>
                <b class="sub-v a-num">{{ deferredCount }}</b></div>
              <div class="sub-d">미뤄둔 것</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="running" class="a-notice a-notice-info mb-3">
      <div>
        <b>공고문을 분석하고 있습니다.</b>
        정책 수에 따라 몇 분이 걸릴 수 있습니다.
        이 화면을 닫아도 분석은 계속 진행됩니다.
      </div>
    </div>

    <div v-if="loading" class="a-loading">
      <span class="a-spin"></span> 불러오는 중
    </div>

    <div v-else>
      <div class="a-tabs">
        <button class="a-tab" :class="{ 'is-active': mode === 'review' }"
                @click="switchMode('review')">
          확인 필요 <span class="a-n a-num">{{ reviewCount }}</span>
        </button>
        <button class="a-tab" :class="{ 'is-active': mode === 'deferred' }"
                @click="switchMode('deferred')">
          보류 중 <span class="a-n a-num">{{ deferredCount }}</span>
        </button>

        <div v-if="queue.length" class="tab-nav">
          <span class="a-num tab-pos">{{ index + 1 }} / {{ queue.length }}</span>
          <button class="a-pg" :disabled="index <= 0" @click="move(-1)">‹</button>
          <button class="a-pg" :disabled="index >= queue.length - 1" @click="move(1)">›</button>
        </div>
      </div>

      <div v-if="!queue.length" class="a-card">
        <div class="a-empty">
          {{ mode === 'review' ? '확인할 항목이 없습니다.' : '보류 중인 항목이 없습니다.' }}
        </div>
      </div>

      <div v-else>
        <div class="bar"><div class="bar-fill" :style="{ width: pct + '%' }"></div></div>

        <!-- 왜 이 건이 관리자에게 왔는지 -->
        <div class="a-notice mb-3" :class="reasonClass">
          <span class="rs-ico">◈</span>
          <div><b>{{ reasonLabel }}</b> {{ reasonHelp }}</div>
        </div>

        <div v-if="mode === 'deferred'" class="a-hint mb-3">
          {{ formatDeferred(cur.deferred_until) }}까지 보류 중입니다. 지금 판정하면 즉시 반영됩니다.
        </div>

        <!-- 좌우 비교 -->
        <div class="pair">
          <section class="pol is-base">
            <div class="pol-h">
              <div class="pol-role">기준 정책</div>
              <div class="pol-t">{{ cur.source_plcy_nm }}</div>
              <div class="pol-m">
                <span class="a-bdg a-bdg-plain">{{ cur.source_inst }}</span>
              </div>
            </div>
            <div class="pol-b">
              <div class="pol-why">
                이 정책의 공고문에서 다른 정책과의 중복 제한 문구가 발견되었습니다.
              </div>

              <div class="ev-l">
                공고문 근거
                <span v-if="cur.evidence_verified === 'N'" class="a-bdg a-bdg-warn a-bdg-dash">
                  원문 대조 실패
                </span>
                <span v-else class="a-bdg a-bdg-ok">원문 대조 통과</span>
              </div>
              <div class="ev" v-html="highlighted"></div>

              <div v-if="cur.evidence_verified === 'N'" class="ev-warn">
                아래 정책명이 이 문장 안에 없습니다. 다른 곳에서 가져왔거나 잘못 추출했을 수 있습니다.
              </div>
            </div>
          </section>

          <section class="pol">
            <div class="pol-h">
              <div class="pol-role">비교 정책</div>
              <div class="pol-t">{{ targetName }}</div>
              <div class="pol-m">
                <span class="a-bdg a-bdg-plain">{{ cur.mapped_inst }}</span>
                <span v-if="cur.mapped_active && cur.mapped_active !== 'Y'"
                      class="a-bdg a-bdg-mute">마감</span>
              </div>
            </div>
            <div class="pol-b">
              <div class="pol-why">
                기준 정책 공고문에 이 정책명이 적혀 있어 시스템이 연결했습니다.
              </div>

              <div class="ev-l">
                상대 공고 대조
                <span class="a-bdg" :class="crossOk ? 'a-bdg-ok' : 'a-bdg-warn a-bdg-dash'">
                  {{ crossOk ? '서로 지목함' : '찾지 못함' }}
                </span>
              </div>
              <div class="cross">
                <div class="c-row">
                  <span>기준 정책 언급</span>
                  <strong :class="crossOk ? 'is-ok' : 'is-no'">{{ crossMention }}</strong>
                </div>
                <div class="c-row">
                  <span>본문에 적힌 이름</span>
                  <strong>{{ cur.target_name_raw }}</strong>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- 시스템이 확인한 것과 못한 것 -->
        <div class="facts">
          <div class="fact is-yes">
            <h4>시스템이 확인한 사실</h4>
            <ul><li>{{ factKnown }}</li></ul>
          </div>
          <div class="fact is-no">
            <h4>아직 확정되지 않은 부분</h4>
            <ul><li>{{ factUnknown }}</li></ul>
          </div>
        </div>

        <!-- 판정 -->
        <section class="a-card decide">
          <div class="decide-q">이 두 정책은 어떤 관계입니까?</div>
          <div class="decide-g" :class="{ 'is-three': mode !== 'review' }">
            <button class="vb" :disabled="busy" @click="askDecide('BLOCK')">
              <b>함께 받을 수 없음</b><span>둘 중 하나만 가능</span>
            </button>
            <button class="vb" :disabled="busy" @click="askDecide('PARTIAL')">
              <b>함께 받되 제한 있음</b><span>지원 금액이나 범위가 달라짐</span>
            </button>
            <button class="vb" :disabled="busy" @click="askDecide('NOT_CONFLICT')">
              <b>중복 관계 아님</b><span>제한 관계가 아님</span>
            </button>
            <!-- 보류 목록에서는 이 버튼이 의미가 없다. 이미 보류 중이다 -->
            <button v-if="mode === 'review'" class="vb" :disabled="busy" @click="onDefer">
              <b>판단 보류</b><span>근거가 부족함</span>
            </button>
          </div>
          <div class="a-hint decide-effect">{{ effectText }}</div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import conflictApi from '@/api/conflictApi'
import { useAdminDialog } from '@/composables/useAdminDialog'
import { useAdminBadge } from '@/composables/useAdminBadge'

/*
 * 알림은 관리자 화면 공용 상자를 쓴다.
 *
 * 예전에는 이 화면이 자기 토스트를 갖고 있었고,
 * 확인은 window.confirm 을, 결과 안내는 alert 을 썼다.
 *
 * confirm 을 바꾼 이유가 특히 중요하다.
 * 브라우저는 confirm 을 억제할 수 있는데, 그러면 아무것도 묻지 않고 그냥 지나간다.
 * 전체 분석은 몇 분이 걸리고 API 비용도 드는 작업이라
 * "정말 실행할까요" 가 조용히 사라지면 안 된다.
 */
const { toastSuccess, toastError, confirmDialog } = useAdminDialog()

/*
 * 사이드바 배지.
 *
 * 판정하면 여기 목록에서는 항목이 빠지지만 사이드바 숫자는 그대로였다.
 * 화면을 옮기기 전까지 관리자는 아직 15건이 남은 줄 알았다.
 * 판정·보류·엔진 반영 직후에 직접 다시 세게 한다.
 */
const { refresh: refreshBadge } = useAdminBadge()

const mode = ref('review')
const reviewList = ref([])
const deferredList = ref([])
const sum = ref(null)
const index = ref(0)
const loading = ref(true)
const busy = ref(false)
const publishing = ref(false)
const running = ref(false)

const queue = computed(() => (mode.value === 'review' ? reviewList.value : deferredList.value))
const reviewCount = computed(() => reviewList.value.length)
const deferredCount = computed(() => deferredList.value.length)
const mineCount = computed(() => reviewCount.value + deferredCount.value)

const cur = computed(() => queue.value[index.value] || {})
const targetName = computed(() => cur.value.mapped_plcy_nm || cur.value.target_name_raw || '')

const pct = computed(() =>
  queue.value.length ? Math.round((index.value / queue.value.length) * 100) : 0
)

const autoCount = computed(() => {
  if (!sum.value) return 0
  return Number(sum.value.auto_warning || 0)
      + Number(sum.value.auto_rule || 0)
      + Number(sum.value.discarded || 0)
})

/*
 * AI 를 아예 부르지 않은 건수.
 *
 * 이 숫자가 사실 이 시스템에서 가장 중요하다.
 * 2,700건을 전부 AI 에 태웠다면 비용도 시간도 감당이 안 된다.
 * 룰 필터로 먼저 걸러냈다는 사실이 여기서 보인다.
 */
const notCalled = computed(() => {
  if (!sum.value) return 0
  return Math.max(0, Number(sum.value.total_benefit || 0) - Number(sum.value.candidate || 0))
})

// 숫자에 자릿수 구분을 넣는다. 2720 과 2,720 은 훑는 속도가 다르다
function n(v) {
  return Number(v || 0).toLocaleString()
}

// 값이 0이면 흐리게 뺀다. 0 이 다른 숫자와 같은 굵기면 눈이 계속 거기 걸린다
function zeroClass(v) {
  return Number(v || 0) === 0 ? 'is-zero' : ''
}

// 왜 이 건이 관리자에게 왔는지를 사람 말로 바꾼다.
// "이건 왜 나한테 왔나" 를 묻게 만들면 판정 시간이 길어진다.
//
// 색은 뜻을 고정해 쓴다.
//   초록 — 판단만 남은 정상 상태
//   파랑 — 조건이 붙어 정보가 더 필요한 상태
//   주황 — 확인이 필요한 상태
// 빨강은 되돌릴 수 없는 것에만 쓰므로 여기서는 쓰지 않는다.
const REASONS = {
  RELATION_CHECK: {
    label: '관계 확인이 필요합니다.',
    help: '두 정책은 특정됐습니다. 실제 중복 관계인지 판단해주세요.',
    cls: 'a-notice-ok',
  },
  DIRECTION_UNKNOWN: {
    label: '한쪽 공고에만 근거가 있습니다.',
    help: '기준 정책만 상대를 지목했고, 상대 공고문은 기준 정책을 언급하지 않았습니다.',
    cls: '',
  },
  COMBINATION_APPLICABILITY_UNKNOWN: {
    label: '동시 신청 가능 여부가 불명확합니다.',
    help: '제한은 있지만 둘을 함께 신청하는 것까지 막는지는 공고문에 없습니다.',
    cls: '',
  },
  CONDITIONAL: {
    label: '조건이 붙은 제한입니다.',
    help: '금액이 조정되는지 자격이 제한되는지에 따라 처리가 달라집니다.',
    cls: 'a-notice-info',
  },
  CONTRADICTORY_EVIDENCE: {
    label: '양쪽 공고의 내용이 다릅니다.',
    help: '한쪽은 불가, 한쪽은 가능이라고 합니다. 최신 공고를 확인해주세요.',
    cls: '',
  },
  EXTRACTION_INVALID: {
    label: '추출된 근거가 맞지 않습니다.',
    help: '정책명이 근거 문장 안에 없습니다. 대부분 관계 아님으로 처리하면 됩니다.',
    cls: '',
  },
}
const R = computed(() => REASONS[cur.value.review_reason] || REASONS.RELATION_CHECK)
const reasonLabel = computed(() => R.value.label)
const reasonHelp = computed(() => R.value.help)
const reasonClass = computed(() => R.value.cls)

const crossOk = computed(() => cur.value.crosscheck_result === 'MUTUAL')
const crossMention = computed(() =>
  crossOk.value ? '있음' : '현재 공고에서 찾지 못함'
)

const factKnown = computed(() =>
  '기준 정책 공고에 비교 정책명이 중복 제한 항목으로 적혀 있습니다.'
)
const factUnknown = computed(() => {
  if (crossOk.value) return '양쪽 공고가 서로를 지목했습니다. 남은 것은 최종 확인뿐입니다.'
  return '비교 정책 공고에서는 반대 방향의 제한 근거를 찾지 못했습니다.'
})

// 누르면 무슨 일이 생기는지 미리 알려준다.
// 특히 한쪽 근거만 있을 때 대칭 규칙이 되지 않는다는 점이 중요하다.
const effectText = computed(() => {
  if (crossOk.value) {
    return '함께 받을 수 없음으로 확정하면 두 정책이 함께 든 추천 조합이 제외됩니다.'
  }
  return '한쪽 공고에만 근거가 있으므로, 함께 받을 수 없음을 선택해도 '
       + '조합에서 제외하지 않고 사용자에게 확인 안내만 표시합니다.'
})

/*
 * 판정별 문구.
 *
 * label — 확인창에 보여줄 이름
 * effect — 확정하면 실제로 무엇이 바뀌는지
 * done — 처리 후 토스트
 */
const DECISIONS = {
  BLOCK: {
    label: '함께 받을 수 없음',
    effect: () => crossOk.value
      ? '두 정책이 함께 든 추천 조합에서 제외됩니다. 사용자는 둘 중 하나만 추천받습니다.'
      : '한쪽 공고에만 근거가 있으므로 조합에서 제외하지 않고 사용자에게 확인 안내만 표시합니다.',
    done: '함께 받을 수 없는 관계로 처리했습니다.',
  },
  PARTIAL: {
    label: '함께 받되 제한 있음',
    effect: () => '추천에는 그대로 남고, 금액이 조정될 수 있다는 안내가 붙습니다.',
    done: '함께 받되 제한이 있는 관계로 처리했습니다.',
  },
  NOT_CONFLICT: {
    label: '중복 관계 아님',
    effect: () => '규칙을 만들지 않고 이 관계를 폐기합니다. 두 정책은 계속 함께 추천됩니다.',
    done: '중복 관계 아님으로 처리했습니다.',
  },
}

// 근거 문장에서 추출된 이름을 눈에 띄게 한다.
// 공고문을 열지 않아도 되게 만드는 핵심이다.
const highlighted = computed(() => {
  const text = esc(cur.value.evidence_text || '')
  const name = cur.value.target_name_raw
  if (!name) return text
  const safe = esc(name).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return text.replace(new RegExp(safe, 'g'), `<mark>${esc(name)}</mark>`)
})
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 보류 만료일 표시.
// DB 의 DATETIME 이 JSON 으로 나갈 때 문자열이 아니라
// 숫자나 배열로 바뀌는 경우가 있어 세 형태를 모두 받는다.
function formatDeferred(v) {
  if (v === null || v === undefined || v === '') return ''

  if (Array.isArray(v)) {
    return `${Number(v[1])}월 ${Number(v[2])}일`
  }

  if (typeof v === 'string') {
    const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/)
    if (m) return `${Number(m[2])}월 ${Number(m[3])}일`
  }

  const d = new Date(v)
  return isNaN(d.getTime()) ? '' : `${d.getMonth() + 1}월 ${d.getDate()}일`
}

function switchMode(m) {
  mode.value = m
  index.value = 0
}

/*
 * 판정하지 않고 앞뒤로 옮긴다.
 *
 * 예전에는 판정해야만 다음으로 넘어갈 수 있었다.
 * 애매한 건에서 막히면 뒤에 있는 쉬운 건도 손대지 못했다.
 */
function move(step) {
  const next = index.value + step
  if (next < 0 || next >= queue.value.length) return
  index.value = next
}

// 요약만 따로 다시 읽는다.
// 판정하면 확정 건수가 늘어 자동 처리 쪽 숫자도 바뀌는데,
// 목록을 통째로 다시 부르면 보고 있던 자리를 잃는다.
async function reloadSummary() {
  try {
    sum.value = await conflictApi.getSummary()
  } catch (e) {
    // 요약은 보조 정보다. 실패해도 검수는 계속할 수 있다
  }
}

async function load() {
  loading.value = true
  try {
    const [r, d] = await Promise.all([
      conflictApi.getQueue(),
      conflictApi.getDeferred(),
    ])
    reviewList.value = r
    deferredList.value = d
    index.value = 0
  } finally {
    loading.value = false
  }

  // 요약은 보조 정보다. 실패해도 목록은 보여야 한다.
  await reloadSummary()

  refreshBadge()
}

// 처리한 항목은 지금 보고 있는 목록에서만 뺀다.
// 목록 전체를 다시 불러오면 위치를 잃어 흐름이 끊긴다.
function next(msg) {
  const list = mode.value === 'review' ? reviewList.value : deferredList.value
  list.splice(index.value, 1)
  if (index.value >= list.length) index.value = Math.max(0, list.length - 1)
  toastSuccess(msg)

  refreshBadge()
  reloadSummary()
}

/**
 * ★ 판정은 확인창을 거친다.
 *
 * 예전에는 버튼을 누르는 즉시 저장되고 다음 건으로 넘어갔다.
 * 손이 미끄러지면 되돌릴 방법이 없었다.
 *
 * 확인창에 정책명 두 개를 다시 보여주는 것이 핵심이다.
 * 잘못 누르는 경우는 대개 다음 건으로 넘어간 줄 모르고
 * 이전 건의 감각으로 누를 때 생긴다.
 *
 * 「판단 보류」는 막지 않는다. 7일 뒤 다시 올라오는 되돌릴 수 있는 선택이고,
 * 매번 확인창을 띄우면 15건 도는 데 클릭이 두 배가 된다.
 */
async function askDecide(decision) {
  const d = DECISIONS[decision]
  if (!d) return

  const ok = await confirmDialog({
    title: '이 판정으로 확정할까요?',
    message: `「${d.label}」`,
    detail:
      `기준 정책 · ${cur.value.source_plcy_nm}\n`
      + `비교 정책 · ${targetName.value}\n\n`
      + `${d.effect()}\n\n`
      + (mode.value === 'deferred'
        ? '보류 중이던 건입니다. 확정하면 즉시 반영되고 보류 목록에서 빠집니다.'
        : '확정하면 이 건은 검수 목록에서 빠집니다.'),
    confirmText: '확정',
  })
  if (!ok) return

  await onDecide(decision)
}

async function onDecide(decision) {
  busy.value = true
  try {
    await conflictApi.decide(cur.value.candidate_no, decision)
    next(DECISIONS[decision].done)
  } catch (e) {
    // 예전에는 catch 가 없었다.
    // 저장이 실패하면 항목이 목록에 그대로 남는데,
    // 관리자는 왜 안 넘어가는지 알 수 없었다.
    toastError('판정을 저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    busy.value = false
  }
}

async function onDefer() {
  busy.value = true
  try {
    await conflictApi.defer(cur.value.candidate_no, 7)
    next('판단을 보류했습니다. 보류 목록에서 다시 볼 수 있습니다.')
    // 보류 목록에 새로 들어갔으므로 다시 읽는다
    deferredList.value = await conflictApi.getDeferred()
  } catch (e) {
    toastError('보류 처리에 실패했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    busy.value = false
  }
}

/**
 * 분석 전 구간을 한 번에 실행한다.
 * 정책 하나마다 AI 를 부르므로 몇 분이 걸린다.
 */
async function onRunAll() {
  const ok = await confirmDialog({
    title: 'AI 분석 실행',
    message: '전체 정책을 분석합니다.',
    detail: '정책 수에 따라 몇 분이 걸릴 수 있습니다.\n이 화면을 닫아도 분석은 계속 진행됩니다.',
    confirmText: '실행',
  })
  if (!ok) return

  running.value = true
  try {
    const r = await conflictApi.runAll()
    const sec = Math.round((r.durationMs || 0) / 1000)
    toastSuccess(
      `분석 완료 (${sec}초)\n`
      + `분석 대상 ${r.candidateTotal}건 · `
      + `상대 공고 대조 ${r.crossCheck?.MUTUAL ?? 0}건 양방향 확인`,
      6000
    )
    await load()
  } catch (e) {
    toastError('분석 중 오류가 발생했습니다. 서버 로그를 확인해주세요.')
  } finally {
    running.value = false
  }
}

/**
 * 확정된 판정을 추천 엔진이 읽는 규칙으로 내보낸다.
 *
 * 되돌리기가 어려운 작업이라 확인을 한 번 받는다.
 */
async function onPublish() {
  const ok = await confirmDialog({
    title: '확정분 엔진 반영',
    message: '확정된 판정을 추천 엔진이 사용하는 규칙으로 반영합니다.',
    detail: '반영된 규칙은 사용자 화면의 추천 결과에 바로 영향을 줍니다.',
    confirmText: '반영',
  })
  if (!ok) return

  publishing.value = true
  try {
    const r = await conflictApi.publish()
    toastSuccess(
      `엔진 반영 완료\n중복 규칙 ${r.pairRule}건 · 확인 안내 ${r.externalWarning}건`,
      6000
    )
    // 반영하면 자동 처리 쪽 숫자가 바뀐다.
    // 사이드바 배지도 함께 맞춘다
    await reloadSummary()
    refreshBadge()
  } catch (e) {
    toastError('엔진 반영에 실패했습니다. 서버 로그를 확인해주세요.')
  } finally {
    publishing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.mb-3 { margin-bottom: 14px; }

/* ============================================================
   흐름 요약
   위아래 두 줄이 같은 칸 비율을 쓴다.
   ============================================================ */
.flow {
  background: var(--a-c0);
  border: var(--a-bd);
  border-radius: var(--a-r-lg);
  margin-bottom: 16px;
  overflow: hidden;
}

/* 칸 폭은 안에 든 개수에 맞춰 나눈다.
   넷을 똑같이 나누면 세 칸이 들어가는 자리만 눌린다 */
.f-grid {
  display: grid;
  grid-template-columns: 0.9fr 0.9fr 1.5fr 1.1fr;
}

.fn { padding: 16px; border-right: var(--a-bd); }
.fn:last-child { border-right: 0; }

.fn-v {
  font-size: var(--a-t-num);
  letter-spacing: var(--a-ls-num);
  font-weight: 600;
  line-height: 1.1;
}

.fn-l {
  color: var(--a-c700);
  font-size: var(--a-t-md);
  margin-top: 4px;
  font-weight: 600;
}

.fn-d { color: var(--a-c500); font-size: var(--a-t-sm); margin-top: 2px; }

/* 관리자가 실제로 손대야 하는 칸. 노랑을 쓰는 유일한 자리 */
.fn.is-end {
  background: var(--a-kb-soft);
  box-shadow: inset 3px 0 0 var(--a-kb);
}

.f-grid2 { border-top: var(--a-bd); }

.slot { border-right: var(--a-bd); }
.slot:last-child { border-right: 0; }

.subs { display: grid; height: 100%; }
.subs-1 { grid-template-columns: 1fr; }
.subs-2 { grid-template-columns: repeat(2, 1fr); }
.subs-3 { grid-template-columns: repeat(3, 1fr); }

.sub { padding: 12px 14px; border-right: 1px solid var(--a-c100); }
.sub:last-child { border-right: 0; }

/* 이름과 숫자를 한 줄에 붙이고 설명을 한 줄로 고정한다.
   설명 길이가 제각각이면 칸마다 아랫변이 안 맞는다 */
.sub-top { display: flex; align-items: baseline; gap: 6px; }
.sub-n { font-size: var(--a-t-sm); color: var(--a-c600); font-weight: 600; }
.sub-v {
  margin-left: auto;
  font-size: var(--a-t-lg);
  letter-spacing: var(--a-ls-lg);
  font-weight: 700;
}
.sub-v.is-zero { color: var(--a-c300); font-weight: 400; }
.sub-d {
  color: var(--a-c400);
  font-size: var(--a-t-cap);
  margin-top: 5px;
  height: 17px;
  overflow: hidden;
}

.sub.is-mine { background: var(--a-kb-soft); }
.sub.is-mine .sub-v { color: var(--a-warn); }

/* ============================================================
   진행
   ============================================================ */
.tab-nav {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 6px;
}
.tab-pos { color: var(--a-c500); font-size: var(--a-t-sm); }

.bar {
  height: 3px;
  background: var(--a-c100);
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 14px;
}
.bar-fill { height: 100%; background: var(--a-c900); transition: width 0.2s; }

.rs-ico { color: currentColor; opacity: 0.6; }

/* ============================================================
   좌우 비교
   ============================================================ */
.pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.pol {
  background: var(--a-c0);
  border: var(--a-bd);
  border-radius: var(--a-r-lg);
  overflow: hidden;
}

/* 기준 정책 쪽을 조금 더 진한 테두리로 둔다.
   좌우가 완전히 같으면 어느 쪽이 근거를 가진 쪽인지 매번 다시 읽어야 한다 */
.pol.is-base { border-color: var(--a-c400); }

.pol-h { padding: 14px; border-bottom: var(--a-bd); background: var(--a-c50); }

.pol-role {
  font-size: var(--a-t-cap);
  letter-spacing: var(--a-ls-cap);
  color: var(--a-c500);
  font-weight: 600;
}

.pol-t {
  font-size: var(--a-t-lg);
  letter-spacing: var(--a-ls-lg);
  font-weight: 700;
  margin-top: 5px;
  line-height: 1.4;
}

.pol-m { display: flex; flex-wrap: wrap; gap: 5px; margin-top: 9px; }

.pol-b { padding: 14px; }

.pol-why {
  font-size: var(--a-t-sm);
  color: var(--a-c500);
  line-height: 1.6;
  margin-bottom: 12px;
}

.ev-l {
  font-size: var(--a-t-sm);
  color: var(--a-c500);
  font-weight: 600;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.ev {
  background: var(--a-c50);
  border: var(--a-bd);
  border-left: 2px solid var(--a-c400);
  border-radius: 0 var(--a-r) var(--a-r) 0;
  padding: 12px 14px;
  font-size: var(--a-t-md);
  line-height: 1.75;
  color: var(--a-c700);
  white-space: pre-wrap;
}

/*
  근거 문장 안의 정책명.
  예전에는 노란 형광펜이었는데, 노랑은 「지금 손대야 할 곳」 하나로 쓰기로 했다.
  여기서는 색이 아니라 형태(굵기·배경)로 눈에 띄게 한다.
*/
.ev :deep(mark) {
  background: var(--a-c200);
  color: var(--a-c900);
  font-weight: 700;
  padding: 1px 3px;
  border-radius: 2px;
}

.ev-warn {
  display: block;
  margin-top: 9px;
  font-size: var(--a-t-sm);
  color: var(--a-warn);
  line-height: 1.6;
}

.cross { border: var(--a-bd); border-radius: var(--a-r); }

.c-row {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  font-size: var(--a-t-md);
  border-bottom: 1px solid var(--a-c100);
}
.c-row:last-child { border-bottom: 0; }
.c-row span { color: var(--a-c500); flex-shrink: 0; }
.c-row strong { text-align: right; font-weight: 600; }
.c-row strong.is-ok { color: var(--a-ok); }
.c-row strong.is-no { color: var(--a-c400); font-weight: 500; }

/* ============================================================
   확인된 것 / 안 된 것
   ============================================================ */
.facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-bottom: 14px;
}

.fact {
  background: var(--a-c0);
  border: var(--a-bd);
  border-radius: var(--a-r-lg);
  padding: 14px;
}

.fact h4 {
  margin: 0 0 9px;
  font-size: var(--a-t-cap);
  letter-spacing: var(--a-ls-cap);
  color: var(--a-c500);
  font-weight: 600;
}

.fact ul { margin: 0; padding: 0; list-style: none; }

.fact li {
  font-size: var(--a-t-md);
  padding-left: 18px;
  position: relative;
  line-height: 1.6;
  color: var(--a-c700);
}

.fact li::before { position: absolute; left: 0; font-weight: 700; }
.fact.is-yes li::before { content: '✓'; color: var(--a-ok); }
.fact.is-no li::before { content: '?'; color: var(--a-warn); }

/* ============================================================
   판정
   ============================================================ */
.decide { padding: 16px; }

.decide-q { font-size: var(--a-t-md); color: var(--a-c500); margin-bottom: 12px; }

.decide-g {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}
/* 보류 목록에서는 「판단 보류」가 빠져 셋이 된다 */
.decide-g.is-three { grid-template-columns: repeat(3, 1fr); }

/*
  네 개를 같은 무게로 둔다.

  예전에는 「함께 받을 수 없음」만 노란색으로 채워져 있었다.
  판정은 근거를 읽은 결과지 기본값이 있어서는 안 된다.
  한쪽을 눈에 띄게 만들면 애매한 건에서 그쪽으로 손이 가고,
  잘못 막힌 정책은 사용자가 받을 수 있던 혜택을 잃는다.
*/
.vb {
  border: var(--a-bd-ctl);
  background: var(--a-c0);
  border-radius: var(--a-r);
  padding: 13px 14px;
  text-align: left;
  cursor: pointer;
  font-family: var(--a-font);
}

.vb b {
  display: block;
  font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md);
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--a-c900);
}

.vb span {
  display: block;
  color: var(--a-c400);
  font-size: var(--a-t-cap);
  line-height: 1.45;
}

.vb:hover { border-color: var(--a-c900); background: var(--a-c50); }
.vb:disabled { opacity: 0.45; cursor: default; }

.decide-effect { margin-top: 12px; }

@media (max-width: 1180px) {
  .f-grid { grid-template-columns: 1fr 1fr; }
  .fn, .slot { border-bottom: var(--a-bd); }
}

@media (max-width: 900px) {
  .pair, .facts { grid-template-columns: 1fr; }
  .decide-g, .decide-g.is-three { grid-template-columns: repeat(2, 1fr); }
}
</style>