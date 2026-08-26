<template>
  <div>
    <div class="a-head">
      <div><h1>AI 프롬프트 관리</h1></div>
      <p>AI 지시문을 버전으로 관리합니다. 적용 전까지는 기존 버전이 그대로 동작합니다.</p>
    </div>

    <div v-if="tabKeys.length" class="a-tabs">
      <button v-for="k in tabKeys" :key="k" class="a-tab"
              :class="{ 'is-active': k === curKey }" @click="selectKey(k)">
        {{ KEY_LABEL[k] || k }}
      </button>
    </div>

    <div v-if="loading" class="a-loading">
      <span class="a-spin"></span> 불러오는 중
    </div>

    <div v-else-if="!tabKeys.length" class="a-notice">
      <div>
        <b>등록된 프롬프트가 없습니다.</b>
        DB 에 프롬프트가 한 건도 없습니다. 이 경우 AI 분석은 코드에 내장된 기본 지시문으로
        동작하므로 기능이 멈추지는 않지만, 화면에서 버전을 관리할 수 없습니다.
        시드 데이터(<code class="code">ai_prompt</code>)가 적용되었는지 확인해주세요.
      </div>
    </div>

    <div v-else class="body">
      <!-- 버전 이력 -->
      <aside class="a-card vs">
        <div class="a-card-h">
          <h2>버전 이력</h2>
          <button class="a-btn a-btn-xs a-more" @click="newDraft(main, false)">새로 작성</button>
        </div>

        <button v-if="main.draft" class="v-item is-draft">
          <div class="v-top">
            <b>새 버전 (v{{ nextVersion(main) }})</b>
            <span class="a-bdg a-bdg-info a-bdg-dash">작성 중</span>
          </div>
          <p class="v-memo">아직 저장되지 않았습니다</p>
        </button>

        <button v-for="v in main.versions" :key="v.promptNo" class="v-item"
                :class="{ 'is-on': !main.draft && v.promptNo === main.picked?.promptNo }"
                @click="pick(main, v)">
          <div class="v-top">
            <b class="a-num">v{{ v.version }}</b>
            <span v-if="v.isActive === 'Y'" class="a-bdg a-bdg-ok">
              <span class="a-dot">●</span>사용 중
            </span>
          </div>
          <p class="v-memo">{{ v.memo || '메모 없음' }}</p>
        </button>

        <p v-if="!main.versions.length && !main.draft" class="v-none">
          이 기능에는 저장된 버전이 없습니다.
        </p>
      </aside>

      <div class="right">
        <!-- 주 프롬프트 -->
        <section class="a-card ed">
          <div class="e-head">
            <div class="e-title">
              <template v-if="main.draft">
                새 버전 작성 <em>· 저장하면 v{{ nextVersion(main) }}이 됩니다</em>
              </template>
              <template v-else-if="main.picked">
                <span class="a-num">v{{ main.picked.version }}</span>
                <em v-if="main.picked.isActive === 'Y'">· 현재 사용 중</em>
                <em v-else-if="dirty(main)">· 수정됨</em>
              </template>
              <template v-else>버전 없음</template>
            </div>

            <div class="e-btns">
              <button v-if="!main.draft && main.picked" class="a-btn a-btn-xs a-btn-quiet e-w"
                      @click="newDraft(main, true)">복제</button>
              <button class="a-btn a-btn-xs a-btn-quiet e-w"
                      :disabled="!dirty(main) && !main.draft" @click="cancel(main)">
                {{ main.draft ? '작성 취소' : '되돌리기' }}
              </button>
              <button class="a-btn a-btn-xs e-w-lg"
                      :disabled="!canSave(main) || main.saving" @click="openSave(main)">
                {{ main.saving ? '저장 중…' : '새 버전 저장' }}
              </button>
              <button class="a-btn a-btn-xs a-btn-dark e-w"
                      :disabled="!canActivate(main)" @click="activate(main)">
                {{ main.activating ? '적용 중…' : '적용' }}
              </button>
              <button class="a-btn a-btn-xs a-btn-dngr e-w"
                      :disabled="!canDelete(main)" @click="remove(main)">
                {{ main.deleting ? '삭제 중…' : '삭제' }}
              </button>
            </div>
          </div>

          <div v-if="!main.versions.length && !main.draft" class="a-hint mb-2">
            이 기능에는 저장된 프롬프트가 없습니다. 「새로 작성」으로 첫 버전을 만들 수 있습니다.
            만들기 전까지는 코드에 내장된 기본 지시문으로 동작합니다.
          </div>
          <div v-else-if="main.draft" class="a-hint mb-2">
            빈 상태에서 새로 작성 중입니다. 저장하기 전에 아래에서 시험 실행해볼 수 있습니다.
          </div>
          <div v-else-if="dirty(main)" class="a-notice mb-2">
            <div>
              <b>내용을 수정했습니다.</b>
              저장하면 v{{ nextVersion(main) }}이 새로 만들어지고
              v{{ main.picked?.version }}은 그대로 남습니다.
            </div>
          </div>

          <textarea v-model="main.content" class="ed-area" spellcheck="false"
                    :placeholder="main.draft || !main.versions.length ? '프롬프트를 입력하세요' : ''"></textarea>
          <div class="ed-count a-num">{{ main.content.length.toLocaleString() }}자</div>

          <div v-if="main.askMemo" class="memo">
            <label>무엇을 왜 바꿨는지 적어주세요</label>
            <input v-model="main.memo" placeholder="예) 자기참조 오추출 방지 문구 추가"
                   @keyup.enter="save(main)" />
            <div class="memo-btns">
              <button class="a-btn a-btn-xs a-btn-quiet a-btn-fix-sm"
                      @click="main.askMemo = false">취소</button>
              <button class="a-btn a-btn-xs a-btn-dark a-btn-fix-sm"
                      :disabled="!main.memo.trim()" @click="save(main)">저장</button>
            </div>
          </div>
        </section>

        <!--
          짝 프롬프트.
          소비 패턴 분석은 결과를 채점하는 검증 프롬프트와 짝이다.
          탭을 나눠 두면 「내가 고친 분석 프롬프트가 검증을 통과하나」를
          한 화면에서 확인할 방법이 없어 같은 화면 아래에 둔다.
        -->
        <section v-if="sub.key" class="a-card ed sub">
          <div class="e-head">
            <div class="e-title">
              {{ KEY_LABEL[sub.key] || sub.key }}
              <em v-if="sub.picked">· v{{ sub.picked.version }}</em>
              <em v-if="dirty(sub)">· 수정됨</em>
            </div>

            <div class="e-btns">
              <button class="a-btn a-btn-xs a-btn-quiet e-w"
                      :disabled="!dirty(sub) && !sub.draft" @click="cancel(sub)">되돌리기</button>
              <button class="a-btn a-btn-xs e-w-lg"
                      :disabled="!canSave(sub) || sub.saving" @click="openSave(sub)">
                {{ sub.saving ? '저장 중…' : '새 버전 저장' }}
              </button>
              <button class="a-btn a-btn-xs a-btn-dark e-w"
                      :disabled="!canActivate(sub)" @click="activate(sub)">
                {{ sub.activating ? '적용 중…' : '적용' }}
              </button>
            </div>
          </div>

          <div class="a-hint mb-2">
            위 분석 결과가 규칙을 지켰는지 채점하는 지시문입니다.
            사용자 화면에 나가는 문장을 직접 만들지는 않습니다.
          </div>

          <textarea v-model="sub.content" class="ed-area is-short" spellcheck="false"></textarea>
          <div class="ed-count a-num">{{ sub.content.length.toLocaleString() }}자</div>

          <div v-if="sub.askMemo" class="memo">
            <label>무엇을 왜 바꿨는지 적어주세요</label>
            <input v-model="sub.memo" placeholder="예) 체크리스트 4번 표현 완화"
                   @keyup.enter="save(sub)" />
            <div class="memo-btns">
              <button class="a-btn a-btn-xs a-btn-quiet a-btn-fix-sm"
                      @click="sub.askMemo = false">취소</button>
              <button class="a-btn a-btn-xs a-btn-dark a-btn-fix-sm"
                      :disabled="!sub.memo.trim()" @click="save(sub)">저장</button>
            </div>
          </div>
        </section>

        <!-- ============ 시험 실행 : 중복수혜 ============ -->
        <section v-if="curKey === 'CONFLICT_DETECTION'" class="a-card test">
          <div class="t-head">
            <b>시험 실행</b>
            <span>DB에 저장하지 않습니다. 몇 번을 돌려도 안전합니다.</span>
          </div>

          <div class="t-run">
            <!-- plcy_no 는 20자리 숫자 문자열이다.
                 type="number" 로 두면 자바스크립트 안전 정수 한계를 넘어 뒷자리가 뭉개진다 -->
            <input v-model.trim="testNo" type="text" class="a-num"
                   inputmode="numeric" maxlength="20" placeholder="정책번호 (plcy_no)" />
            <button class="a-btn" :disabled="testing || !testNo || !main.content.trim()"
                    @click="runConflictTest">
              {{ testing ? '실행 중…' : '이 프롬프트로 실행' }}
            </button>
          </div>

          <div class="a-hint t-note">
            온통청년이 부여한 정책번호(<code class="code">plcy_no</code>)입니다. 20자리 숫자입니다.
            우리 DB 의 내부 번호가 아니므로 데이터를 다시 적재해도 값이 그대로 유지됩니다.
          </div>

          <div class="t-label">예시로 번호 넣기 · 검수 큐에 실제로 있는 건입니다</div>
          <div class="t-samples">
            <button v-for="s in CONFLICT_SAMPLES" :key="s.no" class="t-sample"
                    :class="{ 'is-on': testNo === s.no }" :title="s.hint"
                    @click="testNo = s.no">
              <span class="t-bar"></span>
              <span class="t-body"><b>{{ s.type }}</b><span>{{ s.name }}</span></span>
            </button>
          </div>

          <div v-if="conflictResult" class="t-result">
            <div class="r-head">
              <b>{{ conflictResult.plcyNm }}</b>
              <span class="a-bdg" :class="scopeBadge">
                {{ SCOPE[conflictResult.scope] || conflictResult.scope }}
              </span>
            </div>

            <div v-if="conflictResult.errorMsg" class="a-notice a-notice-dngr">
              <div>{{ conflictResult.errorMsg }}</div>
            </div>
            <div v-else-if="!conflictResult.relations?.length" class="r-none">
              중복 관계를 찾지 못했습니다. 규칙이 만들어지지 않습니다.
            </div>
            <div v-else>
              <div v-for="(r, i) in conflictResult.relations" :key="i" class="rel">
                <div class="rel-top">
                  <b>{{ r.targetName || r.targetCategory || '(이름 없음)' }}</b>
                  <span class="a-bdg a-bdg-info">{{ REL[r.relation] || r.relation }}</span>
                </div>
                <p class="rel-ev">{{ r.evidence }}</p>
                <div class="rel-meta">
                  <span><em>방향</em>{{ D[r.direction] || r.direction }}</span>
                  <span><em>시점</em>{{ D[r.timing] || r.timing }}</span>
                  <span><em>단계</em>{{ D[r.restrictionStage] || r.restrictionStage }}</span>
                  <span><em>동시신청</em>{{ D[r.combinationApplicability] || r.combinationApplicability }}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- ============ 시험 실행 : 소비 분석 ============ -->
        <section v-else-if="curKey === 'CONSUMPTION_ANALYSIS'" class="a-card test">
          <div class="t-head">
            <b>시험 실행</b>
            <span>분석을 돌리고 그 결과를 검증까지 태웁니다. DB에 저장하지 않습니다.</span>
          </div>

          <!--
            회원 소비 내역을 조회하지 않고 고정 목데이터를 쓴다.
            회원 데이터는 매일 바뀌어서, 결과가 달라졌을 때
            원인이 프롬프트인지 데이터인지 구분할 수 없다.
          -->
          <div class="t-label">입력 데이터 · 세 가지 상황을 준비해 뒀습니다</div>
          <div class="t-samples t-samples-3">
            <button v-for="s in CONSUMPTION_SAMPLES" :key="s.id" class="t-sample"
                    :class="{ 'is-on': sampleId === s.id }" :title="s.hint"
                    @click="pickSample(s)">
              <span class="t-bar"></span>
              <span class="t-body"><b>{{ s.type }}</b><span>{{ s.desc }}</span></span>
            </button>
          </div>

          <textarea v-model="summaryJson" class="ed-area is-json" spellcheck="false"
                    placeholder="소비 요약 JSON"></textarea>

          <div class="t-run">
            <button class="a-btn a-btn-dark"
                    :disabled="testing || !summaryJson.trim() || !main.content.trim()"
                    @click="runConsumptionTest">
              {{ testing ? '실행 중…' : '분석 + 검증 실행' }}
            </button>
            <span v-if="testing" class="t-wait">
              <span class="a-spin"></span> OpenAI를 최대 네 번 호출합니다. 10초 안팎 걸립니다.
            </span>
          </div>

          <!-- 결과 -->
          <div v-if="cr" class="cr">
            <div v-if="cr.errorMsg" class="a-notice a-notice-dngr">
              <div>{{ cr.errorMsg }}</div>
            </div>

            <template v-else>
              <!-- ① 입력 요약. 결과를 채점하려면 무엇을 넣었는지 알아야 한다 -->
              <div class="cr-sec">
                <div class="cr-h">
                  <b>입력 데이터</b>
                  <button class="a-lnk cr-more" @click="showJson = !showJson">
                    {{ showJson ? 'JSON 접기' : 'JSON 보기' }}
                  </button>
                </div>

                <div v-if="inputSummary" class="in-top">
                  <span class="a-num">{{ inputSummary.baseDate }}</span> ·
                  1일부터 <span class="a-num">{{ inputSummary.days }}</span>일까지 ·
                  이번 달 <b class="a-num">{{ won(inputSummary.thisTotal) }}</b>원 ·
                  지난달 같은 기간 <span class="a-num">{{ won(inputSummary.lastTotal) }}</span>원 ·
                  <span :class="inputSummary.direction === '증가' ? 'up' : 'down'">
                    {{ won(inputSummary.diff) }}원 {{ inputSummary.direction }}
                  </span>
                </div>

                <table v-if="inputSummary" class="a-tbl in-tbl">
                  <colgroup>
                    <col style="width:140px"><col style="width:120px">
                    <col style="width:150px"><col style="width:130px"><col>
                  </colgroup>
                  <thead>
                    <tr>
                      <th>카테고리</th>
                      <th class="a-r">이번 달</th>
                      <th class="a-r">지난달 대비</th>
                      <th class="a-r">3개월 평균</th>
                      <th>평균 대비</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="c in inputSummary.categories" :key="c.name">
                      <td class="a-t-name">{{ c.name }}</td>
                      <td class="a-r a-num a-val">{{ won(c.amount) }}</td>
                      <td class="a-r a-num">
                        <span v-if="c.vsLast === '신규'" class="a-bdg a-bdg-info">신규</span>
                        <span v-else :class="c.diff > 0 ? 'up' : 'down'">
                          {{ c.diff > 0 ? '+' : '−' }}{{ won(Math.abs(c.diff)) }}
                        </span>
                      </td>
                      <td class="a-r a-num a-dim">{{ c.avg ? won(c.avg) : '—' }}</td>
                      <td :class="c.vsAvg === '증가' ? 'up' : (c.vsAvg === '감소' ? 'down' : 'a-dim')">
                        {{ c.vsAvg }}
                      </td>
                    </tr>
                  </tbody>
                </table>

                <pre v-if="showJson" class="raw">{{ prettyJson(cr.summaryJson) }}</pre>
              </div>

              <!-- ② 검증 결과 -->
              <div class="cr-sec">
                <div class="cr-h"><b>검증 결과</b>
                  <span class="cr-time a-num">{{ (cr.durationMs / 1000).toFixed(1) }}초</span>
                </div>

                <div class="vg2">
                  <div class="vcard" :class="cr.finallyPassed ? 'is-ok' : 'is-bad'">
                    <div class="vc-h">
                      <b>규칙 검증</b>
                      <span class="a-bdg" :class="cr.finallyPassed ? 'a-bdg-ok' : 'a-bdg-dngr'">
                        {{ cr.finallyPassed ? '통과' : '실패' }}
                      </span>
                    </div>
                    <div class="vc-d">
                      코드가 숫자·방향·형식을 검사합니다. 실패하면 사용자에게 오류 문구가 나갑니다.
                    </div>
                  </div>

                  <div class="vcard" :class="cr.aiVerdictPassed ? 'is-ok' : 'is-warn'">
                    <div class="vc-h">
                      <b>AI 검증</b>
                      <span class="a-bdg" :class="cr.aiVerdictPassed ? 'a-bdg-ok' : 'a-bdg-warn'">
                        {{ cr.aiVerdictPassed ? '통과' : '지적 있음' }}
                      </span>
                    </div>
                    <div class="vc-d">{{ cr.aiVerdictReason }}</div>
                  </div>
                </div>

                <!--
                  시도 이력.
                  1차에 실패하고 2차에 통과했는지, 두 번 다 실패했는지가 다르다.
                  규칙 검증은 위반을 여러 개 한꺼번에 돌려주므로 항목별로 나눠 보여준다.
                -->
                <div class="atts">
                  <div v-for="a in cr.attempts" :key="a.no" class="att"
                       :class="a.rulePassed ? 'is-ok' : 'is-bad'">
                    <div class="att-h">
                      <span class="att-no a-num">{{ a.no }}차</span>
                      <span class="a-bdg" :class="a.rulePassed ? 'a-bdg-ok' : 'a-bdg-dngr'">
                        {{ a.rulePassed ? '통과' : '실패' }}
                      </span>
                      <span v-if="a.rulePassed" class="att-msg">규칙 기반 검증 통과</span>
                      <span v-else class="att-msg">위반 {{ a.violations.length }}건</span>
                    </div>
                    <ul v-if="!a.rulePassed" class="att-list">
                      <li v-for="(v, i) in a.violations" :key="i">{{ v }}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <!-- ③ 결과 미리보기. JSON 만 보면 사용자 화면에서 어떻게 읽히는지 알 수 없다 -->
              <div class="cr-sec">
                <div class="cr-h"><b>결과 미리보기</b>
                  <span class="cr-note">사용자 화면에 이렇게 나갑니다</span>
                </div>

                <div v-if="!cr.finallyPassed" class="a-notice a-notice-dngr">
                  <div>
                    <b>규칙 검증을 통과하지 못했습니다.</b>
                    사용자에게는 「분석 결과를 불러오는 데 문제가 있어요. 잠시 후 다시 시도해 주세요.」가 나갑니다.
                  </div>
                </div>

                <div v-else-if="preview" class="pv">
                  <p class="pv-sum" v-html="md(preview.summaryText)"></p>
                  <div class="pv-cards">
                    <div v-for="(it, i) in preview.insights" :key="i" class="pv-card">
                      <b>{{ it.title }}</b>
                      <p v-html="md(it.description)"></p>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import promptApi from '@/api/promptApi'
