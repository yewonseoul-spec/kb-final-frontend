<template>
  <div class="admin-shell a-body">
    <!-- 사이드바 -->
    <aside class="admin-side">
      <div class="admin-brand">
        <span class="admin-brand-name">청년타파</span>
        <span class="admin-brand-tag">ADMIN</span>
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
          <span v-if="reviewCount > 0" class="admin-badge a-num">{{ reviewCount }}</span>
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

      <!-- 아래쪽에 붙인다. 메뉴와 섞이면 실수로 누르게 된다 -->
      <div class="admin-foot">
        <div v-if="auth.isLogin" class="admin-user">
          <div class="admin-user-name">{{ auth.realName || auth.loginId }}</div>
          <div class="admin-user-role">관리자</div>
        </div>

        <button type="button" class="admin-logout" @click="onLogout">로그아웃</button>
      </div>
    </aside>

    <!-- 본문 -->
    <main class="admin-main">
      <div class="admin-page">
        <router-view />
      </div>
    </main>

    <!-- 관리자 화면 공용 알림·확인 상자.
         화면마다 두면 화면을 옮기는 순간 상자도 같이 사라진다.
         레이아웃에 한 번만 올린다. -->
    <AdminDialogHost />
  </div>
</template>

<script setup>
// 관리자 화면 공통 레이아웃.
// 사용자 화면(/engine 등)과 달리 데스크톱 기준으로 만든다.
// 표를 좌우로 넓게 보는 것이 관리자 화면의 목적이기 때문이다.
//
// App.vue 가 hideAppShell 로 DefaultLayout 을 건너뛰므로
// 사용자용 헤더(뒤로가기·알림·햄버거)가 얹히지 않는다.
// 그 헤더 안에 로그아웃이 있었으므로 여기에 로그아웃을 둔다.

import { watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

import { useAuthStore } from '@/stores/auth'
import authApi from '@/api/authApi'
import { useAdminBadge } from '@/composables/useAdminBadge'
import { useAdminDialog } from '@/composables/useAdminDialog'
import AdminDialogHost from '@/components/admin/AdminDialogHost.vue'

/*
 * 관리자 공통 스타일.
 *
 * main.js 가 아니라 여기서 불러온다.
 * 관리자 화면은 이 레이아웃을 반드시 거치므로 여기서 한 번 부르면 충분하고,
 * 사용자 화면(/engine 등)에는 이 색·글꼴이 섞이지 않는다.
 *
 * 화면 컴포넌트(.vue)의 scoped style 에서는 색을 직접 쓰지 않는다.
 * scoped 안에 :root 를 두면 [data-v-...] 가 붙어 변수가 먹지 않는다.
 */
import '@/assets/admin.css'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const { reviewCount, refresh } = useAdminBadge()
const { confirmDialog } = useAdminDialog()

/*
 * 배지를 화면 이동마다 다시 센다.
 *
 * 예전에는 onMounted 에서 한 번만 셌다. 그래서 검수 화면에서 판정을 해도
 * 사이드바 숫자가 그대로 남아, 관리자는 아직 할 일이 있는 줄 알았다.
 *
 * 판정 직후 갱신은 검수 화면이 useAdminBadge().refresh() 를 직접 부른다.
 * 여기 watch 는 다른 화면을 거쳐 돌아왔을 때를 위한 것이다.
 */
watch(() => route.fullPath, () => refresh(), { immediate: true })

/*
 * 로그아웃 절차는 KbMenuDrawer 와 같게 맞춘다.
 * 서버 호출이 실패해도(토큰 만료 등) 로컬 정리는 그대로 진행한다.
 * 여기서 멈추면 화면에는 로그인 상태로 남아 더 헷갈린다.
 */
const onLogout = async () => {
  const ok = await confirmDialog({
    title: '로그아웃',
    message: '정말 로그아웃 하시겠습니까?',
    confirmText: '로그아웃',
  })
  if (!ok) return

  try {
    await authApi.logout()
  } catch (e) {
    // 서버 정리는 실패해도 로컬은 비운다
  }

  auth.logout()
  router.push({ name: 'Login' })
}
</script>

<style scoped>
.admin-shell {
  display: flex;
  width: 100%;
  max-width: 1380px;
  min-height: 100vh;
  margin: 0 auto;
  background: var(--a-c50);
}

/* ---- 사이드바 ----
   갈색기 있는 회색(#2a201a 계열)은 쓰지 않는다.
   문서처럼 보여서 도구답지 않다. 차가운 슬레이트로 간다. */
.admin-side {
  width: 216px;
  flex-shrink: 0;
  background: var(--a-nav-bg);
  color: var(--a-nav-text);
  display: flex;
  flex-direction: column;
}

.admin-brand {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 18px 16px 14px;
  border-bottom: 1px solid var(--a-nav-line);
}

.admin-brand-name {
  color: #fff;
  font-size: var(--a-t-lg);
  letter-spacing: var(--a-ls-lg);
  font-weight: 700;
}

/* 노랑을 쓰는 자리 하나. 여기가 어떤 화면인지 알려주는 표시다 */
.admin-brand-tag {
  font-size: 10px;
  color: var(--a-kb);
  border: 1px solid var(--a-kb-dim);
  border-radius: 3px;
  padding: 1px 5px;
  letter-spacing: 0.06em;
  font-weight: 600;
}

.admin-nav {
  padding: 10px 8px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.admin-nav-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  height: 34px;
  padding: 0 10px;
  border-radius: var(--a-r);
  color: var(--a-nav-text);
  text-decoration: none;
  font-size: var(--a-t-md);
  letter-spacing: var(--a-ls-md);
  font-weight: 500;
  border-left: 2px solid transparent;
}

.admin-nav-item:hover {
  background: var(--a-nav-hover);
  color: #e2e8f0;
}

/*
 * 활성 메뉴.
 *
 * 예전에는 배경도 노랑, 글씨도 노랑이었다.
 * 노랑 위에 노랑이라 대비가 낮아 오히려 잘 안 읽혔고,
 * 노랑이 「선택됨」과 「할 일 있음」 두 뜻을 갖게 됐다.
 *
 * 선택은 배경과 흰 글씨로 알리고,
 * 노랑은 왼쪽 막대 하나로 줄인다.
 */
.admin-nav-item.is-active {
  background: var(--a-nav-hover);
  border-left-color: var(--a-kb);
  color: var(--a-nav-on);
  font-weight: 600;
}

/* 노랑을 쓰는 또 하나의 자리. 뜻은 「손대야 할 일이 남았다」로 같다 */
.admin-badge {
  flex-shrink: 0;
  min-width: 19px;
  padding: 0 6px;
  border-radius: 9px;
  background: var(--a-kb);
  color: var(--a-nav-bg);
  font-size: var(--a-t-cap);
  font-weight: 700;
  text-align: center;
  line-height: 1.7;
}

/* ---- 사이드바 하단 ---- */
.admin-foot {
  /* 메뉴가 짧아도 로그아웃은 항상 아래에 붙어 있게 한다 */
  margin-top: auto;
  padding: 12px 12px 16px;
  border-top: 1px solid var(--a-nav-line);
}

.admin-user {
  margin-bottom: 10px;
  line-height: 1.4;
}

.admin-user-name {
  font-size: var(--a-t-sm);
  font-weight: 600;
  color: #cbd5e1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.admin-user-role {
  font-size: var(--a-t-cap);
  color: #6b7280;
}

.admin-logout {
  width: 100%;
  height: var(--a-h-ctl);
  border: 1px solid var(--a-nav-line);
  border-radius: var(--a-r);
  background: transparent;
  color: #8b95a5;
  font-family: var(--a-font);
  font-size: var(--a-t-sm);
  cursor: pointer;
}

.admin-logout:hover {
  background: var(--a-nav-hover);
  color: #e2e8f0;
  border-color: #3a4150;
}

/* ---- 본문 ---- */
.admin-main {
  flex: 1;
  min-width: 0;      /* 표가 넘칠 때 사이드바를 밀지 않게 한다 */
  padding: 24px 28px 48px;
}

/*
 * 본문 폭을 여기서 한 번만 정한다.
 *
 * 예전에는 화면마다 max-width 를 따로 갖고 있어서
 * 메뉴를 옮길 때마다 본문 폭이 튀었다.
 * 그리고 1080px 은 관리자 표에 좁다. 좌우 비교나 열이 많은 표가
 * 계속 줄바꿈된다.
 *
 * 다만 상한은 둔다. 초대형 모니터에서 끝까지 늘리면
 * 좌우 카드가 가로로 늘어져 오히려 읽기 어렵다.
 *
 * ★ 각 화면 컴포넌트에서는 max-width 를 두지 않는다.
 */
.admin-page {
  width: 100%;
  max-width: 1600px;
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
    border-left: 0;
    border-bottom: 2px solid transparent;
  }
  .admin-nav-item.is-active {
    border-left-color: transparent;
    border-bottom-color: var(--a-kb);
  }
  .admin-foot {
    /* 세로로 접히면 아래에 붙일 자리가 없다. 메뉴 옆으로 뺀다 */
    margin-top: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 16px 14px;
  }
  .admin-user {
    margin-bottom: 0;
  }
  .admin-logout {
    width: auto;
    padding: 0 16px;
  }
  .admin-main {
    padding: 20px 16px 40px;
  }
}
</style>
