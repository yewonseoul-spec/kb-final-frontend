<template>
  <main class="recommend-admin-page">
    <div class="page-header">
      <div>
        <h1>추천검색어 설정</h1>
        <p>
          사용자 혜택 검색 화면에 노출되는
          추천검색어를 관리합니다.
        </p>
      </div>
    </div>

    <!-- 현재 활성 추천검색어 -->
    <section class="admin-card active-summary">
      <div class="section-title-row">
        <div>
          <h2>현재 활성 추천검색어</h2>
          <p>
            사용자 혜택 검색 화면에 현재 노출되고 있습니다.
          </p>
        </div>

        <strong class="active-count">
          {{ activeKeywords.length }}개
        </strong>
      </div>

      <div
        v-if="activeKeywords.length"
        class="keyword-preview"
      >
        <span
          v-for="item in activeKeywords"
          :key="item.keywordCode"
          class="keyword-chip"
        >
          {{ item.keywordName }}
        </span>
      </div>

      <p
        v-else-if="!loading"
        class="empty-message"
      >
        현재 활성화된 추천검색어가 없습니다.
      </p>

      <p
        v-else
        class="empty-message"
      >
        추천검색어를 불러오는 중입니다.
      </p>
    </section>

    <!-- 추천검색어 추가 -->
    <section class="admin-card add-section">
      <div class="section-title-row">
        <div>
          <h2>추천검색어 추가</h2>
          <p>
            새 추천검색어를 입력하면
            사용자 검색 화면에 바로 노출됩니다.
          </p>
        </div>
      </div>

      <div class="add-form">
        <input
          v-model.trim="newKeyword"
          type="text"
          maxlength="30"
          placeholder="추천검색어를 입력하세요"
          :disabled="adding"
          @keyup.enter="onAdd"
        />

        <button
          type="button"
          class="btn btn-dark"
          :disabled="adding || !newKeyword.trim()"
          @click="onAdd"
        >
          {{ adding ? "추가 중" : "추가" }}
        </button>
      </div>

      <p
        v-if="errorMessage"
        class="error-message"
      >
        {{ errorMessage }}
      </p>
    </section>

    <!-- 전체 추천검색어 목록 -->
    <section class="admin-card">
      <div class="list-header">
        <h2>
          전체 {{ keywords.length }}건
        </h2>

        <span class="list-description">
          활성/비활성 상태를 변경하거나 삭제할 수 있습니다.
        </span>
      </div>

      <div class="keyword-table">
        <div class="table-row table-head">
          <div>번호</div>
          <div>추천검색어</div>
          <div>상태</div>
          <div>노출 순서</div>
          <div>관리</div>
        </div>

        <div
          v-for="item in keywords"
          :key="item.keywordCode"
          class="table-row"
        >
          <div>
            {{ item.keywordCode }}
          </div>

          <div class="keyword-name">
            {{ item.keywordName }}
          </div>

          <div>
            <span
              class="status-badge"
              :class="
                item.isActive === 'Y'
                  ? 'active'
                  : 'inactive'
              "
            >
              {{
                item.isActive === "Y"
                  ? "활성"
                  : "비활성"
              }}
            </span>
          </div>

          <div>
            {{ item.displayOrder }}
          </div>

          <div class="action-buttons">
            <button
              type="button"
              class="btn btn-outline"
              :class="{
                activate: item.isActive === 'N',
              }"
              :disabled="
                pendingKeywordCode === item.keywordCode
              "
              @click="onToggle(item)"
            >
              {{
                pendingKeywordCode === item.keywordCode
                  ? "처리 중"
                  : item.isActive === "Y"
                    ? "비활성화"
                    : "활성화"
              }}
            </button>

            <button
              type="button"
              class="btn btn-danger-outline"
              :disabled="
                pendingKeywordCode === item.keywordCode
              "
              @click="onDelete(item)"
            >
              삭제
            </button>
          </div>
        </div>

        <div
          v-if="!keywords.length && !loading"
          class="empty-table"
        >
          등록된 추천검색어가 없습니다.
        </div>

        <div
          v-if="loading"
          class="empty-table"
        >
          추천검색어를 불러오는 중입니다.
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import {
  computed,
  onMounted,
  ref,
} from "vue";

import adminApi from "@/api/adminApi";

const keywords = ref([]);
const newKeyword = ref("");

const loading = ref(false);
const adding = ref(false);

const pendingKeywordCode = ref(null);

const errorMessage = ref("");

/*
 * 현재 사용자 화면에 노출되는 활성 추천검색어
 */
const activeKeywords = computed(() =>
  [...keywords.value]
    .filter(
      (item) => item.isActive === "Y"
    )
    .sort(
      (a, b) =>
        Number(a.displayOrder ?? 0)
        - Number(b.displayOrder ?? 0)
    )
);

/*
 * 추천검색어 전체 조회
 */
const loadKeywords = async () => {
  loading.value = true;

  try {
    const result =
      await adminApi.getRecommendKeywords();

    keywords.value =
      Array.isArray(result)
        ? result
        : result?.content
          || result?.list
          || [];
  } catch (error) {
    console.error(
      "추천검색어 조회 실패:",
      error,
    );

    keywords.value = [];
  } finally {
    loading.value = false;
  }
};

/*
 * 추천검색어 추가
 */