import { useAdminDialog } from '@/composables/useAdminDialog'

/*
 * 알림은 관리자 화면 공용 상자를 쓴다.
 *
 * 특히 버전 삭제가 중요하다. 예전에는 window.confirm 을 썼는데,
 * 브라우저가 이것을 억제하면 아무것도 묻지 않고 그냥 지워진다.
 */
const { toastSuccess, toastError, confirmDialog } = useAdminDialog()

const KEY_LABEL = {
  CONFLICT_DETECTION: '중복수혜 분석',
  CONFLICT_VERIFICATION: '중복수혜 재검증',
  CONSUMPTION_ANALYSIS: '소비 패턴 분석',
  CONSUMPTION_VERIFICATION: '소비 분석 재검증',
}

/*
 * 짝 프롬프트.
 * 검증 프롬프트는 독립된 기능이 아니라 분석 결과를 채점하는 것이라
 * 탭을 따로 두지 않고 분석 탭 아래에 함께 둔다.
 */
const PAIR = {
  CONSUMPTION_ANALYSIS: 'CONSUMPTION_VERIFICATION',
  CONFLICT_DETECTION: 'CONFLICT_VERIFICATION',
}
const PAIRED_KEYS = Object.values(PAIR)

/* 중복수혜 시험용 정책. 실제 검수 큐에 있는 건이다 */
const CONFLICT_SAMPLES = [
  { no: '20250220005400210477', type: '양쪽이 서로 지목', name: '작은 결혼식 지원',
    hint: '전체에서 유일하게 양쪽 공고가 서로를 지목한 건입니다.' },
  { no: '20260511005400213180', type: '한쪽에만 근거', name: '부산 청년내일저축계좌',
    hint: '검수 큐의 대부분을 차지하는 유형입니다.' },
  { no: '20260406005400212442', type: '관계 2건', name: '드림For 청년통장',
    hint: '한 정책에서 관계가 둘 나옵니다.' },
  { no: '20250718005400211409', type: '추출 오류', name: '학자금 대출이자 및 신용회복 지원',
    hint: '지목한 상대가 사실상 자기 자신입니다.' },
]

