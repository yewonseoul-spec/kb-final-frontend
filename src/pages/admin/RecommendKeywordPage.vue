<template>
  <div>
    <div class="a-head">
      <div><h1>추천검색어 설정</h1></div>
      <p>사용자 혜택 검색 화면에 노출되는 추천검색어를 관리합니다.</p>
    </div>

    <!--
      노출 중인 것 보기와 추가를 한 카드로 묶는다.
      활성 개수는 아래 표에서도 셀 수 있어 카드 한 장이 통째로 중복이었고,
      화면이 길어져 표를 보려면 스크롤을 내려야 했다.
    -->
    <section class="a-card mb-3">
      <div class="a-card-h">
        <h2>지금 노출 중</h2>
        <span class="a-sub">사용자 혜택 검색 화면</span>
        <span class="k-count a-more"><b class="a-num">{{ activeKeywords.length }}</b>개</span>
      </div>

      <div class="a-card-b">
        <div v-if="loading" class="k-msg">추천검색어를 불러오는 중입니다.</div>

        <!--
          칩에 초록을 쓴다. 아래 표의 「활성」 배지와 같은 색이라
          위 여섯 개가 아래 여섯 줄이라는 것이 색으로 연결된다.
          흰 바탕에 흰 칩이면 테두리 1px만 남아 배경과 구분이 안 된다.
        -->
        <div v-else-if="activeKeywords.length" class="k-chips">
          <span v-for="(item, i) in activeKeywords" :key="item.keywordCode" class="k-chip">
            <i class="a-num">{{ i + 1 }}</i>{{ item.keywordName }}
          </span>
        </div>

        <!-- 비어 있는 화면은 무엇을 하라는 안내여야 한다 -->
        <div v-else class="k-msg">
          노출 중인 추천검색어가 없습니다. 아래에서 추가하면 바로 검색 화면에 나갑니다.
        </div>

        <div class="k-add">
          <input v-model.trim="newKeyword" type="text" maxlength="30"
                 placeholder="추천검색어를 입력하세요"
                 :disabled="adding" @keyup.enter="onAdd" />
          <button class="a-btn a-btn-dark a-btn-fix"
                  :disabled="adding || !newKeyword.trim()" @click="onAdd">
            {{ adding ? '추가 중…' : '추가' }}
          </button>
        </div>

        <!-- 입력 오류는 입력칸 바로 아래에 둔다.
             토스트로 띄우면 무엇을 고쳐야 하는지와 떨어진다 -->
        <div v-if="errorMessage" class="a-notice a-notice-dngr k-err">
          <div>{{ errorMessage }}</div>
        </div>
      </div>
    </section>

    <!-- 전체 목록 -->
    <section class="a-card">
      <div class="a-card-h">
        <h2>전체 <span class="a-num">{{ keywords.length }}</span>건</h2>
        <span class="a-sub">노출 상태를 바꾸거나 삭제할 수 있습니다</span>
      </div>

      <div v-if="loading" class="a-loading">
        <span class="a-spin"></span> 불러오는 중
      </div>

      <div v-else-if="!keywords.length" class="a-empty">
        등록된 추천검색어가 없습니다.
      </div>

      <table v-else class="a-tbl">
        <colgroup>
          <col style="width:88px">
          <col style="min-width:220px">
          <col style="width:120px">
          <col style="width:120px">
          <col style="width:190px">
        </colgroup>
        <thead>
          <tr>
            <th>번호</th>
            <th>추천검색어</th>
            <th>상태</th>
            <th class="a-r">노출 순서</th>
            <th class="a-r">관리</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in keywords" :key="item.keywordCode">
            <td class="a-num a-dim">{{ item.keywordCode }}</td>

            <td class="a-t-name">{{ item.keywordName }}</td>

            <td>
              <span class="a-bdg a-bdg-fix"
                    :class="item.isActive === 'Y' ? 'a-bdg-ok' : 'a-bdg-mute'">
                <span class="a-dot">{{ item.isActive === 'Y' ? '●' : '○' }}</span>
                {{ item.isActive === 'Y' ? '활성' : '비활성' }}
              </span>
            </td>

            <td class="a-r a-num a-dim">{{ item.displayOrder }}</td>

            <td class="a-t-act">
              <!--
                버튼 색 의미를 고정한다.
                예전에는 뒤집혀 있었다. 비활성화가 빨강, 삭제가 회색이었다.
                빨강은 되돌릴 수 없는 것에만 쓴다.
                비활성화는 다시 켤 수 있으므로 빨강이 아니다.
              -->
              <button class="a-btn a-btn-xs a-btn-quiet a-btn-fix-sm"
                      :disabled="pendingKeywordCode === item.keywordCode"
                      @click="onToggle(item)">
                {{
                  pendingKeywordCode === item.keywordCode
                    ? '처리 중…'
                    : item.isActive === 'Y' ? '비활성화' : '활성화'
                }}
              </button>

              <button class="a-btn a-btn-xs a-btn-dngr a-btn-fix-sm"
                      :disabled="pendingKeywordCode === item.keywordCode"
                      @click="onDelete(item)">
                삭제
              </button>
            </td>
          </tr>
        </tbody>
      </table>
    </section>
  </div>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import adminApi from '@/api/adminApi'
