<script setup>
import { useRouter } from 'vue-router';
import KbButton from '@/components/common/KbButton.vue';

const router = useRouter();

// replace 를 쓰는 이유: push 면 뒤로가기가 방금 그 잘못된 주소로 되돌아간다
const goHome = () => router.replace({ name: 'Home' });
</script>

<template>
  <div class="not-found">
    <p class="empty-main">페이지를 찾을 수 없어요</p>
    <p class="empty-sub">
      주소가 바뀌었거나 삭제된 화면이에요.<br />
      아래 버튼으로 홈에서 다시 찾아보세요.
    </p>
    <div class="empty-action">
      <KbButton @click="goHome">홈으로 가기</KbButton>
    </div>
  </div>
</template>

<style scoped>
/* 탭바가 position:fixed 라 여백이 없으면 버튼을 덮는다 */
.not-found {
  padding: 60px 0 96px;
  text-align: center;
}

.empty-main {
  margin: 0 0 6px;
  font-size: 15px;
  font-weight: 600;
  color: #2e2a24;
}

.empty-sub {
  margin: 0;
  font-size: 13px;
  color: #908980;
  word-break: keep-all;
}

.empty-action {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>