/*
 * 소비 분석 시험용 목데이터.
 * 세 가지가 각각 다른 규칙을 건드린다.
 */
const CONSUMPTION_SAMPLES = [
  {
    id: 'plain',
    type: '평범한 달',
    desc: '전월 대비 감소 · 기본 동작 확인',
    hint: '다섯 카테고리 중 넷이 감소입니다. 여기서 이상하면 프롬프트가 깨진 것입니다.',
    json: {
      "기준일": "2026-08-21", "이번달1일부터며칠까지": 21,
      "이번달총지출": 742000, "지난달같은기간총지출": 913500,
      "총지출증감액": 171500, "전체지출방향": "감소",
      "카테고리별지출": [
        { "카테고리": "식비", "이번달금액": 268000, "지난달같은기간대비": "감소", "지난달대비차이": -47000, "최근3개월평균금액": 302000, "평균대비": "감소" },
        { "카테고리": "교통", "이번달금액": 164000, "지난달같은기간대비": "감소", "지난달대비차이": -21000, "최근3개월평균금액": 178000, "평균대비": "감소" },
        { "카테고리": "카페·간식", "이번달금액": 132000, "지난달같은기간대비": "증가", "지난달대비차이": 18000, "최근3개월평균금액": 121000, "평균대비": "증가" },
        { "카테고리": "쇼핑", "이번달금액": 98000, "지난달같은기간대비": "감소", "지난달대비차이": -112500, "최근3개월평균금액": 145000, "평균대비": "감소" },
        { "카테고리": "문화·여가", "이번달금액": 80000, "지난달같은기간대비": "감소", "지난달대비차이": -9000, "최근3개월평균금액": 84000, "평균대비": "감소" }
      ]
    },
  },
  {
    id: 'new',
    type: '신규 카테고리',
    desc: '지난달에 없던 항목 등장',
    hint: '규칙 10번(신규 카테고리는 지난달 언급 금지)이 지켜지는지 보는 케이스입니다. AI가 자주 어깁니다.',
    json: {
      "기준일": "2026-08-21", "이번달1일부터며칠까지": 21,
      "이번달총지출": 688000, "지난달같은기간총지출": 512000,
      "총지출증감액": 176000, "전체지출방향": "증가",
      "카테고리별지출": [
        { "카테고리": "식비", "이번달금액": 241000, "지난달같은기간대비": "증가", "지난달대비차이": 33000, "최근3개월평균금액": 215000, "평균대비": "증가" },
        { "카테고리": "의료·건강", "이번달금액": 187000, "지난달같은기간대비": "신규", "지난달대비차이": 187000, "최근3개월평균금액": 0, "평균대비": "데이터없음" },
        { "카테고리": "교통", "이번달금액": 142000, "지난달같은기간대비": "감소", "지난달대비차이": -18000, "최근3개월평균금액": 155000, "평균대비": "감소" },
        { "카테고리": "카페·간식", "이번달금액": 118000, "지난달같은기간대비": "감소", "지난달대비차이": -26000, "최근3개월평균금액": 129000, "평균대비": "감소" }
      ]
    },
  },
  {
    id: 'surge',
    type: '증감률 100% 초과',
    desc: '쇼핑이 7배 늘어남',
    hint: '규칙 7·18번(100%를 넘으면 퍼센트를 쓰지 마라)이 걸리는 케이스입니다.',
    json: {
      "기준일": "2026-08-21", "이번달1일부터며칠까지": 21,
      "이번달총지출": 1204000, "지난달같은기간총지출": 431000,
      "총지출증감액": 773000, "전체지출방향": "증가",
      "카테고리별지출": [
        { "카테고리": "쇼핑", "이번달금액": 620000, "지난달같은기간대비": "증가", "지난달대비차이": 548000, "최근3개월평균금액": 96000, "평균대비": "증가" },
        { "카테고리": "식비", "이번달금액": 284000, "지난달같은기간대비": "증가", "지난달대비차이": 61000, "최근3개월평균금액": 231000, "평균대비": "증가" },
        { "카테고리": "여행·숙박", "이번달금액": 210000, "지난달같은기간대비": "신규", "지난달대비차이": 210000, "최근3개월평균금액": 0, "평균대비": "데이터없음" },
        { "카테고리": "교통", "이번달금액": 90000, "지난달같은기간대비": "감소", "지난달대비차이": -46000, "최근3개월평균금액": 124000, "평균대비": "감소" }
      ]
    },
  },
]

