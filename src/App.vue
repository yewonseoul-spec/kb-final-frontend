<script setup>
import { RouterView, useRoute } from 'vue-router';
import DefaultLayout from './components/layouts/DefaultLayout.vue';
import KbTabBar from './components/common/KbTabBar.vue';

const route = useRoute();
</script>

<template>
  <DefaultLayout>
    <RouterView />
  </DefaultLayout>
  <!-- 로그인·회원가입·온보딩은 탭바를 감춘다.
         route.name 검사는 최초 진입 시 라우트가 확정되기 전 탭바가 잠깐 보였다 사라지는 것을 막는다. -->
  <KbTabBar v-if="route.name && !route.meta.hideTabBar" />
  <nav style="display: flex; justify-content: center">
    <router-link to="/guide">UI 가이드 보기</router-link>
  </nav>
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