import { useAdminDialog } from '@/composables/useAdminDialog'

/*
 * 알림은 관리자 화면 공용 상자를 쓴다.
 *
 * 예전에는 실패를 window.alert 으로, 삭제 확인을 window.confirm 으로 처리했다.
 * confirm 을 바꾼 이유가 특히 중요하다. 브라우저는 이것을 억제할 수 있는데,
 * 그러면 아무것도 묻지 않고 그냥 지워진다.
 */
const { toastSuccess, toastError, confirmDialog } = useAdminDialog()

const keywords = ref([])
const newKeyword = ref('')

const loading = ref(false)
const adding = ref(false)

const pendingKeywordCode = ref(null)

const errorMessage = ref('')

/*
 * 현재 사용자 화면에 노출되는 활성 추천검색어.
 * 나가는 순서대로 정렬한다. 표와 순서가 다르면 어느 쪽이 맞는지 헷갈린다.
 */
const activeKeywords = computed(() =>
  [...keywords.value]
    .filter((item) => item.isActive === 'Y')
    .sort((a, b) => Number(a.displayOrder ?? 0) - Number(b.displayOrder ?? 0))
)

/*
 * 추천검색어 전체 조회
 */
const loadKeywords = async () => {
  loading.value = true

  try {
    const result = await adminApi.getRecommendKeywords()

    keywords.value = Array.isArray(result)
      ? result
      : result?.content || result?.list || []
  } catch (error) {
    console.error('추천검색어 조회 실패:', error)
    keywords.value = []
    // 예전에는 콘솔에만 남겼다.
    // 화면에는 "등록된 추천검색어가 없습니다" 만 떠서
    // 정말 없는 것인지 조회가 실패한 것인지 구분할 수 없었다
    toastError('추천검색어를 불러오지 못했습니다.')
  } finally {
    loading.value = false
  }
}

/*
 * 추천검색어 추가
 */
const onAdd = async () => {
  errorMessage.value = ''

  const keyword = newKeyword.value.trim()

  if (!keyword) {
    errorMessage.value = '추천검색어를 입력해주세요.'
    return
  }

  /*
   * 프론트에서도 1차 중복 확인
   * 백엔드에서도 반드시 중복 체크하는 것이 좋음
   */
  const duplicated = keywords.value.some(
    (item) => item.keywordName?.trim().toLowerCase() === keyword.toLowerCase()
  )

  if (duplicated) {
    errorMessage.value = '이미 등록된 추천검색어입니다.'
    return
  }

  adding.value = true

  try {
    await adminApi.createRecommendKeyword(keyword)
    newKeyword.value = ''
    await loadKeywords()
    toastSuccess(`'${keyword}' 을(를) 추가했습니다.`)
  } catch (error) {
    console.error('추천검색어 추가 실패:', error)

    if (error.response?.status === 409) {
      errorMessage.value = '이미 등록된 추천검색어입니다.'
    } else {
      errorMessage.value = '추천검색어 추가에 실패했습니다.'
    }
  } finally {
    adding.value = false
  }
}