const SCOPE = {
  OTHER_POLICY: '다른 정책과의 제한', SAME_POLICY: '같은 사업 안의 중복',
  NOT_CONFLICT: '중복과 무관', UNCERTAIN: '판단 불가', ERROR: '오류',
}
const REL = { FORBIDDEN: '중복 불가', CONDITIONAL: '조건부', ALLOWED: '중복 가능' }
const D = {
  BIDIRECTIONAL: '양방향', SOURCE_TO_TARGET: '한쪽', UNKNOWN: '불명',
  CURRENT: '현재', PAST: '과거', CURRENT_OR_PAST: '현재·과거',
  APPLICATION: '신청', SELECTION: '선정', BENEFIT_RECEIPT: '수혜', HISTORY: '이력',
  YES: '적용', NO: '해당없음',
}

const allKeys = ref([])
const curKey = ref('')
const loading = ref(true)

/*
 * 편집기 상태를 두 벌 쓴다.
 * 주 프롬프트(main)와 짝 프롬프트(sub)가 같은 화면에 있기 때문이다.
 * 같은 모양이므로 함수는 상태를 인자로 받아 공유한다.
 */
function createEditor() {
  return reactive({
    key: '', versions: [], picked: null, content: '',
    draft: false, saving: false, activating: false, deleting: false,
    askMemo: false, memo: '',
  })
}
const main = createEditor()
const sub = createEditor()

