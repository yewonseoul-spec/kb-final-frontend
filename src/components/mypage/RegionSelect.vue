<script setup>
import { computed, ref, watch } from 'vue';
import { getRegions } from '@/api/regionApi';

const props = defineProps({
  modelValue: { type: String, default: '' },
});
const emit = defineEmits(['update:modelValue']);

// 제목만 단계 순서대로 쓴다. 깊이 판단은 API 의 hasChildren 이 한다.
const LEVEL_TITLES = ['시·도 선택', '시·군·구 선택', '세부 지역 선택'];

// 저장된 코드에서 상위를 되짚는 API 가 없어, 법정동코드 자릿수로 후보를 좁힌다.
const PREFIX_LENGTHS = [2, 4];

const isOpen = ref(false);
const path = ref([]); // 시트에서 거쳐온 상위들
const options = ref([]); // 현재 단계 목록
const isLoading = ref(false);
const loadError = ref('');
const displayName = ref(''); // 트리거에 보이는 이름
let committedCode = ''; // 이 컴포넌트가 올려보낸 값 (watch 재조회 방지)
let requestId = 0;

const parent = computed(() => path.value[path.value.length - 1] ?? null);
const title = computed(
  () => LEVEL_TITLES[path.value.length] ?? '세부 지역 선택',
);

// API 는 전체 지역명('경기도 수원시 장안구')을 준다.
// 목록에 그대로 쓰면 상위가 반복되므로 접두사를 떼되, 이름 규칙이 어긋나면 원문을 쓴다.
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

// 한 단계 목록을 받아온다. 실패했거나 뒤늦게 도착했으면 null.
const fetchLevel = async (target) => {
  const current = ++requestId;
  isLoading.value = true;
  loadError.value = '';
  try {
    const list = toOptions(
      await getRegions(target?.value),
      target?.fullName ?? '',
    );
    return current === requestId ? list : null;
  } catch (e) {
    if (current === requestId) {
      loadError.value =
        '지역 목록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.';
    }
    return null;
  } finally {
    if (current === requestId) isLoading.value = false;
  }
};

const open = async () => {
  isOpen.value = true;
  path.value = [];
  options.value = [];
  const list = await fetchLevel(null);
  if (list) options.value = list;
};

const close = () => {
  isOpen.value = false;
};

const commit = (option) => {
  committedCode = option.value;
  displayName.value = option.fullName;
  emit('update:modelValue', option.value);
  close();
};

const clear = () => {
  committedCode = '';
  displayName.value = '';
  emit('update:modelValue', '');
  close();
};

// 하위가 있으면 파고들고, 없으면 그 자리에서 확정한다.
const pick = async (option) => {
  if (!option.hasChildren) {
    commit(option);
    return;
  }
  const list = await fetchLevel(option);
  if (!list) return;
  path.value.push(option);
  options.value = list;
};

const goBack = async () => {
  const target = path.value[path.value.length - 2] ?? null;
  const list = await fetchLevel(target);
  if (!list) return;
  path.value.pop();
  options.value = list;
};

// 저장된 코드 → 표시할 이름. 목록에 없으면 '', 통신 실패는 그대로 throw 한다.
const resolveName = async (code) => {
  let target = null;
  for (let i = 0; ; i += 1) {
    const list = toOptions(
      await getRegions(target?.value),
      target?.fullName ?? '',
    );
    const prefix = PREFIX_LENGTHS[i];
    const option =
      list.find((o) => o.value === code) ??
      (prefix
        ? list.find((o) => o.value.slice(0, prefix) === code.slice(0, prefix))
        : undefined);

    if (!option) return '';
    if (option.value === code) return option.fullName;
    if (!option.hasChildren) return '';
    target = option;
  }
};

