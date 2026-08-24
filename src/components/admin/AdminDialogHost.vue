<template>
  <!-- 확인 상자. 한 번에 하나만 뜬다 -->
  <Teleport to="body">
    <div v-if="dialogState.confirm" class="dlg-backdrop" @click.self="onCancel">
      <div class="dlg-box" role="dialog" aria-modal="true">
        <div class="dlg-head">
          <h3 class="dlg-title">{{ dialogState.confirm.title }}</h3>
          <p v-if="dialogState.confirm.message" class="dlg-message">
            {{ dialogState.confirm.message }}
          </p>
        </div>

        <!--
          무슨 일이 벌어지는지 적는 자리.
          "정말 하시겠습니까"만 있는 확인창은 아무도 안 읽고 확인을 누른다.
        -->
        <div v-if="dialogState.confirm.detail" class="dlg-body">
          <div class="dlg-detail">{{ dialogState.confirm.detail }}</div>
        </div>

        <div class="dlg-actions">
          <button type="button" class="dlg-btn dlg-btn-ghost" @click="onCancel">
            {{ dialogState.confirm.cancelText }}
            <span class="dlg-kbd">Esc</span>
          </button>
          <button
            type="button"
            class="dlg-btn"
            :class="dialogState.confirm.danger ? 'dlg-btn-danger' : 'dlg-btn-primary'"
            @click="onConfirm"
          >
            {{ dialogState.confirm.confirmText }}
            <span class="dlg-kbd">Enter</span>
          </button>
        </div>
      </div>
    </div>
  </Teleport>

  <!-- 토스트. 여러 개가 쌓인다 -->
  <Teleport to="body">
    <div class="toast-stack">
      <div
        v-for="t in dialogState.toasts"
        :key="t.id"
        class="toast"
        :class="`toast-${t.type}`"
        @click="dismiss(t.id)"
      >
        {{ t.message }}
      </div>
    </div>
  </Teleport>
</template>

<script setup>
// 관리자 레이아웃에 한 번만 올려두는 상자.
// 화면마다 따로 두지 않는 이유는, 화면을 옮기는 순간
// 그 화면이 사라지면서 상자도 같이 사라지기 때문이다.
//
// 이 컴포넌트는 AdminLayout 에만 올라가므로 관리자 전용이다.
// 사용자 화면(/engine 등)에는 뜨지 않는다.

import { onMounted, onBeforeUnmount } from 'vue'
import { useAdminDialog } from '@/composables/useAdminDialog'

const { dialogState, dismiss, answerConfirm } = useAdminDialog()

const onConfirm = () => answerConfirm(true)
const onCancel = () => answerConfirm(false)

/*
 * Esc 로 닫는 것은 취소로 본다.
 * 브라우저 기본 confirm 도 그렇게 동작하므로 같은 감각을 유지한다.
 *
 * Enter 는 확인으로 본다. 검수 화면처럼 같은 판단을 여러 건 반복하는
 * 자리에서는 클릭 하나가 그대로 작업 시간이 된다.
 */
const onKeydown = (e) => {
  if (!dialogState.confirm) return
  if (e.key === 'Escape') onCancel()
  if (e.key === 'Enter') {
    e.preventDefault()
    onConfirm()
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))
</script>

<style scoped>
/* ============================================================
   확인 상자

   예전에는 확인 버튼이 노랑(#ffcc00)이었다.
   노랑은 「지금 관리자가 손대야 할 곳」 하나로 쓰기로 했는데,
   확인창은 이미 화면을 덮고 눈앞에 떠 있어서 강조가 필요 없다.
   기본은 검정, 되돌릴 수 없는 동작만 빨강으로 간다.
   ============================================================ */
