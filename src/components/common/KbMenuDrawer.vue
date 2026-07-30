<template>
  <transition name="fade-slide">
    <div v-if="isOpen" class="drawer-overlay" @click.self="$emit('close')">
      <div class="drawer-content">
        <div class="drawer-header">
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="menu-list">
          <div class="menu-item" @click="goPage('/asset')">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="20"
                  height="36"
                  viewBox="0 0 20 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M4 13.95V5.94995M10 13.95V0.949951M16 13.95V7.94995"
                    stroke="#2E2A24"
                    stroke-width="1.9"
                    stroke-linecap="round"
                  />
                </svg>
              </span>
              <div class="text-group">
                <span class="title">자산</span>
                <span class="sub"
                  >금융 상품 조회<br />자산 비율 분석<br />계좌별 잔액</span
                >
              </div>
            </div>
            <span class="arrow">></span>
          </div>

          <div class="menu-item" @click="goPage('/consumption')">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="20"
                  height="37"
                  viewBox="0 0 20 37"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 15.85C14.1421 15.85 17.5 12.4921 17.5 8.34998C17.5 4.20784 14.1421 0.849976 10 0.849976C5.85786 0.849976 2.5 4.20784 2.5 8.34998C2.5 12.4921 5.85786 15.85 10 15.85Z"
                    stroke="#2E2A24"
                    stroke-width="1.7"
                  />
                  <path
                    d="M10 11.35C11.6569 11.35 13 10.0068 13 8.34998C13 6.69312 11.6569 5.34998 10 5.34998C8.34315 5.34998 7 6.69312 7 8.34998C7 10.0068 8.34315 11.35 10 11.35Z"
                    stroke="#2E2A24"
                    stroke-width="1.7"
                  />
                </svg>
              </span>
              <div class="text-group">
                <span class="title">소비</span>
                <span class="sub">소비 캘린더<br />패턴 분석</span>
              </div>
            </div>
            <span class="arrow">></span>
          </div>

          <div class="menu-item" @click="goPage('/benefits')">
            <div class="menu-main">
              <span class="icon">
                <svg
                  width="20"
                  height="34"
                  viewBox="0 0 20 34"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M15.6 3.25781H4.4C3.6268 3.25781 3 3.88461 3 4.65781V10.8578C3 11.631 3.6268 12.2578 4.4 12.2578H15.6C16.3732 12.2578 17 11.631 17 10.8578V4.65781C17 3.88461 16.3732 3.25781 15.6 3.25781Z"
                    stroke="#2E2A24"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M3 6.25781H17M10 3.25781V12.2578"
                    stroke="#2E2A24"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M9.99922 3.25785C8.79922 3.25785 7.19922 2.85785 7.19922 1.65785C7.19922 0.557853 8.49922 0.157853 9.99922 3.25785ZM9.99922 3.25785C11.1992 3.25785 12.7992 2.85785 12.7992 1.65785C12.7992 0.557853 11.4992 0.157853 9.99922 3.25785Z"
                    stroke="#2E2A24"
                    stroke-width="1.7"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <div class="text-group">
                <span class="title">청년혜택</span>
                <span class="sub"
                  >조건 기반 추천<br />소비 기반 추천<br />목표 기반 추천</span
                >
              </div>
            </div>
            <span class="arrow">></span>
          </div>

          <div class="menu-item" @click="goPage('/interest')">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.21271 12.5C8.21271 12.5 2.71271 8.99999 1.21271 5.49999C0.21271 3.19999 1.71271 0.899994 3.91271 0.899994C5.41271 0.899994 6.21271 1.79999 6.61271 2.39999C7.01271 1.79999 7.81271 0.899994 9.31271 0.899994C11.5127 0.899994 13.0127 3.19999 12.0127 5.49999C10.5127 8.99999 5.01271 12.5 5.01271 12.5H8.21271Z"
                    stroke="#2E2A24"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="title">관심 혜택</span>
            </div>
            <span class="arrow">></span>
          </div>

          <div class="menu-item" @click="goPage('/applied')">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="14"
                  height="14"
                  viewBox="0 0 14 14"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8.21271 12.5C8.21271 12.5 2.71271 8.99999 1.21271 5.49999C0.21271 3.19999 1.71271 0.899994 3.91271 0.899994C5.41271 0.899994 6.21271 1.79999 6.61271 2.39999C7.01271 1.79999 7.81271 0.899994 9.31271 0.899994C11.5127 0.899994 13.0127 3.19999 12.0127 5.49999C10.5127 8.99999 5.01271 12.5 5.01271 12.5H8.21271Z"
                    stroke="#2E2A24"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="title">신청 혜택</span>
            </div>
            <span class="arrow">></span>
          </div>

          <div class="menu-item" @click="goPage('/notice')">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="15"
                  height="17"
                  viewBox="0 0 15 17"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2.50039 5.90002C2.50039 4.57394 3.02717 3.30217 3.96486 2.36449C4.90254 1.42681 6.17431 0.900024 7.50039 0.900024C8.82647 0.900024 10.0982 1.42681 11.0359 2.36449C11.9736 3.30217 12.5004 4.57394 12.5004 5.90002C12.5004 9.90002 14.1004 10.9 14.1004 10.9H0.900391C0.900391 10.9 2.50039 9.90002 2.50039 5.90002Z"
                    stroke="#2E2A24"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M5.70117 14.1C5.70117 14.5774 5.89081 15.0353 6.22838 15.3728C6.56595 15.7104 7.02378 15.9 7.50117 15.9C7.97856 15.9 8.4364 15.7104 8.77396 15.3728C9.11153 15.0353 9.30117 14.5774 9.30117 14.1"
                    stroke="#2E2A24"
                    stroke-width="1.8"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <span class="title">알림</span>
            </div>
            <span class="arrow">></span>
          </div>

          <div class="menu-item" @click="goPage('/mypage')">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="20"
                  height="36"
                  viewBox="0 0 20 36"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M10 6.94995C11.6569 6.94995 13 5.60681 13 3.94995C13 2.2931 11.6569 0.949951 10 0.949951C8.34315 0.949951 7 2.2931 7 3.94995C7 5.60681 8.34315 6.94995 10 6.94995Z"
                    stroke="#2E2A24"
                    stroke-width="1.9"
                    stroke-linejoin="round"
                  />
                  <path
                    d="M4 13.95C4 10.75 6.7 8.94995 10 8.94995C13.3 8.94995 16 10.75 16 13.95"
                    stroke="#2E2A24"
                    stroke-width="1.9"
                    stroke-linejoin="round"
                  />
                </svg>
              </span>
              <div class="text-group">
                <span class="title">마이페이지</span>
                <span class="sub"
                  >내 정보 수정<br />목표 수정<br />아이디 조회<br />암호
                  설정</span
                >
              </div>
            </div>
            <span class="arrow">></span>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="logout-btn" @click="showLogoutConfirm = true">
            로그아웃
          </button>
        </div>
      </div>
    </div>
  </transition>

  <div v-if="showLogoutConfirm" class="modal-overlay">
    <div class="modal-card">
      <h4 class="modal-title">로그아웃</h4>
      <p class="modal-desc">정말 로그아웃 하시겠습니까?</p>
      <div class="modal-actions">
        <button class="btn-cancel" @click="showLogoutConfirm = false">
          취소
        </button>
        <button class="btn-confirm" @click="handleLogout">확인</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';