// ProfileEdit 는 프로필을 나중에 받아오므로 값이 들어오는 시점에 이름을 만든다.
watch(
  () => props.modelValue,
  async (code) => {
    if (!code) {
      displayName.value = '';
      return;
    }
    if (code === committedCode) return; // 방금 이 컴포넌트가 올려보낸 값

    try {
      const name = await resolveName(code);
      if (name) {
        displayName.value = name;
      } else {
        // 지역 목록에 없는 코드 → 미선택으로 떨어뜨린다
        displayName.value = '';
        emit('update:modelValue', '');
      }
    } catch (e) {
      // 통신 실패로 이름만 못 만든 것이므로 값은 지우지 않는다
      displayName.value = '지역 정보를 불러오지 못했어요';
    }
  },
  { immediate: true },
);
</script>

<template>
  <div class="region-select">
    <span class="region-label">거주지역</span>
    <button type="button" class="region-trigger" @click="open">
      <span :class="['region-value', { empty: !displayName }]">
        {{ displayName || '선택' }}
      </span>
      <svg
        class="arrow"
        width="12"
        height="7"
        viewBox="0 0 12 7"
        fill="none"
        aria-hidden="true"
      >
        <path
          d="M1 1L6 6L11 1"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </button>

    <div v-if="isOpen" class="sheet-overlay" @click.self="close">
      <section class="sheet">
        <header class="sheet-header">
          <button
            v-if="path.length"
            type="button"
            class="sheet-icon"
            @click="goBack"
          >
            ‹
          </button>
          <h3 class="sheet-title">{{ title }}</h3>
          <button type="button" class="sheet-icon" @click="close">×</button>
        </header>

        <p v-if="parent" class="sheet-path">{{ parent.fullName }}</p>

        <p v-if="loadError" class="sheet-error">{{ loadError }}</p>
        <p v-else-if="isLoading" class="sheet-loading">불러오는 중…</p>

        <div v-else class="sheet-list">
          <button
            v-if="!parent"
            type="button"
            class="sheet-item"
            @click="clear"
          >
            선택 안 함
          </button>

          <button
            v-for="option in options"
            :key="option.value"
            type="button"
            class="sheet-item"
            @click="pick(option)"
          >
            <span>{{ option.label }}</span>
            <span v-if="option.hasChildren" class="sheet-more">›</span>
          </button>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.region-select {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.region-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #908980;
}

.region-trigger {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 12px;
  font-size: 14px;
  color: #2e2a24;
  text-align: left;
  cursor: pointer;
}

.region-trigger:focus {
  outline: none;
  border: 1.6px solid #ffbc00;
  padding: 0 15.4px;
}

.region-value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.region-value.empty {
  color: #a1998d;
}

.arrow {
  flex-shrink: 0;
  color: #908980;
}

.sheet-overlay {
  position: fixed;
  inset: 0;
  z-index: 3000;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background: rgba(0, 0, 0, 0.35);
}

.sheet {
  display: flex;
  flex-direction: column;
  width: min(100%, 440px);
  max-height: 70dvh;
  padding: 20px 20px calc(20px + env(safe-area-inset-bottom));
  background: #ffffff;
  border-radius: 20px 20px 0 0;
}

.sheet-header {
  display: flex;
  align-items: center;
  gap: 8px;
}

.sheet-title {
  flex: 1;
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: #2e2a24;
}

.sheet-icon {
  width: 32px;
  height: 32px;
  border: 0;
  background: transparent;
  font-size: 22px;
  line-height: 1;
  color: #908980;
  cursor: pointer;
}

.sheet-path {
  margin: 4px 0 0;
  font-size: 13px;
  color: #908980;
  word-break: keep-all;
}

.sheet-error,
.sheet-loading {
  margin: 24px 0;
  font-size: 14px;
  text-align: center;
  word-break: keep-all;
}

.sheet-error {
  color: #d64545;
}

.sheet-loading {
  color: #908980;
}

.sheet-list {
  margin-top: 12px;
  overflow-y: auto;
}

.sheet-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 14px 4px;
  border: 0;
  border-bottom: 1px solid #efece4;
  background: transparent;
  font-size: 15px;
  color: #2e2a24;
  text-align: left;
  cursor: pointer;
}

.sheet-more {
  color: #908980;
}
</style>
