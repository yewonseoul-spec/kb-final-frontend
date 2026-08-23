// 사이드바 검수 배지 숫자.
//
// 원래는 AdminLayout 이 onMounted 에서 한 번만 조회했다.
// 그래서 검수 화면에서 판정을 해도 사이드바 숫자가 그대로 남았고,
// 관리자는 아직 할 일이 남은 줄 알았다.
//
// 상태를 모듈 바깥에 두면 어느 화면에서든 같은 값을 읽고 고칠 수 있다.
// 판정한 화면이 refresh() 를 부르면 사이드바가 따라 바뀐다.

import { ref, readonly } from 'vue'
import conflictApi from '@/api/conflictApi'

const reviewCount = ref(0)

/**
 * 검수 대기 건수를 다시 센다.
 *
 * 실패해도 화면을 막지 않는다. 이 숫자 하나 때문에
 * 관리자 화면 전체가 안 열리면 손해가 더 크다.
 */
async function refresh() {
  try {
    const queue = await conflictApi.getQueue()
    reviewCount.value = Array.isArray(queue) ? queue.length : 0
  } catch (e) {
    reviewCount.value = 0
  }
}

export function useAdminBadge() {
  return {
    reviewCount: readonly(reviewCount),
    refresh,
  }
}