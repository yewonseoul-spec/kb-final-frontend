<template>
  <div class="container py-4" style="max-width: 760px">

    <div class="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4">
      <div>
        <h4 class="mb-1">정책 데이터 동기화</h4>
        <small class="text-muted">온통청년 API에서 청년정책을 가져와 DB에 반영합니다.</small>
      </div>
      <button class="btn btn-primary" :disabled="loading" @click="executeSync">
        <span v-if="loading" class="spinner-border spinner-border-sm me-1"></span>
        {{ loading ? '동기화 중…' : '동기화 실행' }}
      </button>
    </div>

    <!-- 동기화 범위 -->
    <div class="card mb-3">
      <div class="card-body">
        <h6 class="card-title mb-3">동기화 범위</h6>
        <div class="row g-3">
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">시작 페이지</label>
            <input v-model.number="pageNum" type="number" min="1"
                   class="form-control" style="width:140px" :disabled="loading" />
          </div>
          <div class="col-auto">
            <label class="form-label small text-muted mb-1">페이지당 건수</label>
            <input v-model.number="pageSize" type="number" min="1" max="100"
                   class="form-control" style="width:140px" :disabled="loading" />
          </div>
        </div>
        <small class="text-muted d-block mt-3">
          온통청년 API에 등록일 기준 조회 파라미터가 아직 연결되지 않아
          페이지 범위로 대상을 지정합니다.
        </small>
      </div>
    </div>

    <!-- 실행 결과 -->
    <div v-if="result" class="card mb-3">
      <div class="card-body">
        <h6 class="card-title mb-3">
          실행 결과
          <span class="badge ms-2"
                :class="result.resultStatus === 'S' ? 'bg-success' : 'bg-danger'">
            {{ result.resultStatus === 'S' ? '성공' : '실패' }}
          </span>
        </h6>

        <table class="table table-sm mb-0">
          <tbody>
            <tr><th class="text-muted fw-normal" style="width:150px">처리 건수</th>
                <td>{{ result.totalCnt }}건</td></tr>
            <tr><th class="text-muted fw-normal">신규 추정</th>
                <td>{{ result.insertCnt }}건</td></tr>
            <tr><th class="text-muted fw-normal">기존 처리 추정</th>
                <td>{{ result.updateCnt }}건</td></tr>
            <tr><th class="text-muted fw-normal">소요 시간</th>
                <td>{{ (result.durationMs / 1000).toFixed(1) }}초</td></tr>
          </tbody>
        </table>

        <small class="text-muted d-block mt-2">
          신규·기존 건수는 동기화 전후 전체 정책 수의 차이로 계산한 추정치입니다.
        </small>

        <div v-if="result.errorMsg" class="alert alert-danger mt-3 mb-0 py-2 small">
          {{ result.errorMsg }}
        </div>
      </div>
    </div>

    <div v-if="requestError" class="alert alert-danger py-2 small">
      {{ requestError }}
    </div>

  </div>
</template>

<script setup>
import { ref } from 'vue';
import axios from 'axios';

const pageNum = ref(1);
const pageSize = ref(10);
const loading = ref(false);
const result = ref(null);
const requestError = ref('');

// TODO: 로그인 관리자 member_no로 교체 (현재는 테스트값)
const memberNo = 1;

async function executeSync() {
  loading.value = true;
  requestError.value = '';
  result.value = null;

  try {
    const { data } = await axios.post('/api/admin/sync', null, {
      params: { pageNum: pageNum.value, pageSize: pageSize.value, memberNo },
    });
    result.value = data;
  } catch (e) {
    requestError.value = '동기화 요청에 실패했습니다. 서버 상태를 확인해 주세요.';
    console.error(e);
  } finally {
    loading.value = false;
  }
}
</script>