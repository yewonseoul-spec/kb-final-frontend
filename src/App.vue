<script setup>
import { computed } from 'vue';
import { RouterView, useRoute } from 'vue-router';
import DefaultLayout from './components/layouts/DefaultLayout.vue';
import KbTabBar from './components/common/KbTabBar.vue';

const route = useRoute();

/*
 * 관리자 화면은 자기 껍데기(AdminLayout)를 갖고 있다.
 * 여기서 DefaultLayout 까지 씌우면 사용자용 헤더(뒤로가기·알림·햄버거)가
 * 관리자 사이드바 위에 얹혀서 두 벌이 된다.
 * 그래서 hideAppShell 인 화면은 RouterView 만 그린다.
 *
 * 로그아웃은 원래 햄버거 안에 있었으므로,
 * 이 헤더를 걷어내는 것과 AdminLayout 에 로그아웃을 두는 것은 한 쌍이다.
 */
const hideAppShell = computed(() => route.meta.hideAppShell === true);
</script>

<template>
  <RouterView v-if="hideAppShell" />

  <DefaultLayout v-else>
    <RouterView />
  </DefaultLayout>

  <!-- 로그인·회원가입·온보딩은 탭바를 감춘다.
       route.name 검사는 최초 진입 시 라우트가 확정되기 전 탭바가 잠깐 보였다 사라지는 것을 막는다. -->
  <KbTabBar v-if="route.name && !route.meta.hideTabBar" />
</template>

<style>
/* 탭바가 position:fixed; width:100% 인데
   fixed 의 100% 는 스크롤바를 뺀 뷰포트 폭이다.
   스크롤이 생기는 페이지에서만 15px 좁아져 왼쪽으로 밀리므로
   루트 스크롤바를 숨겨 어느 페이지에서나 폭 기준을 같게 만든다. */
html {
  scrollbar-width: none;
}

html::-webkit-scrollbar {
  display: none;
}
</style>