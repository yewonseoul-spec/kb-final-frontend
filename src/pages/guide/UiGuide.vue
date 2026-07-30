<template>
  <div style="padding: 20px; display: flex; flex-direction: column; gap: 20px">
    <h2>1. Button</h2>
    <div style="display: flex; gap: 10px">
      <KbButton type="primary">Primary</KbButton>
      <KbButton type="secondary">Secondary</KbButton>
      <KbButton type="danger">삭제</KbButton>
      <KbButton type="primary" size="small">Small</KbButton>
      <KbButton :disabled="true">Disabled </KbButton>
    </div>

    <h2>2. Input</h2>
    <KbInput
      placeholder="아이디를 입력하세요"
      hint-message="사용할 수 있는 아이디예요"
    />
    <KbInput
      type="password"
      placeholder="비밀번호"
      :is-error="true"
      error-message="비밀번호가 일치하지 않아요"
    />

    <h2>3. Card, Badge</h2>
    <KbCard
      :selected="true"
      title="청년월세지원요"
      description="월세 거주 청년의 주거비 부담 완화ㅇ"
      :badges="[
        { text: '청년', variant: 'danger' },
        { text: '청년2', variant: 'info' },
        { text: '청년3', variant: 'gray' },
        { text: '주거', variant: 'default' },
      ]"
    />

    <h2>4. Control</h2>
    <div style="display: flex; gap: 24px; align-items: center">
      <KbCheckbox v-model="isChecked1">이용약관 동의</KbCheckbox>
      <KbCheckbox v-model="isChecked2">알림 수신 동의</KbCheckbox>
    </div>

    <div style="margin-top: 10px">
      <h2>5. SegementTab</h2>
      <KbSegmentTab :tabs="tabList" v-model="currentTab" />
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import KbButton from '@/components/common/KbButton.vue';
import KbInput from '@/components/common/KbInput.vue';
import KbBadge from '@/components/common/KbBadge.vue';
import KbCard from '@/components/common/KbCard.vue';
import KbCheckbox from '@/components/common/KbCheckbox.vue';
import KbSegmentTab from '@/components/common/KbSegmentTab.vue';

const text = ref('');

const isChecked1 = ref(true);
const isChecked2 = ref(false);

const currentTab = ref('id');
const tabList = [
  { label: '아이디 조회', value: 'id' },
  { label: '암호 설정', value: 'pw' },
];
</script>
