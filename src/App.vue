<script setup>
import { RouterView, useRoute } from 'vue-router';
import DefaultLayout from './components/layouts/DefaultLayout.vue';
import KbTabBar from './components/common/KbTabBar.vue';
import KbMenuDrawer from './components/common/KbMenuDrawer.vue';

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
    <KbMenuDrawer />
  </nav>
</template>

<style scoped></style>
