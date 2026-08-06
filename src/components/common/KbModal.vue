<template>
  <div class="modal-overlay">
    <div class="modal-card">
      <h4 class="modal-title">{{ title }}</h4>
      <slot />
      <div class="modal-actions" :class="{ two: columns === 2 }">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>

<script setup>
// 여닫는 판단은 호출부가 v-if 로 한다(기존 4곳이 전부 그 방식이라 동작이 안 바뀐다)
defineProps({
  title: { type: String, required: true },
  columns: { type: Number, default: 1 }, // 버튼 2개면 2
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
