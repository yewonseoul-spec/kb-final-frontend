// 관리자 화면 공용 알림·확인 상자.
//
// 브라우저 기본 alert / confirm 을 쓰지 않는 이유가 두 가지다.
// 하나는 화면과 생김새가 따로 놀아서 시연에서 어색하다는 것이고,
// 다른 하나는 브라우저가 이것들을 억제할 수 있다는 것이다.
// 특히 confirm 은 억제되면 아무것도 묻지 않고 그냥 지나간다.
// 관리자가 "정말 삭제할까요" 를 못 보고 삭제하게 된다.
//
// 상태를 모듈 바깥에 두는 이유는 화면마다 상자를 따로 만들지 않기 위해서다.
// AdminDialogHost 하나만 레이아웃에 올려두면 모든 관리자 화면이 같은 것을 쓴다.

import { reactive, readonly } from 'vue'

// 토스트는 여러 개가 동시에 뜰 수 있다. 저장이 끝나자마자 조회가 실패하는 식이다.
const state = reactive({
  toasts: [],
  confirm: null,
})

let seq = 0

/**
 * 잠깐 떴다 사라지는 알림.
 *
 * @param {string} message 사용자에게 보일 문장
 * @param {'info'|'success'|'error'} type 색을 정한다
 * @param {number} duration 밀리초. 0 이면 사라지지 않는다
 */
function toast(message, type = 'info', duration = 3000) {
  const id = ++seq
  state.toasts.push({ id, message, type })

  if (duration > 0) {
    setTimeout(() => dismiss(id), duration)
  }
  return id
}

function toastSuccess(message, duration = 3000) {
  return toast(message, 'success', duration)
}

function toastError(message, duration = 5000) {
  // 오류는 조금 더 오래 둔다. 읽기 전에 사라지면 무슨 일이 있었는지 모른다
  return toast(message, 'error', duration)
}

function dismiss(id) {
  const i = state.toasts.findIndex((t) => t.id === id)
  if (i >= 0) state.toasts.splice(i, 1)
}

/**
 * 예 / 아니오를 묻는다. Promise 로 답을 돌려준다.
 *
 * 사용법
 *   const ok = await confirmDialog({ message: '삭제할까요?' })
 *   if (!ok) return
 *
 * @returns {Promise<boolean>}
 */
function confirmDialog({
  title = '확인',
  message = '',
  detail = '',
  confirmText = '확인',
  cancelText = '취소',
  danger = false,
} = {}) {
  // 이미 열려 있으면 앞의 것을 취소로 닫는다.
  // 두 개가 겹치면 어느 것에 답한 것인지 알 수 없다
  if (state.confirm) {
    state.confirm.resolve(false)
    state.confirm = null
  }

  return new Promise((resolve) => {
    state.confirm = {
      title,
      message,
      detail,
      confirmText,
      cancelText,
      danger,
      resolve,
    }
  })
}

function answerConfirm(value) {
  if (!state.confirm) return
  const { resolve } = state.confirm
  state.confirm = null
  resolve(value)
}

export function useAdminDialog() {
  return {
    dialogState: readonly(state),
    toast,
    toastSuccess,
    toastError,
    dismiss,
    confirmDialog,
    answerConfirm,
  }
}