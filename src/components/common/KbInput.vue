<template>
  <div class="kb-input-group">
    <label v-if="label" class="kb-label">{{ label }}</label>
    <!-- 눈 버튼의 기준점. .kb-input-group 에 주면 label 유무로 버튼 세로 위치가 흔들린다 -->
    <div class="kb-input-box">
      <input
        :type="isPassword && revealed ? 'text' : type"
        :value="modelValue"
        :placeholder="placeholder"
        :maxlength="maxlength"
        :class="[
          'kb-input',
          { error: isError, focus: isFocus, 'has-toggle': isPassword },
        ]"
        @input="$emit('update:modelValue', $event.target.value)"
        @focus="isFocus = true"
        @blur="isFocus = false"
      />
      <!-- 폼 안에서 기본 submit 이 되면 아이콘 클릭에 폼이 제출된다 -->
      <button
        v-if="isPassword"
        type="button"
        class="kb-input-toggle"
        :aria-label="revealed ? '비밀번호 숨기기' : '비밀번호 표시'"
        :aria-pressed="revealed"
        @click="revealed = !revealed"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M1.7 10C1.7 10 4.7 4.6 10 4.6C15.3 4.6 18.3 10 18.3 10C18.3 10 15.3 15.4 10 15.4C4.7 15.4 1.7 10 1.7 10Z"
            stroke="#908980"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <path
            d="M10 12.3C11.27 12.3 12.3 11.27 12.3 10C12.3 8.73 11.27 7.7 10 7.7C8.73 7.7 7.7 8.73 7.7 10C7.7 11.27 8.73 12.3 10 12.3Z"
            stroke="#908980"
            stroke-width="1.6"
            stroke-linejoin="round"
          />
          <path
            v-if="revealed"
            d="M3.5 3.5L16.5 16.5"
            stroke="#908980"
            stroke-width="1.6"
            stroke-linecap="round"
          />
        </svg>
      </button>
    </div>
    <p v-if="errorMessage" class="kb-message error-text">{{ errorMessage }}</p>
    <p v-else-if="hintMessage" class="kb-message hint-text">
      {{ hintMessage }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
const props = defineProps({
  modelValue: [String, Number],
  label: String,
  type: { type: String, default: 'text' },
  placeholder: String,
  maxlength: [String, Number],
  errorMessage: String,
  hintMessage: String,
  isError: Boolean,
});
defineEmits(['update:modelValue']);
const isFocus = ref(false);
const revealed = ref(false);
const isPassword = computed(() => props.type === 'password');
</script>

<style scoped>
.kb-input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
  font-family: 'Pretendard', sans-serif;
}

.kb-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #908980;
}

.kb-input-box {
  position: relative;
}

.kb-input {
  box-sizing: border-box;
  width: 100%;
  height: 48px;
  padding: 0 16px;
  background-color: #ffffff;
  border: 1px solid #efece4;
  border-radius: 12px;
  /* font-family: 'Pretendard', sans-serif; */
  font-size: 14px;
  color: #2e2a24;
  outline: none;
  transition: border 0.2s;
}

.kb-input:focus,
.kb-input.focus {
  border: 1.6px solid #ffbc00;
  padding: 0 15.4px;
}

.kb-input.error {
  border: 1.6px solid #d64545;
  padding: 0 15.4px;
}

/* .focus/.error 가 padding 단축 속성으로 오른쪽 여백을 되돌리므로 반드시 그 뒤에 온다 */
.kb-input.has-toggle {
  padding-right: 44px;
}

.kb-input-toggle {
  position: absolute;
  top: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 100%;
  padding: 0;
  background: none;
  border: 0;
  cursor: pointer;
}

/* Edge 가 자체 눈 아이콘을 덧붙여 두 개로 보인다 */
.kb-input::-ms-reveal {
  display: none;
}

.kb-message {
  font-size: 12px;
  margin: 0;
}
.error-text {
  color: #d64545;
}
.hint-text {
  color: #43a047;
}
</style>