const onAdd = async () => {
  errorMessage.value = "";

  const keyword =
    newKeyword.value.trim();

  if (!keyword) {
    errorMessage.value =
      "추천검색어를 입력해주세요.";
    return;
  }

  /*
   * 프론트에서도 1차 중복 확인
   * 백엔드에서도 반드시 중복 체크하는 것이 좋음
   */
  const duplicated =
    keywords.value.some(
      (item) =>
        item.keywordName
          ?.trim()
          .toLowerCase()
        === keyword.toLowerCase()
    );

  if (duplicated) {
    errorMessage.value =
      "이미 등록된 추천검색어입니다.";
    return;
  }

  adding.value = true;

  try {
    await adminApi.createRecommendKeyword(
      keyword,
    );

    newKeyword.value = "";

    await loadKeywords();
  } catch (error) {
    console.error(
      "추천검색어 추가 실패:",
      error,
    );

    if (
      error.response?.status === 409
    ) {
      errorMessage.value =
        "이미 등록된 추천검색어입니다.";
    } else {
      errorMessage.value =
        "추천검색어 추가에 실패했습니다.";
    }
  } finally {
    adding.value = false;
  }
};

/*
 * 추천검색어 활성 / 비활성 변경
 */
const onToggle = async (item) => {
  if (
    pendingKeywordCode.value !== null
  ) {
    return;
  }

  const nextStatus =
    item.isActive === "Y"
      ? "N"
      : "Y";

  pendingKeywordCode.value =
    item.keywordCode;

  try {
    await adminApi
      .changeRecommendKeywordActive(
        item.keywordCode,
        nextStatus,
      );

    await loadKeywords();
  } catch (error) {
    console.error(
      "추천검색어 상태 변경 실패:",
      error,
    );

    window.alert(
      "추천검색어 상태 변경에 실패했습니다."
    );
  } finally {
    pendingKeywordCode.value = null;
  }
};

/*
 * 추천검색어 삭제
 */
const onDelete = async (item) => {
  if (
    pendingKeywordCode.value !== null
  ) {
    return;
  }

  const confirmed =
    window.confirm(
      `'${item.keywordName}' 추천검색어를 삭제할까요?`
    );

  if (!confirmed) {
    return;
  }

  pendingKeywordCode.value =
    item.keywordCode;

  try {
    await adminApi
      .deleteRecommendKeyword(
        item.keywordCode,
      );

    await loadKeywords();
  } catch (error) {
    console.error(
      "추천검색어 삭제 실패:",
      error,
    );

    window.alert(
      "추천검색어 삭제에 실패했습니다."
    );
  } finally {
    pendingKeywordCode.value = null;
  }
};

/*
 * 페이지 진입 시 목록 조회
 */
onMounted(() => {
  loadKeywords();
});
</script>

<style scoped>
.recommend-admin-page {
  padding: 26px;
  background: #f5f5f5;
  min-height: 100%;
  color: #24211e;
}

.page-header {
  margin-bottom: 22px;
}

.page-header h1 {
  margin: 0;
  font-size: 25px;
  font-weight: 700;
}

.page-header p {
  margin: 8px 0 0;
  color: #77716a;
  font-size: 13px;
}

.admin-card {
  padding: 20px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: #fff;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.06);
}

.section-title-row {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.section-title-row h2,
.list-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
}

.section-title-row p {
  margin: 6px 0 0;
  color: #8a847c;
  font-size: 12px;
}

.active-count {
  color: #e19a00;
  font-size: 18px;
  white-space: nowrap;
}

.keyword-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 9px;
  margin-top: 20px;
}

.keyword-chip {
  padding: 8px 15px;
  border: 1px solid #e2d7c7;
  border-radius: 18px;
  background: #fffaf2;
  color: #3b352e;
  font-size: 12px;
}

.add-form {
  display: flex;
  gap: 8px;
  margin-top: 17px;
}

.add-form input {
  width: 320px;
  height: 38px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid #d8d8d8;
  border-radius: 4px;
  background: #fff;
  outline: none;
  font: inherit;
}

.add-form input:focus {
  border-color: #d59e00;
}

.add-form input:disabled {
  background: #f5f5f5;
}

.btn {
  height: 34px;
  padding: 0 13px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
}

.btn:disabled {
  opacity: 0.55;
  cursor: default;
}

.btn-dark {
  min-width: 70px;
  height: 38px;
  border: 1px solid #22282d;
  background: #22282d;
  color: #fff;
}

.btn-outline {
  border: 1px solid #ef5350;
  background: #fff;
  color: #ef5350;
}

.btn-outline.activate {
  border-color: #329869;
  color: #329869;
}

.btn-danger-outline {
  border: 1px solid #777;
  background: #fff;
  color: #555;
}

.list-header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 13px;
}

.list-description {
  color: #999;
  font-size: 11px;
}

.keyword-table {
  width: 100%;
}

.table-row {
  display: grid;
  grid-template-columns:
    70px
    minmax(180px, 1fr)
    100px
    100px
    190px;
  align-items: center;
  min-height: 48px;
  padding: 0 8px;
  border-bottom: 1px solid #e5e5e5;
  box-sizing: border-box;
  font-size: 12px;
}

.table-head {
  min-height: 38px;
  background: #f6f6f6;
  color: #555;
  font-weight: 600;
}

.keyword-name {
  font-weight: 600;
}

.status-badge {
  display: inline-flex;
  padding: 4px 7px;
  border-radius: 4px;
  font-size: 11px;
  font-weight: 600;
}

.status-badge.active {
  background: #dff3e7;
  color: #218455;
}

.status-badge.inactive {
  background: #eeeeee;
  color: #777;
}

.action-buttons {
  display: flex;
  gap: 6px;
}

.empty-message,
.empty-table {
  color: #999;
  font-size: 12px;
}

.empty-message {
  margin: 18px 0 0;
}

.empty-table {
  padding: 40px;
  text-align: center;
}

.error-message {
  margin: 8px 0 0;
  color: #e34b4b;
  font-size: 12px;
}
</style>