defineProps({
  isOpen: { type: Boolean, default: false },
});

const emit = defineEmits(['close']);
const router = useRouter();

// 🌟 3. 로그아웃 확인 모달창 열림/닫힘 상태 변수
const showLogoutConfirm = ref(false);

const goPage = (path) => {
  router.push(path);
  emit('close');
};

const handleLogout = () => {
  showLogoutConfirm.value = false;
  router.push('/login');
  emit('close');
};
</script>

<style scoped>
.drawer-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.4);
  z-index: 2000;
  display: flex;
  justify-content: flex-end;
}

.drawer-content {
  width: 80%;
  max-width: 360px;
  height: 100%;
  background-color: #ffffff;
  box-sizing: border-box;
  padding: 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow-y: auto;
  font-family: 'Pretendard', sans-serif;
}

.drawer-header {
  display: flex;
  justify-content: flex-end;
}

.close-btn {
  background: none;
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #908980;
}

.menu-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-top: 10px;
}

.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  cursor: pointer;
  padding-bottom: 15px;
  border-bottom: 1px solid #efece4;
}

.menu-main {
  display: flex;
  gap: 12px;
}

.icon {
  font-size: 20px;
}

.text-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.title {
  font-size: 16px;
  font-weight: 700;
  color: #2e2a24;
}

.sub {
  font-size: 12px;
  color: #908980;
  line-height: 1.4;
}

.arrow {
  color: #908980;
  font-size: 14px;
  font-weight: bold;
}

.drawer-footer {
  padding-top: 20px;
  display: flex;
  justify-content: flex-end;
}

.logout-btn {
  background: none;
  border: none;
  color: #d64545;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
}

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 3000;
  display: flex;
  justify-content: center;
  align-items: center;
  font-family: 'Pretendard', sans-serif;
}

.modal-card {
  width: 90%;
  max-width: 300px;
  background-color: #ffffff;
  border-radius: 16px;
  padding: 24px 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}

.modal-title {
  font-size: 18px;
  font-weight: 700;
  color: #2e2a24;
  margin-bottom: 8px;
}

.modal-desc {
  font-size: 14px;
  color: #908980;
  margin-bottom: 24px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  width: 100%;
}

.btn-cancel,
.btn-confirm {
  flex: 1;
  height: 44px;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.btn-cancel {
  background-color: #efece4;
  color: #908980;
}

.btn-confirm {
  background-color: #ffbc00;
  color: #2e2a24;
}

.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease;
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
}
</style>
