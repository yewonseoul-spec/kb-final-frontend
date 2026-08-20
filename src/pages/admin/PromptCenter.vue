<template>
  <div class="wrap">
    <div class="head">
      <h2>AI 프롬프트 관리</h2>
      <p class="sub">
        AI에게 주는 지시문입니다. 수정한 뒤 시험 실행으로 결과를 확인하고 적용하세요.
        적용 전까지는 기존 버전이 그대로 동작합니다.
      </p>
    </div>

    <div class="keys">
      <button v-for="k in keys" :key="k" class="key" :class="{ on: k === curKey }"
              @click="selectKey(k)">
        {{ KEY_LABEL[k] || k }}
      </button>
    </div>

    <div v-if="loading" class="empty">불러오는 중...</div>

    <div v-else class="body">
      <!-- 버전 목록 -->
      <aside class="versions">
        <div class="v-head">
          <span>버전 이력</span>
          <button class="v-new" @click="newDraft(false)">+ 새로 작성</button>
        </div>

        <button v-if="draft" class="v-item draft on">
          <div class="v-top">
            <b>새 버전 (v{{ nextVersion }})</b>
            <span class="badge draft-badge">작성중</span>
          </div>
          <p class="v-memo">아직 저장되지 않았습니다</p>
        </button>

        <button v-for="v in versions" :key="v.promptNo" class="v-item"
                :class="{ on: !draft && v.promptNo === picked?.promptNo }"
                @click="pick(v)">
          <div class="v-top">
            <b>v{{ v.version }}</b>
            <span v-if="v.isActive === 'Y'" class="badge">사용중</span>
          </div>
          <p class="v-memo">{{ v.memo || '메모 없음' }}</p>
        </button>
      </aside>

      <!-- 편집 -->
      <section class="editor">
        <div class="e-head">
          <span v-if="draft">
            새 버전 작성 <em>· 저장하면 v{{ nextVersion }}이 됩니다</em>
          </span>
          <span v-else>
            v{{ picked?.version }}
            <em v-if="picked?.isActive === 'Y'">· 현재 사용중</em>
            <em v-else-if="dirty">· 수정됨</em>
          </span>

          <div class="e-btns">
            <button v-if="!draft" class="btn ghost" @click="newDraft(true)">복제해서 작성</button>
            <button class="btn ghost" :disabled="!dirty && !draft" @click="cancel">
              {{ draft ? '작성 취소' : '되돌리기' }}
            </button>
            <button class="btn" :disabled="!canSave || saving" @click="openSave">
              {{ saving ? '저장 중...' : '새 버전으로 저장' }}
            </button>
            <button class="btn dark"
                    :disabled="draft || picked?.isActive === 'Y' || dirty || activating"
                    @click="activate">
              {{ activating ? '적용 중...' : '이 버전 적용' }}
            </button>
            <button class="btn danger"
                    :disabled="draft || picked?.isActive === 'Y' || versions.length <= 1 || deleting"
                    @click="remove">
              {{ deleting ? '삭제 중...' : '이 버전 삭제' }}
            </button>
          </div>
        </div>

        <p v-if="draft" class="hint">
          빈 상태에서 새로 작성 중입니다. 저장하기 전에 아래에서 시험 실행해볼 수 있습니다.
        </p>
        <p v-else-if="dirty" class="hint">
          내용을 수정했습니다. 저장하면 v{{ nextVersion }}이 새로 만들어지고
          v{{ picked?.version }}은 그대로 남습니다.
        </p>

        <textarea v-model="content" spellcheck="false"
                  :placeholder="draft ? '프롬프트를 입력하세요' : ''"></textarea>
        <div class="count">{{ content.length }}자</div>

        <!-- 저장 메모 -->
        <div v-if="askMemo" class="memo-box">
          <label>무엇을 왜 바꿨는지 적어주세요</label>
          <input v-model="memo" placeholder="예) 자기참조 오추출 방지 문구 추가"
                 @keyup.enter="save" />
          <div class="memo-btns">
            <button class="btn ghost" @click="askMemo = false">취소</button>
            <button class="btn dark" :disabled="!memo.trim()" @click="save">저장</button>
          </div>
        </div>

        <!-- 시험 실행 -->
        <div class="test">
          <div class="t-head">
            <b>시험 실행</b>
            <span>DB에 저장하지 않습니다. 몇 번을 돌려도 안전합니다.</span>
          </div>
          <div class="t-run">
            <input v-model.number="testNo" type="number" placeholder="정책번호" />
            <button class="btn" :disabled="testing || !testNo || !content.trim()"
                    @click="runTest">
              {{ testing ? '실행 중...' : '이 프롬프트로 실행' }}
            </button>
          </div>
          <div class="t-samples">
            <button v-for="s in SAMPLES" :key="s.no" @click="testNo = s.no">
              {{ s.label }}
            </button>
          </div>

          <div v-if="result" class="t-result">
            <div class="r-head">
              <b>{{ result.plcyNm }}</b>
              <span class="r-scope" :class="scopeClass">
                {{ SCOPE[result.scope] || result.scope }}
              </span>
            </div>
            <p v-if="result.errorMsg" class="r-err">{{ result.errorMsg }}</p>
            <p v-else-if="!result.relations?.length" class="r-none">
              중복 관계를 찾지 못했습니다. 규칙이 만들어지지 않습니다.
            </p>
            <div v-else>
              <div v-for="(r, i) in result.relations" :key="i" class="rel">
                <div class="rel-top">
                  <b>{{ r.targetName || r.targetCategory || '(이름 없음)' }}</b>
                  <span>{{ REL[r.relation] || r.relation }}</span>
                </div>
                <p class="rel-ev">{{ r.evidence }}</p>
                <div class="rel-meta">
                  <span>방향 {{ D[r.direction] || r.direction }}</span>
                  <span>시점 {{ D[r.timing] || r.timing }}</span>
                  <span>단계 {{ D[r.restrictionStage] || r.restrictionStage }}</span>
                  <span>동시신청 {{ D[r.combinationApplicability] || r.combinationApplicability }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>

    <div v-if="toast" class="toast">{{ toast }}</div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import promptApi from '@/api/promptApi'

const KEY_LABEL = {
  CONFLICT_DETECTION: '중복수혜 분석',
  CONFLICT_VERIFICATION: '중복수혜 재검증',
  CONSUMPTION_ANALYSIS: '소비 패턴 분석',
  CONSUMPTION_VERIFICATION: '소비 분석 재검증',
}

// 시험 실행에 자주 쓰는 정책. 유형이 달라 프롬프트 변화를 보기 좋다
const SAMPLES = [
  { no: 35063, label: '양방향 (결혼식 지원)' },
  { no: 1283,  label: '범주형 (청년위원회)' },
  { no: 39,    label: '같은 사업 중복 (자격증)' },
  { no: 26366, label: '조건부 (응시료)' },
]

const SCOPE = {
  OTHER_POLICY: '다른 정책과의 제한',
  SAME_POLICY: '같은 사업 안의 중복',
  NOT_CONFLICT: '중복과 무관',
  UNCERTAIN: '판단 불가',
  ERROR: '오류',
}
const REL = { FORBIDDEN: '중복 불가', CONDITIONAL: '조건부', ALLOWED: '중복 가능' }
const D = {
  BIDIRECTIONAL: '양방향', SOURCE_TO_TARGET: '한쪽', UNKNOWN: '불명',
  CURRENT: '현재', PAST: '과거', CURRENT_OR_PAST: '현재·과거',
  APPLICATION: '신청', SELECTION: '선정', BENEFIT_RECEIPT: '수혜', HISTORY: '이력',
  YES: '적용', NO: '해당없음',
}

const keys = ref([])
const curKey = ref('')
const versions = ref([])
const picked = ref(null)
const content = ref('')
const draft = ref(false)
const loading = ref(true)
const saving = ref(false)
const activating = ref(false)
const deleting = ref(false)
const testing = ref(false)
const testNo = ref(null)
const result = ref(null)
const toast = ref('')
const askMemo = ref(false)
const memo = ref('')


// 줄 끝 공백과 앞뒤 공백은 의미 없는 차이다.
// 커서를 잘못 눌러 스페이스 하나가 들어간 것을 수정으로 보면
// 실수로 새 버전이 만들어진다.
function normalize(s) {
  return String(s || '')
    .replace(/\r\n/g, '\n')
    .split('\n')
    .map(line => line.replace(/\s+$/, ''))
    .join('\n')
    .trim()
}

const dirty = computed(() =>
  !draft.value && picked.value
    && normalize(content.value) !== normalize(picked.value.content)
)

const canSave = computed(() => (draft.value || dirty.value) && content.value.trim().length > 0)
const nextVersion = computed(() =>
  versions.value.length ? Math.max(...versions.value.map(v => v.version)) + 1 : 1
)
const scopeClass = computed(() => {
  const s = result.value?.scope
  if (s === 'OTHER_POLICY') return 'go'
  if (s === 'ERROR') return 'bad'
  return 'stop'
})

function say(msg) {
  toast.value = msg
  setTimeout(() => { toast.value = '' }, 2800)
}

async function loadKeys() {
  loading.value = true
  try {
    keys.value = await promptApi.getKeys()
    if (keys.value.length) await selectKey(keys.value[0])
  } finally {
    loading.value = false
  }
}

async function selectKey(k) {
  curKey.value = k
  result.value = null
  draft.value = false
  askMemo.value = false
  versions.value = await promptApi.getVersions(k)
  const active = versions.value.find(v => v.isActive === 'Y') || versions.value[0]
  if (active) pick(active)
}

function pick(v) {
  draft.value = false
  askMemo.value = false
  picked.value = v
  content.value = v?.content || ''
}

/**
 * 새 버전 작성.
 * copy=true 면 지금 버전을 그대로 가져온다. 대부분은 이쪽이 편하다.
 * copy=false 면 빈 편집기에서 시작한다.
 */
function newDraft(copy) {
  draft.value = true
  askMemo.value = false
  result.value = null
  content.value = copy ? (picked.value?.content || '') : ''
}

function cancel() {
  askMemo.value = false
  draft.value = false
  content.value = picked.value?.content || ''
}

function openSave() {
  memo.value = ''
  askMemo.value = true
}

async function save() {
  if (!memo.value.trim()) return
  saving.value = true
  try {
    await promptApi.createVersion(curKey.value, content.value, memo.value.trim())
    versions.value = await promptApi.getVersions(curKey.value)
    draft.value = false
    askMemo.value = false
    pick(versions.value[0])
    say('새 버전으로 저장했습니다. 아직 적용되지 않았습니다.')
  } finally {
    saving.value = false
  }
}

async function activate() {
  activating.value = true
  try {
    const no = picked.value.promptNo
    await promptApi.activate(curKey.value, no)
    versions.value = await promptApi.getVersions(curKey.value)
    pick(versions.value.find(v => v.promptNo === no))
    say('이 버전을 적용했습니다. 다음 분석부터 반영됩니다.')
  } finally {
    activating.value = false
  }
}

/**
 * 사용중인 버전과 마지막 하나는 서버가 거부한다.
 * 화면에서도 미리 막아 눌러보고 실패하는 일이 없게 한다.
 */
async function remove() {
  if (!window.confirm(`v${picked.value.version}을 삭제할까요? 되돌릴 수 없습니다.`)) return
  deleting.value = true
  try {
    await promptApi.deleteVersion(curKey.value, picked.value.promptNo)
    versions.value = await promptApi.getVersions(curKey.value)
    const active = versions.value.find(v => v.isActive === 'Y') || versions.value[0]
    pick(active)
    say('버전을 삭제했습니다.')
  } catch (e) {
    say('삭제할 수 없습니다. 사용중이거나 마지막 버전입니다.')
  } finally {
    deleting.value = false
  }
}

// 저장하지 않은 내용으로도 돌려볼 수 있어야 한다.
// 저장 후에만 시험할 수 있으면 버전 이력이 시험용으로 지저분해진다
async function runTest() {
  testing.value = true
  result.value = null
  try {
    result.value = await promptApi.test(testNo.value, content.value)
  } finally {
    testing.value = false
  }
}

onMounted(loadKeys)
</script>

<style scoped>
.wrap { padding: 24px; max-width: 1200px; }
h2 { font-size: 20px; font-weight: 700; margin: 0; }
.sub { color: #6b7280; font-size: 13px; margin: 5px 0 0; line-height: 1.6; }
.head { margin-bottom: 18px; }

.keys { display: flex; gap: 6px; margin-bottom: 16px; flex-wrap: wrap; }
.key { border: 1px solid #e5e7eb; background: #fff; border-radius: 6px; padding: 8px 14px; font-size: 13px; cursor: pointer; }
.key.on { background: #2a201a; color: #fff; border-color: #2a201a; }

.empty { padding: 60px; text-align: center; color: #9ca3af; }
.body { display: grid; grid-template-columns: 230px 1fr; gap: 16px; align-items: start; }

.versions { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; overflow: hidden; }
.v-head { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: #6b7280; padding: 10px 12px; border-bottom: 1px solid #f3f4f6; }
.v-new { border: 1px solid #e5e7eb; background: #fff; border-radius: 5px; padding: 4px 8px; font-size: 11px; cursor: pointer; color: #374151; }
.v-new:hover { background: #f9fafb; }
.v-item { display: block; width: 100%; text-align: left; border: 0; border-bottom: 1px solid #f3f4f6; background: #fff; padding: 11px 12px; cursor: pointer; }
.v-item:hover { background: #f9fafb; }
.v-item.on { background: #fffbe6; }
.v-item.draft { background: #eff6ff; cursor: default; }
.v-top { display: flex; align-items: center; gap: 6px; }
.v-top b { font-size: 13px; }
.badge { font-size: 10px; background: #ffcc00; color: #2a201a; border-radius: 3px; padding: 1px 5px; font-weight: 700; }
.badge.draft-badge { background: #1d4ed8; color: #fff; }
.v-memo { font-size: 11px; color: #6b7280; margin: 3px 0 0; line-height: 1.5; }

.editor { background: #fff; border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; }
.e-head { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 10px; flex-wrap: wrap; }
.e-head > span { font-size: 14px; font-weight: 600; }
.e-head em { font-style: normal; font-size: 12px; color: #6b7280; font-weight: 400; }
.e-btns { display: flex; gap: 6px; flex-wrap: wrap; }
.btn { border: 1px solid #e5e7eb; background: #fff; border-radius: 6px; padding: 8px 13px; font-size: 12px; cursor: pointer; white-space: nowrap; }
.btn:disabled { opacity: .4; cursor: default; }
.btn.dark { background: #2a201a; color: #fff; border-color: #2a201a; }
.btn.ghost { color: #6b7280; }
.btn.danger { color: #b91c1c; border-color: #fecaca; }
.btn.danger:hover:not(:disabled) { background: #fef2f2; }
.hint { font-size: 12px; color: #b45309; background: #fffbeb; border: 1px solid #fde68a; border-radius: 6px; padding: 8px 11px; margin: 0 0 10px; line-height: 1.6; }

textarea { width: 100%; height: 420px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 13px; font-family: ui-monospace, Menlo, Consolas, monospace; font-size: 12px; line-height: 1.7; resize: vertical; }
.count { text-align: right; font-size: 11px; color: #9ca3af; margin-top: 4px; }

.memo-box { margin-top: 10px; border: 1px solid #fde68a; background: #fffbeb; border-radius: 8px; padding: 12px; }
.memo-box label { display: block; font-size: 12px; color: #92400e; margin-bottom: 6px; }
.memo-box input { width: 100%; border: 1px solid #e5e7eb; border-radius: 6px; padding: 9px 11px; font-size: 13px; }
.memo-btns { display: flex; justify-content: flex-end; gap: 6px; margin-top: 8px; }

.test { margin-top: 18px; border-top: 1px solid #f3f4f6; padding-top: 16px; }
.t-head { display: flex; align-items: baseline; gap: 10px; margin-bottom: 10px; flex-wrap: wrap; }
.t-head b { font-size: 14px; }
.t-head span { font-size: 12px; color: #6b7280; }
.t-run { display: flex; gap: 6px; }
.t-run input { width: 130px; border: 1px solid #e5e7eb; border-radius: 6px; padding: 8px 11px; font-size: 13px; }
.t-samples { display: flex; gap: 6px; margin-top: 8px; flex-wrap: wrap; }
.t-samples button { border: 1px dashed #d1d5db; background: #fff; border-radius: 20px; padding: 5px 11px; font-size: 11px; color: #4b5563; cursor: pointer; }
.t-samples button:hover { background: #f9fafb; }

.t-result { margin-top: 14px; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px; }
.r-head { display: flex; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 10px; }
.r-head b { font-size: 14px; }
.r-scope { font-size: 11px; border-radius: 4px; padding: 3px 8px; font-weight: 600; white-space: nowrap; }
.r-scope.go { background: #ecfdf5; color: #059669; }
.r-scope.stop { background: #f3f4f6; color: #6b7280; }
.r-scope.bad { background: #fef2f2; color: #b91c1c; }
.r-err { font-size: 12px; color: #b91c1c; margin: 0; }
.r-none { font-size: 13px; color: #6b7280; margin: 0; }

.rel { border-top: 1px solid #f3f4f6; padding-top: 10px; margin-top: 10px; }
.rel:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
.rel-top { display: flex; justify-content: space-between; gap: 10px; }
.rel-top b { font-size: 13px; }
.rel-top span { font-size: 12px; color: #b45309; white-space: nowrap; }
.rel-ev { font-size: 12px; color: #4b5563; background: #fafafa; border-left: 3px solid #e5e7eb; padding: 8px 11px; margin: 6px 0; line-height: 1.7; }
.rel-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.rel-meta span { font-size: 11px; background: #f3f4f6; border-radius: 4px; padding: 3px 7px; color: #374151; }

.toast { position: fixed; right: 28px; bottom: 28px; background: #1f2937; color: #fff; padding: 13px 18px; border-radius: 8px; font-size: 13px; }

@media (max-width: 900px) {
  .body { grid-template-columns: 1fr; }
}
</style>