/*
 * 추천검색어 활성 / 비활성 변경
 */
const onToggle = async (item) => {
  if (pendingKeywordCode.value !== null) return

  const nextStatus = item.isActive === 'Y' ? 'N' : 'Y'

  pendingKeywordCode.value = item.keywordCode

  try {
    await adminApi.changeRecommendKeywordActive(item.keywordCode, nextStatus)
    await loadKeywords()
    toastSuccess(
      nextStatus === 'Y'
        ? `'${item.keywordName}' 을(를) 노출합니다.`
        : `'${item.keywordName}' 을(를) 감췄습니다.`
    )
  } catch (error) {
    console.error('추천검색어 상태 변경 실패:', error)
    toastError('추천검색어 상태 변경에 실패했습니다.')
  } finally {
    pendingKeywordCode.value = null
  }
}

/*
 * 추천검색어 삭제
 */
const onDelete = async (item) => {
  if (pendingKeywordCode.value !== null) return

  const confirmed = await confirmDialog({
    title: '추천검색어를 삭제할까요?',
    message: `'${item.keywordName}'`,
    detail: '삭제한 추천검색어는 되돌릴 수 없습니다.\n잠시 감추려면 비활성화를 쓰세요.',
    confirmText: '삭제',
    danger: true,
  })

  if (!confirmed) return

  pendingKeywordCode.value = item.keywordCode

  try {
    await adminApi.deleteRecommendKeyword(item.keywordCode)
    await loadKeywords()
    toastSuccess(`'${item.keywordName}' 을(를) 삭제했습니다.`)
  } catch (error) {
    console.error('추천검색어 삭제 실패:', error)
    toastError('추천검색어 삭제에 실패했습니다.')
  } finally {
    pendingKeywordCode.value = null
  }
}

/*
 * 페이지 진입 시 목록 조회
 */
onMounted(() => {
  loadKeywords()
})
</script>

<style scoped>
.mb-3 { margin-bottom: 14px; }

.k-count {
  color: var(--a-c500);
  font-size: var(--a-t-sm);
  white-space: nowrap;
}

.k-count b {
  color: var(--a-c900);
  font-size: var(--a-t-md);
  font-weight: 700;
}

.k-chips { display: flex; flex-wrap: wrap; gap: 7px; }

/*
  검색어 칩.
  아래 표의 「활성」 배지와 같은 초록을 쓴다.
  앞에 노출 순서를 붙여 「나가는 차례대로 나열돼 있다」를 함께 알린다.
*/
.k-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 13px;
  border: 1px solid var(--a-ok-bd);
  border-radius: 999px;
  background: var(--a-ok-bg);
  color: var(--a-ok);
  font-size: var(--a-t-sm);
  letter-spacing: var(--a-ls-sm);
  font-weight: 600;
}

.k-chip i {
  font-style: normal;
  font-size: 10.5px;
  opacity: 0.6;
}

.k-msg { color: var(--a-c400); font-size: var(--a-t-sm); }

/* 노출 중인 것 바로 아래에 둔다. 추가하면 이 줄이 늘어나는 것이 보인다 */
.k-add {
  display: flex;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px dashed var(--a-c200);
}

.k-add input {
  width: 320px;
  height: var(--a-h);
  border: var(--a-bd-ctl);
  border-radius: var(--a-r);
  padding: 0 12px;
  background: var(--a-c0);
  color: var(--a-c900);
  font-family: var(--a-font);
  font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md);
  outline: 0;
}

.k-add input:focus { border-color: var(--a-c400); }
.k-add input:disabled { background: var(--a-c50); color: var(--a-c400); }

.k-err { margin-top: 12px; }
</style>