<template>
  <div class="wrap">
    <div class="head">
      <div>
        <h2>중복수혜 관계 검수</h2>
        <p class="sub">
          시스템이 두 정책 사이에서 중복 제한 가능성을 발견했습니다.
          공고문 근거를 확인한 뒤 관계를 선택해주세요.
        </p>
      </div>
      <button class="btn-publish" :disabled="publishing" @click="onPublish">
        {{ publishing ? '반영 중...' : '확정분 엔진 반영' }}
      </button>
    </div>

    <!-- 전체 그림. 한 건씩만 보여주면 무슨 일을 하는지 알 수 없다 -->
    <div v-if="sum" class="summary">
      <div class="s-item">
        <em>전체 정책</em><b>{{ sum.total_benefit }}</b>
      </div>
      <span class="s-arrow">→</span>
      <div class="s-item">
        <em>AI 분석 결과</em><b>{{ sum.candidate }}</b>
      </div>
      <span class="s-arrow">→</span>
      <div class="s-item auto">
        <em>자동 처리</em><b>{{ autoCount }}</b>
        <small>안내 {{ sum.auto_warning }} · 규칙 {{ sum.auto_rule }} · 제외 {{ sum.discarded }}</small>
      </div>
      <div class="s-item wait">
        <em>정보 대기</em><b>{{ sum.pending_data }}</b>
        <small>다음 동기화에 재확인</small>
      </div>
      <div class="s-item me">
        <em>내가 확인할 것</em><b>{{ sum.review }}</b>
      </div>
    </div>

    <div v-if="loading" class="empty">불러오는 중...</div>
    <div v-else-if="!queue.length" class="empty done">확인할 항목이 없습니다.</div>

    <div v-else>
      <div class="progress">
        <span class="count">{{ index + 1 }} / {{ queue.length }}</span>
        <div class="bar"><div class="fill" :style="{ width: pct + '%' }"></div></div>
      </div>

      <!-- 왜 이 건이 왔는지 -->
      <div class="reason" :class="reasonClass">
        <strong>{{ reasonLabel }}</strong>
        <span>{{ reasonHelp }}</span>
      </div>

      <!-- 좌우 비교 -->
      <div class="compare">
        <section class="card">
          <span class="tag base">기준 정책</span>
          <h3>{{ cur.source_plcy_nm }}</h3>
          <p class="inst">{{ cur.source_inst }}</p>

          <div class="why">
            <b>왜 기준 정책인가요?</b>
            <p>이 정책의 공고문에서 다른 정책과의 중복 제한 문구가 발견되었습니다.</p>
          </div>

          <div class="label">공고문 근거</div>
          <div class="evidence" v-html="highlighted"></div>
          <span v-if="cur.evidence_verified === 'N'" class="warn">
            아래 정책명이 이 문장 안에 없습니다. 다른 곳에서 가져왔거나 잘못 추출했을 수 있습니다.
          </span>
        </section>

        <section class="card">
          <span class="tag cmp">비교 정책</span>
          <h3>{{ cur.mapped_plcy_nm || cur.target_name_raw }}</h3>
          <p class="inst">
            {{ cur.mapped_inst }}
            <em v-if="cur.mapped_active && cur.mapped_active !== 'Y'">· 마감</em>
          </p>

          <div class="why">
            <b>왜 이 정책과 비교하나요?</b>
            <p>기준 정책 공고문에 이 정책명이 적혀 있어 시스템이 연결했습니다.</p>
          </div>

          <div class="label">상대 공고 확인</div>
          <div class="cross">
            <div class="c-row">
              <span>기준 정책 언급</span>
              <strong :class="crossOk ? 'ok' : 'no'">{{ crossMention }}</strong>
            </div>
            <div class="c-row">
              <span>본문에 적힌 이름</span>
              <strong>{{ cur.target_name_raw }}</strong>
            </div>
          </div>
        </section>
      </div>

      <!-- 시스템이 확인한 것과 못한 것 -->
      <section class="card facts">
        <div class="label">현재까지 확인된 내용</div>
        <ul>
          <li class="ok">{{ factKnown }}</li>
          <li class="no">{{ factUnknown }}</li>
        </ul>
      </section>

      <!-- 판정 -->
      <section class="card decide">
        <h4>이 두 정책은 어떤 관계입니까?</h4>
        <div class="btns">
          <button class="b block" :disabled="busy" @click="onDecide('BLOCK')">
            <b>중복 불가</b><small>함께 신청할 수 없음</small>
          </button>
          <button class="b partial" :disabled="busy" @click="onDecide('PARTIAL')">
            <b>금액 조정</b><small>함께 받되 지원금이 줄어듦</small>
          </button>
          <button class="b not" :disabled="busy" @click="onDecide('NOT_CONFLICT')">
            <b>중복 관계 아님</b><small>제한 관계가 아님</small>
          </button>
          <button class="b defer" :disabled="busy" @click="onDefer">
            <b>판단 보류</b><small>근거가 부족함</small>
          </button>
        </div>
        <p class="effect">{{ effectText }}</p>
      </section>

      <button class="link" @click="showTech = !showTech">
        시스템 분석 상세 {{ showTech ? '접기' : '보기' }}
      </button>
      <div v-if="showTech" class="tech">
        <span v-for="m in techChips" :key="m.k"><em>{{ m.k }}</em>{{ m.v }}</span>
      </div>
    </div>

    <div v-if="toast" class="toast">
      <span>{{ toast }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import conflictApi from '@/api/conflictApi'

const queue = ref([])
const sum = ref(null)
const index = ref(0)
const loading = ref(true)
const busy = ref(false)
const publishing = ref(false)
const showTech = ref(false)
const toast = ref('')

const cur = computed(() => queue.value[index.value] || {})
const pct = computed(() =>
  queue.value.length ? Math.round((index.value / queue.value.length) * 100) : 0
)

const autoCount = computed(() => {
  if (!sum.value) return 0
  return Number(sum.value.auto_warning || 0)
      + Number(sum.value.auto_rule || 0)
      + Number(sum.value.discarded || 0)
})

// 왜 이 건이 관리자에게 왔는지를 사람 말로 바꾼다.
// "이건 왜 나한테 왔나" 를 묻게 만들면 판정 시간이 길어진다.
const REASONS = {
  RELATION_CHECK: {
    label: '관계 확인 필요',
    help: '두 정책은 특정됐습니다. 실제 중복 관계인지 판단해주세요.',
    cls: 'r-nor',
  },
  DIRECTION_UNKNOWN: {
    label: '한쪽 공고에만 근거가 있습니다',
    help: '기준 정책만 상대를 지목했고, 상대 공고문은 기준 정책을 언급하지 않았습니다.',
    cls: 'r-dir',
  },
  COMBINATION_APPLICABILITY_UNKNOWN: {
    label: '동시 신청 가능 여부 불명',
    help: '제한은 있지만 둘을 함께 신청하는 것까지 막는지는 공고문에 없습니다.',
    cls: 'r-dir',
  },
  CONDITIONAL: {
    label: '조건이 붙은 제한',
    help: '금액이 조정되는지 자격이 제한되는지에 따라 처리가 달라집니다.',
    cls: 'r-cond',
  },
  CONTRADICTORY_EVIDENCE: {
    label: '양쪽 공고가 다릅니다',
    help: '한쪽은 불가, 한쪽은 가능이라고 합니다. 최신 공고를 확인해주세요.',
    cls: 'r-bad',
  },
  EXTRACTION_INVALID: {
    label: '추출 근거가 맞지 않습니다',
    help: '정책명이 근거 문장 안에 없습니다. 대부분 관계 아님으로 처리하면 됩니다.',
    cls: 'r-bad',
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
    return '중복 불가로 확정하면 두 정책이 함께 든 추천 조합이 제외됩니다.'
  }
  return '한쪽 공고에만 근거가 있으므로, 중복 불가를 선택해도 조합에서 제외하지 않고 '
       + '사용자에게 확인 안내만 표시합니다.'
})