// 짝 프롬프트는 탭에 띄우지 않는다. 분석 탭 아래에 들어간다
const tabKeys = computed(() => allKeys.value.filter(k => !PAIRED_KEYS.includes(k)))

/* 시험 실행 */
const testing = ref(false)
const testNo = ref('')
const conflictResult = ref(null)
const summaryJson = ref('')
const sampleId = ref('')
const cr = ref(null)
const showJson = ref(false)

const scopeBadge = computed(() => {
  const s = conflictResult.value?.scope
  if (s === 'OTHER_POLICY') return 'a-bdg-ok'
  if (s === 'ERROR') return 'a-bdg-dngr'
  return 'a-bdg-mute'
})

/**
 * 줄 끝 공백과 앞뒤 공백은 의미 없는 차이다.
 * 커서를 잘못 눌러 스페이스 하나가 들어간 것을 수정으로 보면
 * 실수로 새 버전이 만들어진다.
 */
function normalize(s) {
  return String(s || '').replace(/\r\n/g, '\n').split('\n')
    .map(line => line.replace(/\s+$/, '')).join('\n').trim()
}

const dirty = (ed) => !ed.draft && ed.picked
  && normalize(ed.content) !== normalize(ed.picked.content)

const canSave = (ed) => (ed.draft || dirty(ed)) && ed.content.trim().length > 0
const nextVersion = (ed) => ed.versions.length
  ? Math.max(...ed.versions.map(v => v.version)) + 1 : 1
const canActivate = (ed) => !ed.draft && !!ed.picked
  && ed.picked.isActive !== 'Y' && !dirty(ed) && !ed.activating
const canDelete = (ed) => !ed.draft && !!ed.picked
  && ed.picked.isActive !== 'Y' && ed.versions.length > 1 && !ed.deleting

