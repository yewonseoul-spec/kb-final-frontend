<template>
  <div class="admin-shell">
    <!-- 사이드바 -->
    <aside class="admin-side">
      <div class="admin-brand">
        <span class="admin-logo">KB</span>
        <div>
          <div class="fw-bold">청년타파</div>
          <small class="text-secondary">관리자</small>
        </div>
      </div>

      <nav class="admin-nav">
        <router-link to="/admin" class="admin-nav-item" exact-active-class="is-active">
          대시보드
        </router-link>

        <router-link to="/admin/benefits" class="admin-nav-item" active-class="is-active">
          혜택 관리
        </router-link>

        <!-- 중복수혜 검수. 남은 건수를 배지로 보여준다.
             검수는 미뤄도 되는 일이라 화면에 들어오지 않으면 잊게 되고,
             그러면 확정 대기가 계속 쌓인다. -->
        <router-link to="/admin/conflict" class="admin-nav-item" active-class="is-active">
          <span>중복수혜 검수</span>
          <span v-if="reviewCount > 0" class="admin-badge">{{ reviewCount }}</span>
        </router-link>
        
        <router-link to="/admin/prompt" class="admin-nav-item" active-class="is-active">
          AI 프롬프트 관리
        </router-link>

        <router-link to="/admin/synclog" class="admin-nav-item" active-class="is-active">
          동기화 로그
        </router-link>

        <router-link to="/admin/recommendKeyword" class="admin-nav-item" active-class="is-active">
          추천검색어 설정
        </router-link>
      </nav>
      
    </aside>

    <!-- 본문 -->
    <main class="admin-main">
      <router-view />
    </main>
  </div>
</template>

<script setup>
// 관리자 화면 공통 레이아웃.
// 사용자 화면(/engine 등)과 달리 데스크톱 기준으로 만든다.
// 표를 좌우로 넓게 보는 것이 관리자 화면의 목적이기 때문이다.

import { ref, onMounted } from 'vue'
import conflictApi from '@/api/conflictApi'

const reviewCount = ref(0)

// 배지 조회가 실패해도 사이드바는 그대로 떠야 한다.
// 이 숫자 때문에 관리자 화면 전체가 안 열리면 손해가 더 크다.
onMounted(async () => {
  try {
    const queue = await conflictApi.getQueue()
    reviewCount.value = Array.isArray(queue) ? queue.length : 0
  } catch (e) {
    reviewCount.value = 0
  }
})
</script>

<style scoped>
.admin-shell {
  display: flex;
  min-height: 100vh;
  background: #f5f5f5;
}

/* ---- 사이드바 ---- */
.admin-side {
  width: 220px;
  flex-shrink: 0;
  background: #2a201a;
  color: #e8e2dc;
  display: flex;
  flex-direction: column;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 18px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.admin-logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: #ffcc00;
  color: #2a201a;
  font-weight: 700;
  font-size: 14px;
}

.admin-nav {
  padding: 12px 10px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 14px;
  border-radius: 8px;
  color: #cfc7c0;
  text-decoration: none;
  font-size: 0.95rem;
  border-left: 3px solid transparent;
}

.admin-nav-item:hover {
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

.admin-nav-item.is-active {
  background: rgba(255, 204, 0, 0.12);
  border-left-color: #ffcc00;
  color: #ffcc00;
  font-weight: 600;
}

.admin-nav-item.is-disabled {
  color: #7a706a;
  cursor: default;
}

.admin-nav-item.is-disabled:hover {
  background: none;
  color: #7a706a;
}

.admin-badge {
  flex-shrink: 0;
  min-width: 20px;
  padding: 1px 6px;
  border-radius: 10px;
  background: #ffcc00;
  color: #2a201a;
  font-size: 11px;
  font-weight: 700;
  text-align: center;
  line-height: 1.5;
}

/* ---- 본문 ---- */
.admin-main {
  flex: 1;
  min-width: 0;      /* 표가 넘칠 때 사이드바를 밀지 않게 한다 */
  padding: 28px 32px;
}

/* 좁은 화면에서는 사이드바를 위로 접는다 */
@media (max-width: 768px) {
  .admin-shell {
    flex-direction: column;
  }
  .admin-side {
    width: 100%;
  }
  .admin-nav {
    flex-direction: row;
    overflow-x: auto;
  }
  .admin-nav-item {
    white-space: nowrap;
  }
  .admin-main {
    padding: 20px 16px;
  }
}
</style>