const LABELS = {
  FORBIDDEN: '중복 불가', CONDITIONAL: '조건부', ALLOWED: '중복 가능',
  BIDIRECTIONAL: '양방향', SOURCE_TO_TARGET: '한쪽 방향', UNKNOWN: '불명',
  CURRENT: '현재 수혜 중', PAST: '과거 이력', CURRENT_OR_PAST: '현재 또는 과거',
  APPLICANT: '본인 기준', HOUSEHOLD: '가구원 포함',
  APPLICATION: '신청 단계', SELECTION: '선정 단계',
  BENEFIT_RECEIPT: '수혜 단계', HISTORY: '이력 기준',
  MUTUAL: '상대도 지목함', COUNTERPART_SILENT: '상대는 언급 없음',
  COUNTERPART_ALLOWS: '상대는 가능이라 함', NOT_RUN: '미확인',
}
const L = (v) => LABELS[v] || v || '—'

const techChips = computed(() => [
  { k: 'relation', v: L(cur.value.relation) },
  { k: 'direction', v: L(cur.value.direction) },
  { k: 'timing', v: L(cur.value.timing) },
  { k: 'subject', v: L(cur.value.subject_scope) },
  { k: 'stage', v: L(cur.value.restriction_stage) },
  { k: 'crosscheck', v: L(cur.value.crosscheck_result) },
  { k: 'candidate_no', v: cur.value.candidate_no },
])

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

