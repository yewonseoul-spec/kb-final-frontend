<script setup>
import { ref, watch } from 'vue';
import ProfileSelect from './ProfileSelect.vue';
import { getRegions } from '@/api/regionApi';

const props = defineProps({
  modelValue: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

// API 가 parentRegionCode + hasChildren 로 단계를 알려주므로 로직은 깊이를 모른다.
// 화면 문구만 순서대로 쓴다.
const PLACEHOLDERS = ['시·도 선택', '시·군·구 선택', '구 선택'];

// 저장된 코드에서 상위를 되짚는 API 가 없어, 법정동코드 자릿수로 후보를 좁힌다.
// (시·도 앞 2자리, 시·군·구 앞 4자리)
const PREFIX_LENGTHS = [2, 4];

// 한 단계 = { selected, options }. 상위를 고르면 하위가 push 된다.
const levels = ref([]);
const loadError = ref('');
let requestId = 0;

// API 는 전체 지역명('경기도 수원시 장안구')을 준다.
// 하위 셀렉트에 그대로 쓰면 상위가 반복되므로 접두사를 떼되,
// 이름 규칙이 어긋나면 원문을 쓴다.
const toOptions = (regions, parentFullName = '') =>
  regions.map((region) => ({
    value: region.zipCd,
    label:
      parentFullName && region.regionName.startsWith(parentFullName)
        ? region.regionName.slice(parentFullName.length).trim()
        : region.regionName,
    fullName: region.regionName,
    hasChildren: region.hasChildren,
  }));

// 자식 단계를 만들어 돌려준다. 자식이 없으면 null. 붙이는 건 호출부 몫.
const buildChildLevel = async (option) => {
  if (!option?.hasChildren) return null;
  return {
    selected: '',
    options: toOptions(await getRegions(option.value), option.fullName),
  };
};

const reset = () => {
  levels.value.splice(1);
  if (levels.value[0]) levels.value[0].selected = '';
};

const onChange = async (index, value) => {
  const current = ++requestId;

  const level = levels.value[index];
  level.selected = value;
  levels.value.splice(index + 1);
  loadError.value = '';

  const selected = levels.value.map((l) => l.selected).filter(Boolean);
  emit('update:modelValue', selected[selected.length - 1] ?? '');

  if (!value) return;

  try {
    const child = await buildChildLevel(
      level.options.find((o) => o.value === value),
    );
    if (current !== requestId) return;
    if (child) levels.value.push(child);
  } catch (e) {
    if (current !== requestId) return;
    loadError.value = '하위 지역을 불러오지 못했어요. 다시 선택해 주세요.';
  }
};

// 매 단계 실제 응답에 그 코드가 있는지 확인하므로,
// 자릿수 가정이 틀리면 엉뚱한 지역이 아니라 실패(false)로 떨어진다.
const restore = async (code) => {
  for (let i = 0; ; i += 1) {
    const level = levels.value[i];
    const prefix = PREFIX_LENGTHS[i];
    const option =
      level.options.find((o) => o.value === code) ??
      (prefix
        ? level.options.find(
            (o) => o.value.slice(0, prefix) === code.slice(0, prefix),
          )
        : undefined);

    if (!option) return false;
    level.selected = option.value;

    // 목표에 도달했더라도 하위 목록은 열어둬야 한다.
    // (시·도만 저장된 프로필로 돌아왔을 때 시·군·구 칸이 안 뜨던 원인)
    const child = await buildChildLevel(option);
    if (child) levels.value.push(child);

    if (option.value === code) return true;
    if (!child) return false; // 더 내려가야 하는데 하위가 없음
  }
};

const optionsReady = (async () => {
  try {
    levels.value = [{ selected: '', options: toOptions(await getRegions()) }];
  } catch (e) {
    levels.value = [{ selected: '', options: [] }];
    loadError.value =
      '지역 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
  }
})();

// ProfileEdit 는 프로필을 나중에 받아오므로 목록 로딩을 기다린다.
watch(
  () => props.modelValue,
  async (code) => {
    await optionsReady;
    if (!code) return reset();
    // 이 컴포넌트가 방금 올려보낸 값이면 복원할 필요가 없다
    if (levels.value.some((level) => level.selected === code)) return;

    const restored = await restore(code).catch(() => false);
    if (!restored) {
      reset();
      emit('update:modelValue', '');
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="region-select">
    <ProfileSelect
      v-for="(level, index) in levels"
      :key="index"
      :model-value="level.selected"
      :label="index === 0 ? '거주지역' : undefined"
      :placeholder="PLACEHOLDERS[index] ?? '하위 지역 선택'"
      :options="level.options"
      :is-error="index === 0 && !!loadError"
      :error-message="index === 0 ? loadError : undefined"
      @update:model-value="(value) => onChange(index, value)"
    />
  </div>
</template>

<style scoped>
.region-select {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
