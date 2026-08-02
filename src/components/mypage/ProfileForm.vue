<script setup>
import KbInput from '@/components/common/KbInput.vue';
import ProfileSelect from './ProfileSelect.vue';

defineProps({
  profile: { type: Object, required: true },
  // { birthDate: '메시지' } 형태. 검증은 페이지가 하고 이 컴포넌트는 표시만 한다.
  errors: { type: Object, default: () => ({}) },
});
// 공통코드 조회 API 가 아직 없어 시드(data_0_code.sql)의 실제 코드값을 상수로 둔다.
// common_code 테이블 정본과 값이 같으므로 저장·조회가 정상 동작한다.
// '제한없음'(0011009/0013010/0049010/0055003)은 혜택의 조건값일 뿐 사람의 상태가 아니어서
// member_profile 의 CHECK 제약이 거부한다 → 목록에서 제외했다.
// API 가 나오면 아래 상수 4개를 commonApi 호출로 교체할 것.
const EMPLOY_STATUS_OPTIONS = [
  { value: '0013001', label: '재직자' },
  { value: '0013002', label: '자영업자' },
  { value: '0013003', label: '미취업자' },
  { value: '0013004', label: '프리랜서' },
  { value: '0013005', label: '일용근로자' },
  { value: '0013006', label: '(예비)창업자' },
  { value: '0013007', label: '단기근로자' },
  { value: '0013008', label: '영농종사자' },
  { value: '0013009', label: '기타' },
];

const MAJOR_OPTIONS = [
  { value: '0011001', label: '인문계열' },
  { value: '0011002', label: '사회계열' },
  { value: '0011003', label: '상경계열' },
  { value: '0011004', label: '이학계열' },
  { value: '0011005', label: '공학계열' },
  { value: '0011006', label: '예체능계열' },
  { value: '0011007', label: '농산업계열' },
  { value: '0011008', label: '기타' },
];

const EDUCATION_OPTIONS = [
  { value: '0049001', label: '고졸 미만' },
  { value: '0049002', label: '고교 재학' },
  { value: '0049003', label: '고졸 예정' },
  { value: '0049004', label: '고교 졸업' },
  { value: '0049005', label: '대학 재학' },
  { value: '0049006', label: '대졸 예정' },
  { value: '0049007', label: '대학 졸업' },
  { value: '0049008', label: '석·박사' },
  { value: '0049009', label: '기타' },
];

const MARITAL_OPTIONS = [
  { value: '0055002', label: '미혼' },
  { value: '0055001', label: '기혼' },
];
</script>

<template>
  <div class="profile-form">
    <!-- 거주지역(2단 셀렉트)은 지역 조회 API 가 나온 뒤 별도 커밋에서 이 자리에 넣는다 -->
    <KbInput
      v-model="profile.birthDate"
      type="date"
      label="생년월일"
      :is-error="!!errors.birthDate"
      :error-message="errors.birthDate"
    />

    <KbInput
      v-model="profile.income"
      type="number"
      label="연 소득(원)"
      placeholder="예) 30000000"
      :is-error="!!errors.income"
      :error-message="errors.income"
    />

    <ProfileSelect
      v-model="profile.employStatus"
      label="취업상태"
      :options="EMPLOY_STATUS_OPTIONS"
    />

    <ProfileSelect
      v-model="profile.major"
      label="전공"
      :options="MAJOR_OPTIONS"
    />

    <KbInput
      v-model="profile.householdSize"
      type="number"
      label="가구원 수"
      placeholder="본인 포함"
      :is-error="!!errors.householdSize"
      :error-message="errors.householdSize"
    />

    <ProfileSelect
      v-model="profile.education"
      label="학력"
      :options="EDUCATION_OPTIONS"
    />

    <ProfileSelect
      v-model="profile.mrgSttsCd"
      label="혼인 여부"
      :options="MARITAL_OPTIONS"
    />
  </div>
</template>

<style scoped>
.profile-form {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px 12px;
}
</style>