async function load() {
  loading.value = true
  try {
    const [s, q] = await Promise.all([
      conflictApi.getSummary(),
      conflictApi.getQueue(),
    ])
    sum.value = s
    queue.value = q
    index.value = 0
  } finally {
    loading.value = false
  }
}

// 처리한 항목은 큐에서 빼고 같은 자리에 다음 것이 오게 한다.
// 목록 전체를 다시 불러오면 위치를 잃어 흐름이 끊긴다.
function next(msg) {
  queue.value.splice(index.value, 1)
  if (index.value >= queue.value.length) index.value = Math.max(0, queue.value.length - 1)
  if (sum.value) sum.value.review = Math.max(0, Number(sum.value.review) - 1)
  showTech.value = false
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2500)
}

async function onDecide(decision) {
  busy.value = true
  try {
    await conflictApi.decide(cur.value.candidate_no, decision)
    const msg = {
      BLOCK: '중복 불가로 처리했습니다.',
      PARTIAL: '금액 조정으로 처리했습니다.',
      NOT_CONFLICT: '중복 관계 아님으로 처리했습니다.',
    }[decision]
    next(msg)
  } finally {
    busy.value = false
  }
}

async function onDefer() {
  busy.value = true
  try {
    await conflictApi.defer(cur.value.candidate_no, 7)
    next('판단을 보류했습니다. 7일 후 다시 표시됩니다.')
  } finally {
    busy.value = false
  }
}

async function onPublish() {
  publishing.value = true
  try {
    const r = await conflictApi.publish()
    alert(`엔진 반영 완료\n중복 규칙 ${r.pairRule}건 / 확인 안내 ${r.externalWarning}건`)
  } finally {
    publishing.value = false
  }
}

onMounted(load)
</script>