/* ---- 로딩 ---- */
async function loadKeys() {
  loading.value = true
  try {
    allKeys.value = await promptApi.getKeys()
    const first = tabKeys.value[0]
    if (first) await selectKey(first)
  } catch (e) {
    allKeys.value = []
    toastError('프롬프트 목록을 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

async function selectKey(k) {
  curKey.value = k
  conflictResult.value = null
  cr.value = null

  await loadEditor(main, k)

  // 짝이 있고 DB 에도 등록돼 있을 때만 아래 편집기를 띄운다
  const pairKey = PAIR[k]
  if (pairKey && allKeys.value.includes(pairKey)) {
    await loadEditor(sub, pairKey)
  } else {
    sub.key = ''
    sub.versions = []
    sub.picked = null
    sub.content = ''
  }

  // 소비 분석 탭에 처음 들어오면 첫 목데이터를 채워둔다
  if (k === 'CONSUMPTION_ANALYSIS' && !summaryJson.value) {
    pickSample(CONSUMPTION_SAMPLES[0])
  }
}

async function loadEditor(ed, key) {
  ed.key = key
  ed.draft = false
  ed.askMemo = false

  try {
    ed.versions = await promptApi.getVersions(key)
  } catch (e) {
    ed.versions = []
    toastError('버전 목록을 불러오지 못했습니다.')
  }

  const active = ed.versions.find(v => v.isActive === 'Y') || ed.versions[0]
  if (active) {
    pick(ed, active)
    return
  }

  // 저장된 버전이 없다. 이전 기능의 값이 남아 있으면 안 된다
  ed.picked = null
  ed.content = ''
}

function pick(ed, v) {
  ed.draft = false
  ed.askMemo = false
  ed.picked = v
  ed.content = v?.content || ''
}

function newDraft(ed, copy) {
  ed.draft = true
  ed.askMemo = false
  ed.content = copy ? (ed.picked?.content || '') : ''
}

function cancel(ed) {
  ed.askMemo = false
  ed.draft = false
  ed.content = ed.picked?.content || ''
}

function openSave(ed) {
  ed.memo = ''
  ed.askMemo = true
}

async function save(ed) {
  if (!ed.memo.trim()) return
  ed.saving = true
  try {
    await promptApi.createVersion(ed.key, ed.content, ed.memo.trim())
    ed.versions = await promptApi.getVersions(ed.key)
    ed.draft = false
    ed.askMemo = false
    pick(ed, ed.versions[0])
    toastSuccess('새 버전으로 저장했습니다. 아직 적용되지 않았습니다.')
  } catch (e) {
    toastError('저장하지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    ed.saving = false
  }
}

async function activate(ed) {
  ed.activating = true
  try {
    const no = ed.picked.promptNo
    await promptApi.activate(ed.key, no)
    ed.versions = await promptApi.getVersions(ed.key)
    pick(ed, ed.versions.find(v => v.promptNo === no))
    toastSuccess('이 버전을 적용했습니다. 다음 분석부터 반영됩니다.')
  } catch (e) {
    toastError('적용하지 못했습니다. 잠시 후 다시 시도해주세요.')
  } finally {
    ed.activating = false
  }
}

async function remove(ed) {
  const ok = await confirmDialog({
    title: '버전을 삭제할까요?',
    message: `v${ed.picked.version} · ${KEY_LABEL[ed.key] || ed.key}`,
    detail: (ed.picked.memo ? `메모 · ${ed.picked.memo}\n\n` : '')
          + '삭제한 버전은 되돌릴 수 없습니다.',
    confirmText: '삭제',
    danger: true,
  })
  if (!ok) return

  ed.deleting = true
  try {
    await promptApi.deleteVersion(ed.key, ed.picked.promptNo)
    ed.versions = await promptApi.getVersions(ed.key)
    const active = ed.versions.find(v => v.isActive === 'Y') || ed.versions[0]
    if (active) {
      pick(ed, active)
    } else {
      ed.picked = null
      ed.content = ''
    }
    toastSuccess('버전을 삭제했습니다.')
  } catch (e) {
    toastError('삭제할 수 없습니다. 사용중이거나 마지막 버전입니다.')
  } finally {
    ed.deleting = false
  }
}

/* ---- 시험 실행 ---- */
async function runConflictTest() {
  testing.value = true
  conflictResult.value = null
  try {
    conflictResult.value = await promptApi.test(testNo.value, main.content)
  } catch (e) {
    toastError('시험 실행에 실패했습니다. 정책번호와 서버 로그를 확인해주세요.')
  } finally {
    testing.value = false
  }
}

function pickSample(s) {
  sampleId.value = s.id
  summaryJson.value = JSON.stringify(s.json, null, 2)
  cr.value = null
}

async function runConsumptionTest() {
  testing.value = true
  cr.value = null
  showJson.value = false
  try {
    cr.value = await promptApi.testConsumption(
      summaryJson.value, main.content, sub.key ? sub.content : null)
  } catch (e) {
    toastError('시험 실행에 실패했습니다. 입력 JSON 형식과 서버 로그를 확인해주세요.')
  } finally {
    testing.value = false
  }
}

/* ---- 결과 가공 ---- */

/*
 * 입력 요약.
 * 결과가 맞는지 채점하려면 무엇을 넣었는지 옆에 있어야 한다.
 * JSON 을 그대로 보여주면 눈으로 대조가 안 된다.
 */
const inputSummary = computed(() => {
  if (!cr.value?.summaryJson) return null
  try {
    const j = JSON.parse(cr.value.summaryJson)
    return {
      baseDate: j['기준일'],
      days: j['이번달1일부터며칠까지'],
      thisTotal: j['이번달총지출'],
      lastTotal: j['지난달같은기간총지출'],
      diff: j['총지출증감액'],
      direction: j['전체지출방향'],
      categories: (j['카테고리별지출'] || []).map(c => ({
        name: c['카테고리'],
        amount: c['이번달금액'],
        vsLast: c['지난달같은기간대비'],
        diff: c['지난달대비차이'],
        avg: c['최근3개월평균금액'],
        vsAvg: c['평균대비'],
      })),
    }
  } catch (e) {
    return null
  }
})

const preview = computed(() => {
  if (!cr.value?.finalContent) return null
  try {
    const j = JSON.parse(cr.value.finalContent)
    return { summaryText: j.summaryText || '', insights: j.insights || [] }
  } catch (e) {
    return null
  }
})

function won(n) {
  return Number(n || 0).toLocaleString()
}

function prettyJson(s) {
  try {
    return JSON.stringify(JSON.parse(s), null, 2)
  } catch (e) {
    return s
  }
}

/*
 * 프롬프트 규칙 14번이 볼드체를 요구한다.
 * 미리보기에서 실제로 굵게 보여야 그 규칙이 지켜졌는지 판단할 수 있다.
 * AI 응답을 그대로 넣으므로 먼저 이스케이프하고 ** 만 태그로 바꾼다.
 */
function md(s) {
  const esc = String(s || '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return esc.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
}

onMounted(loadKeys)
</script>

<style scoped>
.mb-2 { margin-bottom: 10px; }

.code {
  background: var(--a-c100);
  border-radius: 3px;
  padding: 1px 5px;
  font-size: var(--a-t-sm);
}

.body {
  display: grid;
  grid-template-columns: 236px 1fr;
  gap: 14px;
  align-items: start;
}

.right { display: flex; flex-direction: column; gap: 14px; min-width: 0; }

/* ---- 버전 이력 ---- */
.vs { overflow: hidden; }

.v-item {
  display: block; width: 100%; text-align: left; border: 0;
  border-bottom: 1px solid var(--a-c100);
  background: var(--a-c0); padding: 12px 16px;
  cursor: pointer; font-family: var(--a-font);
}
.v-item:hover { background: var(--a-c50); }

/* 고른 버전. 노랑은 「지금 손대야 할 곳」 하나로 쓰기로 했으므로 여기서는 안 쓴다 */
.v-item.is-on { background: var(--a-c50); box-shadow: inset 2px 0 0 var(--a-c900); }
.v-item.is-draft {
  background: var(--a-info-bg);
  box-shadow: inset 2px 0 0 var(--a-info);
  cursor: default;
}

.v-top { display: flex; align-items: center; gap: 6px; }
.v-top b { font-size: var(--a-t-md); letter-spacing: var(--a-ls-md); font-weight: 700; }
.v-memo { font-size: var(--a-t-sm); color: var(--a-c500); margin: 5px 0 0; line-height: 1.5; }
.v-none {
  font-size: var(--a-t-sm); color: var(--a-c400);
  margin: 0; padding: 18px 16px; line-height: 1.6;
}

/* ---- 편집 ---- */
.ed { padding: 16px; }

/* 짝 프롬프트는 주 프롬프트에 딸린 것이라 왼쪽 막대로 종속을 표시한다 */
.ed.sub { box-shadow: inset 2px 0 0 var(--a-c300); }

.e-head {
  display: flex; justify-content: space-between; align-items: center;
  gap: 12px; margin-bottom: 12px; flex-wrap: wrap;
}

.e-title { font-size: var(--a-t-lg); letter-spacing: var(--a-ls-lg); font-weight: 700; }
.e-title em {
  font-style: normal; font-size: var(--a-t-sm);
  letter-spacing: var(--a-ls-sm); color: var(--a-c500); font-weight: 400;
}

.e-btns { display: flex; gap: 6px; flex-wrap: wrap; }

/* 버튼 폭을 고정한다. 「적용 중…」처럼 글자가 늘어나도 줄이 안 흔들린다 */
.e-w { width: 86px; padding: 0; }
.e-w-lg { width: 108px; padding: 0; }

.ed-area {
  width: 100%; height: 420px;
  border: var(--a-bd-ctl); border-radius: var(--a-r); padding: 14px;
  /* 고정폭 글꼴을 쓰지 않는다. 프롬프트는 코드가 아니라 한국어 문장이고,
     고정폭에서는 한글이 뭉쳐 읽는 속도가 떨어진다 */
  font-family: var(--a-font);
  font-size: var(--a-t-md); letter-spacing: var(--a-ls-md);
  line-height: 1.85; color: var(--a-c700);
  resize: vertical; outline: 0;
}
.ed-area:focus { border-color: var(--a-c400); }
.ed-area.is-short { height: 260px; }

/* 입력 JSON 은 값을 대조해야 해서 고정폭이 낫다 */
.ed-area.is-json {
  height: 200px; margin-top: 10px;
  font-family: ui-monospace, Menlo, Consolas, monospace;
  font-size: var(--a-t-sm); line-height: 1.6;
}

.ed-count {
  text-align: right; font-size: var(--a-t-sm);
  color: var(--a-c400); margin-top: 6px;
}

/* ---- 저장 메모 ---- */
.memo {
  margin-top: 12px; border: var(--a-bd);
  border-left: 2px solid var(--a-c900);
  border-radius: 0 var(--a-r) var(--a-r) 0;
  background: var(--a-c50); padding: 14px;
}
.memo label {
  display: block; font-size: var(--a-t-sm);
  color: var(--a-c500); margin-bottom: 7px;
}
.memo input {
  width: 100%; height: var(--a-h);
  border: var(--a-bd-ctl); border-radius: var(--a-r); padding: 0 12px;
  font-family: var(--a-font); font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md); outline: 0;
  background: var(--a-c0); color: var(--a-c900);
}
.memo input:focus { border-color: var(--a-c400); }
.memo-btns { display: flex; justify-content: flex-end; gap: 6px; margin-top: 10px; }

/* ---- 시험 실행 ---- */
.test { padding: 16px; }

.t-head {
  display: flex; align-items: baseline; gap: 10px;
  margin-bottom: 12px; flex-wrap: wrap;
}
.t-head b { font-size: var(--a-t-lg); letter-spacing: var(--a-ls-lg); }
.t-head span { font-size: var(--a-t-sm); color: var(--a-c500); }

.t-run { display: flex; gap: 8px; align-items: center; margin-top: 10px; }

.t-run input {
  width: 220px; height: var(--a-h);
  border: var(--a-bd-ctl); border-radius: var(--a-r); padding: 0 12px;
  font-family: var(--a-font); font-size: var(--a-t-md);
  outline: 0; background: var(--a-c0); color: var(--a-c900);
}
.t-run input:focus { border-color: var(--a-c400); }

.t-wait {
  display: flex; align-items: center; gap: 8px;
  font-size: var(--a-t-sm); color: var(--a-c500);
}

.t-note { margin-top: 10px; }

/* 라벨이 연하면 아래 버튼까지 비활성처럼 보인다 */
.t-label {
  font-size: var(--a-t-sm); color: var(--a-c700); font-weight: 600;
  margin-top: 18px; margin-bottom: 8px;
}

.t-samples { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
.t-samples-3 { grid-template-columns: repeat(3, 1fr); }

.t-sample {
  border: var(--a-bd-ctl); background: var(--a-c0);
  border-radius: var(--a-r); padding: 12px 13px; text-align: left;
  font-family: var(--a-font); cursor: pointer;
  display: flex; align-items: center; gap: 11px;
}
.t-sample:hover { border-color: var(--a-c400); background: var(--a-c50); }
.t-sample.is-on {
  border-color: var(--a-c900);
  box-shadow: inset 0 0 0 1px var(--a-c900);
  background: var(--a-c50);
}

.t-bar {
  width: 3px; height: 30px; background: var(--a-c400);
  border-radius: 2px; flex: 0 0 3px;
}
.t-sample.is-on .t-bar { background: var(--a-c900); }

.t-body { min-width: 0; }
.t-body b {
  display: block; font-size: var(--a-t-md);
  font-weight: 600; color: var(--a-c900);
}
.t-body span {
  display: block; font-size: var(--a-t-cap); color: var(--a-c500);
  margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}

/* ---- 중복수혜 결과 ---- */
.t-result {
  margin-top: 16px; border: var(--a-bd);
  border-radius: var(--a-r-lg); padding: 16px;
}
.r-head {
  display: flex; justify-content: space-between; align-items: center;
  gap: 10px; margin-bottom: 12px;
}
.r-head b { font-size: var(--a-t-lg); letter-spacing: var(--a-ls-lg); }
.r-none { font-size: var(--a-t-md); color: var(--a-c500); }

.rel { border-top: 1px solid var(--a-c100); padding-top: 12px; margin-top: 12px; }
.rel:first-child { border-top: 0; padding-top: 0; margin-top: 0; }
.rel-top { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.rel-top b { font-size: var(--a-t-md); letter-spacing: var(--a-ls-md); }
.rel-ev {
  font-size: var(--a-t-sm); color: var(--a-c700);
  background: var(--a-c50); border: var(--a-bd);
  border-left: 2px solid var(--a-c400);
  border-radius: 0 var(--a-r) var(--a-r) 0;
  padding: 10px 13px; margin: 9px 0; line-height: 1.7;
}
.rel-meta { display: flex; gap: 6px; flex-wrap: wrap; }
.rel-meta span {
  font-size: var(--a-t-cap); background: var(--a-c100);
  border-radius: 4px; padding: 4px 8px; color: var(--a-c700);
}
.rel-meta em { font-style: normal; color: var(--a-c400); margin-right: 5px; }

/* ---- 소비 분석 결과 ---- */
.cr { margin-top: 18px; display: flex; flex-direction: column; gap: 16px; }

.cr-sec { border: var(--a-bd); border-radius: var(--a-r-lg); padding: 14px 16px; }

.cr-h {
  display: flex; align-items: baseline; gap: 10px;
  margin-bottom: 12px;
}
.cr-h b { font-size: var(--a-t-md); font-weight: 700; }
.cr-more { margin-left: auto; }
.cr-time { margin-left: auto; font-size: var(--a-t-sm); color: var(--a-c400); }
.cr-note { font-size: var(--a-t-sm); color: var(--a-c400); }

.in-top {
  font-size: var(--a-t-sm); color: var(--a-c600);
  margin-bottom: 12px; line-height: 1.7;
}
.in-top b { color: var(--a-c900); }

.in-tbl { border: var(--a-bd); border-radius: var(--a-r); overflow: hidden; }

.up { color: var(--a-warn); font-weight: 600; }
.down { color: var(--a-info); font-weight: 600; }

.raw {
  margin: 12px 0 0; padding: 12px;
  max-height: 300px; overflow: auto;
  border: var(--a-bd); border-radius: var(--a-r);
  background: var(--a-c50);
  font-size: var(--a-t-cap); line-height: 1.6;
  color: var(--a-c600); white-space: pre-wrap;
}

/* 검증 두 장 */
.vg2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }

.vcard { border: var(--a-bd); border-radius: var(--a-r); padding: 12px 14px; }
.vcard.is-ok { border-color: var(--a-ok-bd); background: var(--a-ok-bg); }
.vcard.is-warn { border-color: var(--a-warn-bd); background: var(--a-warn-bg); }
.vcard.is-bad { border-color: var(--a-dngr-bd); background: var(--a-dngr-bg); }

.vc-h { display: flex; align-items: center; gap: 8px; margin-bottom: 7px; }
.vc-h b { font-size: var(--a-t-md); font-weight: 700; }
.vc-d { font-size: var(--a-t-sm); color: var(--a-c600); line-height: 1.6; }

/* 시도 이력 */
.atts { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }

.att { border: var(--a-bd); border-radius: var(--a-r); padding: 11px 13px; }
.att.is-ok { border-left: 2px solid var(--a-ok); }
.att.is-bad { border-left: 2px solid var(--a-dngr); }

.att-h { display: flex; align-items: center; gap: 8px; }
.att-no { font-size: var(--a-t-sm); color: var(--a-c500); font-weight: 600; }
.att-msg { font-size: var(--a-t-sm); color: var(--a-c600); }

.att-list { margin: 9px 0 0; padding: 0 0 0 18px; }
.att-list li {
  font-size: var(--a-t-sm); color: var(--a-dngr);
  line-height: 1.7; word-break: keep-all;
}

/* 미리보기 */
.pv { background: var(--a-c50); border: var(--a-bd); border-radius: var(--a-r); padding: 16px; }

.pv-sum {
  margin: 0 0 14px; font-size: var(--a-t-md);
  line-height: 1.75; color: var(--a-c900);
}

.pv-cards { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

.pv-card {
  background: var(--a-c0); border: var(--a-bd);
  border-radius: var(--a-r); padding: 13px 14px;
}
.pv-card b { display: block; font-size: var(--a-t-md); font-weight: 700; margin-bottom: 6px; }
.pv-card p { margin: 0; font-size: var(--a-t-sm); color: var(--a-c600); line-height: 1.7; }

@media (max-width: 1200px) {
  .t-samples { grid-template-columns: repeat(2, 1fr); }
  .pv-cards { grid-template-columns: 1fr; }
  .vg2 { grid-template-columns: 1fr; }
}

@media (max-width: 900px) {
  .body { grid-template-columns: 1fr; }
}
</style>