.dlg-backdrop {
  position: fixed;
  inset: 0;
  z-index: 3000;          /* 드로어(2000) 위 */
  background: rgba(15, 23, 42, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
}

.dlg-box {
  width: 100%;
  max-width: 440px;
  background: var(--a-c0);
  border-radius: var(--a-r-lg);
  overflow: hidden;
}

.dlg-head { padding: 20px 20px 0; }

.dlg-title {
  margin: 0;
  font-size: 17px;
  letter-spacing: -0.02em;
  font-weight: 700;
  color: var(--a-c900);
}

.dlg-message {
  margin: 8px 0 0;
  font-size: var(--a-t-md);
  line-height: 1.6;
  color: var(--a-c700);
  white-space: pre-line;   /* 줄바꿈을 그대로 살린다 */
}

.dlg-body { padding: 16px 20px 0; }

/* 무슨 일이 벌어지는지. 왼쪽 막대로 본문과 구분한다 */
.dlg-detail {
  background: var(--a-c50);
  border: var(--a-bd);
  border-left: 2px solid var(--a-c900);
  border-radius: 0 var(--a-r) var(--a-r) 0;
  padding: 12px 14px;
  font-size: var(--a-t-sm);
  line-height: 1.7;
  color: var(--a-c600);
  white-space: pre-line;
}

.dlg-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 18px 20px 20px;
}

/* 두 버튼의 폭을 맞춘다.
   「취소」 두 글자와 「비활성화」 다섯 글자가 다른 폭이면 줄이 흔들린다 */
.dlg-btn {
  min-width: 100px;
  height: var(--a-h);
  padding: 0 16px;
  border: var(--a-bd-ctl);
  border-radius: var(--a-r);
  background: var(--a-c0);
  color: var(--a-c700);
  font-family: var(--a-font);
  font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md);
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  white-space: nowrap;
}

.dlg-btn-ghost:hover {
  background: var(--a-c50);
  border-color: var(--a-c400);
}

.dlg-btn-primary {
  background: var(--a-c900);
  border-color: var(--a-c900);
  color: #fff;
  font-weight: 600;
}

.dlg-btn-primary:hover { background: var(--a-c800); border-color: var(--a-c800); }

/* 되돌릴 수 없는 동작에만 빨강 */
.dlg-btn-danger {
  background: var(--a-dngr);
  border-color: var(--a-dngr);
  color: #fff;
  font-weight: 600;
}

.dlg-btn-danger:hover { background: #991b1b; border-color: #991b1b; }

/* 키보드로 처리할 수 있다는 표시. 여러 건을 연속으로 볼 때 클릭이 곧 시간이다 */
.dlg-kbd {
  display: inline-flex;
  align-items: center;
  height: 18px;
  padding: 0 5px;
  border: 1px solid var(--a-c300);
  border-bottom-width: 2px;
  border-radius: 4px;
  font-size: 10px;
  color: var(--a-c400);
  background: var(--a-c0);
}

.dlg-btn-primary .dlg-kbd,
.dlg-btn-danger .dlg-kbd {
  border-color: rgba(255, 255, 255, 0.35);
  color: rgba(255, 255, 255, 0.7);
  background: transparent;
}

.dlg-btn:focus-visible {
  outline: 2px solid var(--a-c900);
  outline-offset: 2px;
}

/* ============================================================
   토스트
   ============================================================ */
.toast-stack {
  position: fixed;
  right: 20px;
  bottom: 20px;
  z-index: 3100;          /* 확인 상자보다 위. 확인 후 결과를 바로 보여준다 */
  display: flex;
  flex-direction: column;
  gap: 8px;
  pointer-events: none;   /* 빈 영역이 화면을 가로막지 않게 한다 */
}

.toast {
  pointer-events: auto;   /* 눌러서 바로 지울 수 있다 */
  min-width: 300px;
  max-width: 420px;
  padding: 13px 15px;
  border: 1px solid transparent;
  border-radius: var(--a-r);
  font-size: var(--a-t-md);
  line-height: 1.55;
  cursor: pointer;
  white-space: pre-line;
}

/* 알림은 어두운 바탕 하나로 통일하고,
   성공·실패는 왼쪽 막대 색으로 구분한다.
   상자 전체를 초록·빨강으로 칠하면 화면 한쪽이 통째로 물든다 */
.toast-info {
  background: var(--a-c900);
  color: #fff;
}

.toast-success {
  background: var(--a-c900);
  color: #fff;
  box-shadow: inset 3px 0 0 #4ade80;
}

.toast-error {
  background: var(--a-c900);
  color: #fff;
  box-shadow: inset 3px 0 0 #f87171;
}

@media (max-width: 768px) {
  .toast-stack {
    right: 12px;
    left: 12px;
    bottom: 12px;
  }
  .toast {
    min-width: 0;
    max-width: none;
  }
}
</style>