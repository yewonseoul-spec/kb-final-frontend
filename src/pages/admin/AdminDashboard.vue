<template>
  <div class="container py-4" style="max-width: 900px">
    <div class="border-bottom pb-3 mb-4">
      <h4 class="mb-1">관리자 대시보드</h4>
      <small class="text-muted">서비스 운영 현황과 데이터 동기화를 관리합니다.</small>
    </div>

    <!-- TODO: 통계 카드 (혜택수·회원수·마감임박·신규) -->

    <SyncPanel />

    <!-- TODO: 최근 동기화 로그 -->
  </div>
</template>

<script setup>
import SyncPanel from '@/components/admin/SyncPanel.vue';
</script>