<style scoped>
.wrap { padding: 24px; max-width: 1080px; }
.head { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 18px; gap: 20px; }
h2 { font-size: 20px; font-weight: 700; margin: 0; }
.sub { color: #6b7280; font-size: 13px; margin: 5px 0 0; line-height: 1.6; }
.btn-publish { background: #2a201a; color: #fff; border: 0; border-radius: 6px; padding: 10px 16px; font-size: 13px; cursor: pointer; white-space: nowrap; }
.btn-publish:disabled { opacity: .5; cursor: default; }

.summary { display: flex; align-items: stretch; gap: 8px; flex-wrap: wrap; background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 14px 16px; margin-bottom: 18px; }
.s-item { display: flex; flex-direction: column; gap: 2px; min-width: 92px; }
.s-item em { font-style: normal; font-size: 11px; color: #6b7280; }
.s-item b { font-size: 19px; font-variant-numeric: tabular-nums; }
.s-item small { font-size: 10px; color: #9ca3af; }
.s-arrow { align-self: center; color: #d1d5db; }
.s-item.auto b { color: #059669; }
.s-item.wait b { color: #6b7280; }
.s-item.me { margin-left: auto; padding-left: 16px; border-left: 1px solid #e5e7eb; }
.s-item.me b { color: #b45309; }

.empty { padding: 60px; text-align: center; color: #9ca3af; }
.empty.done { color: #059669; font-weight: 600; }

.progress { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
.count { font-size: 13px; color: #6b7280; font-variant-numeric: tabular-nums; }
.bar { flex: 1; height: 4px; background: #e5e7eb; border-radius: 2px; overflow: hidden; }
.fill { height: 100%; background: #ffcc00; transition: width .2s; }

.reason { border-radius: 8px; padding: 12px 14px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 3px; font-size: 13px; }
.reason strong { font-size: 13px; }
.reason span { color: #4b5563; }
.r-nor  { background: #f0fdf4; border: 1px solid #bbf7d0; }
.r-dir  { background: #fefce8; border: 1px solid #fde68a; }
.r-cond { background: #f5f3ff; border: 1px solid #ddd6fe; }
.r-bad  { background: #fef2f2; border: 1px solid #fecaca; }

.compare { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: stretch; }
.card { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 18px; }
.tag { display: inline-block; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; margin-bottom: 8px; }
.tag.base { background: #eef4ff; color: #1d4ed8; }
.tag.cmp  { background: #f3f4f6; color: #4b5563; }
.card h3 { font-size: 16px; margin: 0 0 3px; line-height: 1.4; }
.inst { font-size: 12px; color: #6b7280; margin: 0; }
.inst em { font-style: normal; color: #b91c1c; }

.why { margin: 14px 0; background: #f9fafb; border-radius: 6px; padding: 10px 12px; }
.why b { font-size: 12px; display: block; margin-bottom: 3px; }
.why p { font-size: 12px; color: #4b5563; margin: 0; line-height: 1.6; }

.label { font-size: 11px; color: #6b7280; margin-bottom: 6px; }
.evidence { background: #fafafa; border-left: 3px solid #d1d5db; padding: 11px 13px; font-size: 13px; line-height: 1.8; white-space: pre-wrap; }
.evidence :deep(mark) { background: #ffe58f; padding: 1px 3px; border-radius: 3px; font-weight: 600; }
.warn { display: block; margin-top: 8px; font-size: 12px; color: #b91c1c; line-height: 1.6; }

.cross { border: 1px solid #e5e7eb; border-radius: 8px; }
.c-row { display: flex; justify-content: space-between; gap: 12px; padding: 10px 12px; font-size: 13px; border-bottom: 1px solid #f3f4f6; }
.c-row:last-child { border-bottom: 0; }
.c-row span { color: #6b7280; flex-shrink: 0; }
.c-row strong { text-align: right; font-size: 13px; }
.c-row strong.ok { color: #059669; }
.c-row strong.no { color: #9ca3af; font-weight: 500; }

.facts { margin-top: 14px; }
.facts ul { margin: 0; padding: 0; list-style: none; display: flex; flex-direction: column; gap: 7px; }
.facts li { font-size: 13px; padding-left: 20px; position: relative; line-height: 1.6; }
.facts li::before { position: absolute; left: 0; font-weight: 700; }
.facts li.ok::before { content: '✓'; color: #059669; }
.facts li.no::before { content: '?'; color: #b45309; }

.decide { margin-top: 14px; }
.decide h4 { font-size: 15px; margin: 0 0 12px; }
.btns { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.b { border: 1px solid #e5e7eb; background: #fff; border-radius: 8px; padding: 12px 8px; cursor: pointer; display: flex; flex-direction: column; gap: 3px; }
.b b { font-size: 14px; }
.b small { font-size: 11px; color: #6b7280; }
.b:hover { background: #f9fafb; }
.b:disabled { opacity: .45; cursor: default; }
.b.block { background: #ffcc00; border-color: #ffcc00; }
.b.block:hover { background: #f0c000; }
.b.not b { color: #b91c1c; }
.effect { font-size: 12px; color: #4b5563; margin: 12px 0 0; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 6px; padding: 10px 12px; line-height: 1.6; }

.link { border: 0; background: none; color: #1d4ed8; font-size: 12px; cursor: pointer; padding: 12px 0 0; }
.tech { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
.tech span { font-size: 11px; background: #f3f4f6; border-radius: 4px; padding: 4px 8px; color: #374151; }
.tech em { font-style: normal; color: #9ca3af; margin-right: 5px; }

.toast { position: fixed; right: 28px; bottom: 28px; background: #1f2937; color: #fff; padding: 13px 18px; border-radius: 8px; font-size: 13px; }

@media (max-width: 900px) {
  .compare { grid-template-columns: 1fr; }
  .btns { grid-template-columns: repeat(2, 1fr); }
}
</style>