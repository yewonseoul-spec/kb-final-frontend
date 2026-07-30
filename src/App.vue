<script setup>
import { RouterView } from 'vue-router';
import DefaultLayout from './components/layouts/DefaultLayout.vue';
import KbTabBar from './components/common/KbTabBar.vue';
</script>

<template>
  <DefaultLayout>
    <RouterView />
  </DefaultLayout>
  <KbTabBar />
  <nav style="display: flex; justify-content: center">
    <router-link to="/guide">UI 가이드 보기</router-link>
  </nav>
</template>

<style scoped></style>
