<template>
  <li class="benefit-item">
    <div class="benefit-main">
      <KbBadge class="benefit-badge">{{ categoryName }}</KbBadge>
      <p class="benefit-name">{{ plcyNm }}</p>
      <p v-if="metaText" class="benefit-meta">{{ metaText }}</p>
    </div>

    <slot name="action" />
  </li>
</template>

<script setup>
import KbBadge from '@/components/common/KbBadge.vue';

// 관심 혜택(MYP-06)도 같은 카드를 쓴다.
// 정책명 아래 한 줄은 화면마다 달라서(신청일 / 마감일) 문구를 페이지가 만들어 넘긴다.
defineProps({
  plcyNm: String,
  categoryName: String,
  metaText: String,
});
</script>

<style scoped>
.benefit-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 12px;
}

.benefit-main {
  flex: 1;
  min-width: 0; /* 긴 정책명이 flex 아이템을 밀어내지 않게 */
  display: flex;
  flex-direction: column;
  align-items: flex-start; /* 없으면 stretch 라 배지가 가로로 늘어난다 */
  gap: 6px;
}

/* 부모가 세로 flex 라 배지가 늘어나는 것을 막는다.
     scoped 스타일은 자식 컴포넌트의 루트 요소에도 적용된다. */
.benefit-badge {
  align-self: flex-start;
}

/* plcy_nm 이 TEXT 컬럼이라 정책명이 매우 길다 */
.benefit-name {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
  color: #2e2a24;
  word-break: keep-all;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.benefit-meta {
  margin: 0;
  font-size: 12.5px;
  color: #908980;
}
</style>
