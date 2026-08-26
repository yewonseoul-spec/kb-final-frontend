<template>
  <div class="modal-overlay">
    <div class="modal-card" :class="{ wide }">
      <h4 class="modal-title">{{ title }}</h4>
      <slot />
      <div class="modal-actions" :class="{ two: columns === 2 }">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: { type: String, required: true },
  columns: { type: Number, default: 1 }, // 버튼 2개면 2
  wide: { type: Boolean, default: false }, // 약관 전문처럼 읽히는 본문이 들어올 때
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.modal-card {
  width: 90%;
  max-width: 300px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

/* 기본 모달은 짧은 확인 문구라 좁고 가운데 정렬이지만,
     읽히는 본문은 폭이 넓고 왼쪽 정렬이어야 한다 */
.modal-card.wide {
  max-width: 420px;
  align-items: stretch;
  text-align: left;
}

.modal-title {
  margin: 0 0 8px;
  font-size: 18px;
  font-weight: 700;
  color: #2e2a24;
}

/* 본문은 슬롯으로 들어오므로 :slotted 로 잡는다.
     슬롯 내용은 부모 스코프라 그냥 .modal-desc 로는 안 걸린다 */
.modal-card :slotted(.modal-desc) {
  margin: 0 0 24px;
  font-size: 14px;
  line-height: 1.6;
  color: #908980;
  word-break: keep-all; /* 한글을 음절이 아니라 어절 단위로 끊는다 */
}

.modal-card :slotted(.modal-error) {
  margin: 0 0 12px;
  font-size: 13px;
  color: #d64545;
}

/* KbButton 이 inline-flex 라 grid 아이템으로 두어 폭을 채운다 */
.modal-actions {
  display: grid;
  width: 100%;
  gap: 10px;
}

.modal-actions.two {
  grid-template-columns: 1fr 1fr;
}
</style>
