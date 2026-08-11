<template>
  <transition name="fade-slide">
    <div v-if="isOpen" class="drawer-overlay" @click.self="$emit('close')">
      <div class="drawer-content">
        <div class="drawer-header">
          <button class="close-btn" @click="$emit('close')">✕</button>
        </div>

        <div class="profile-row">
          <button
            type="button"
            class="avatar"
            aria-label="마이페이지로 이동"
            @click="goPage({ name: 'MyPage' })"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 -3 20 20"
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
          </button>

          <div class="profile-text">
            <template v-if="auth.isLogin">
              <p class="profile-name">{{ auth.realName || auth.loginId }} 님</p>
              <p v-if="regionName" class="profile-region">{{ regionName }}</p>
            </template>
            <p v-else class="profile-name">로그인이 필요해요</p>
          </div>

          <button
            type="button"
            class="auth-btn"
            :class="auth.isLogin ? 'logout' : 'login'"
            @click="onAuthAction"
          >
            {{ auth.isLogin ? '로그아웃' : '로그인' }}
          </button>
        </div>

        <div class="menu-list">
          <div class="menu-item" @click="goPage('/asset')">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="20"
                  height="36"
                  viewBox="0 -3 20 20"
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
                <div class="sub-links">
                  <span class="sub">금융 상품 조회</span>
                  <span class="sub">자산 비율 분석</span>
                  <span class="sub">계좌별 잔액</span>
                </div>
              </div>
            </div>
          </div>

          <div class="menu-item" @click="goPage('/consumption')">
            <div class="menu-main">
              <span class="icon">
                <svg
                  width="20"
                  height="32"
                  viewBox="0 -4 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <mask id="path-1-inside-1_768_11" fill="white">
                    <path
                      d="M19 1.0625V11.6875H3.0625V9.5625H2V0H16.875V1.0625H19ZM14.75 1.0625C14.75 1.21191 14.7777 1.35026 14.833 1.47754C14.8883 1.60482 14.9631 1.71549 15.0571 1.80957C15.1512 1.90365 15.2646 1.98112 15.3975 2.04199C15.5303 2.10286 15.6686 2.13053 15.8125 2.125V1.0625H14.75ZM3.0625 2.125C3.21191 2.125 3.35026 2.09733 3.47754 2.04199C3.60482 1.98665 3.71549 1.91195 3.80957 1.81787C3.90365 1.7238 3.98112 1.61035 4.04199 1.47754C4.10286 1.34473 4.13053 1.20638 4.125 1.0625H3.0625V2.125ZM3.0625 6.375C3.35579 6.375 3.62972 6.43034 3.88428 6.54102C4.13883 6.65169 4.36572 6.80387 4.56494 6.99756C4.76416 7.19124 4.91634 7.41536 5.02148 7.66992C5.12663 7.92448 5.18197 8.20117 5.1875 8.5H13.6875C13.6875 8.20671 13.7428 7.93278 13.8535 7.67822C13.9642 7.42367 14.1164 7.19678 14.3101 6.99756C14.5037 6.79834 14.7279 6.64616 14.9824 6.54102C15.237 6.43587 15.5137 6.38053 15.8125 6.375V3.1875C15.5192 3.1875 15.2453 3.13216 14.9907 3.02148C14.7362 2.91081 14.5093 2.75863 14.3101 2.56494C14.1108 2.37126 13.9587 2.14714 13.8535 1.89258C13.7484 1.63802 13.693 1.36133 13.6875 1.0625H5.1875C5.1875 1.35579 5.13216 1.62972 5.02148 1.88428C4.91081 2.13883 4.75863 2.36572 4.56494 2.56494C4.37126 2.76416 4.14714 2.91634 3.89258 3.02148C3.63802 3.12663 3.36133 3.18197 3.0625 3.1875V6.375ZM15.8125 7.4375C15.6631 7.4375 15.5247 7.46517 15.3975 7.52051C15.2702 7.57585 15.1595 7.65055 15.0654 7.74463C14.9714 7.8387 14.8939 7.95215 14.833 8.08496C14.7721 8.21777 14.7445 8.35612 14.75 8.5H15.8125V7.4375ZM3.0625 8.5H4.125C4.125 8.35059 4.09733 8.21224 4.04199 8.08496C3.98665 7.95768 3.91195 7.84701 3.81787 7.75293C3.7238 7.65885 3.61035 7.58138 3.47754 7.52051C3.34473 7.45964 3.20638 7.43197 3.0625 7.4375V8.5ZM17.9375 2.125H16.875V9.5625H4.125V10.625H17.9375V2.125ZM5.71875 5.3125C5.57487 5.3125 5.45036 5.25993 5.34521 5.15479C5.24007 5.04964 5.1875 4.92513 5.1875 4.78125C5.1875 4.63737 5.24007 4.51286 5.34521 4.40771C5.45036 4.30257 5.57487 4.25 5.71875 4.25C5.86263 4.25 5.98714 4.30257 6.09229 4.40771C6.19743 4.51286 6.25 4.63737 6.25 4.78125C6.25 4.92513 6.19743 5.04964 6.09229 5.15479C5.98714 5.25993 5.86263 5.3125 5.71875 5.3125ZM13.1562 5.3125C13.0124 5.3125 12.8879 5.25993 12.7827 5.15479C12.6776 5.04964 12.625 4.92513 12.625 4.78125C12.625 4.63737 12.6776 4.51286 12.7827 4.40771C12.8879 4.30257 13.0124 4.25 13.1562 4.25C13.3001 4.25 13.4246 4.30257 13.5298 4.40771C13.6349 4.51286 13.6875 4.63737 13.6875 4.78125C13.6875 4.92513 13.6349 5.04964 13.5298 5.15479C13.4246 5.25993 13.3001 5.3125 13.1562 5.3125ZM9.4375 7.4375C9.14421 7.4375 8.87028 7.38216 8.61572 7.27148C8.36117 7.16081 8.13428 7.00863 7.93506 6.81494C7.73584 6.62126 7.58366 6.39714 7.47852 6.14258C7.37337 5.88802 7.31803 5.61133 7.3125 5.3125V4.25C7.3125 3.95671 7.36784 3.68278 7.47852 3.42822C7.58919 3.17367 7.74137 2.94678 7.93506 2.74756C8.12874 2.54834 8.35286 2.39616 8.60742 2.29102C8.86198 2.18587 9.13867 2.13053 9.4375 2.125C9.73079 2.125 10.0047 2.18034 10.2593 2.29102C10.5138 2.40169 10.7407 2.55387 10.9399 2.74756C11.1392 2.94124 11.2913 3.16536 11.3965 3.41992C11.5016 3.67448 11.557 3.95117 11.5625 4.25V5.3125C11.5625 5.60579 11.5072 5.87972 11.3965 6.13428C11.2858 6.38883 11.1336 6.61572 10.9399 6.81494C10.7463 7.01416 10.5221 7.16634 10.2676 7.27148C10.013 7.37663 9.73633 7.43197 9.4375 7.4375ZM8.375 5.3125C8.375 5.46191 8.40267 5.60026 8.45801 5.72754C8.51335 5.85482 8.58805 5.96549 8.68213 6.05957C8.7762 6.15365 8.88965 6.23112 9.02246 6.29199C9.15527 6.35286 9.29362 6.38053 9.4375 6.375C9.58691 6.375 9.72526 6.34733 9.85254 6.29199C9.97982 6.23665 10.0905 6.16195 10.1846 6.06787C10.2786 5.9738 10.3561 5.86035 10.417 5.72754C10.4779 5.59473 10.5055 5.45638 10.5 5.3125V4.25C10.5 4.10059 10.4723 3.96224 10.417 3.83496C10.3617 3.70768 10.2869 3.59701 10.1929 3.50293C10.0988 3.40885 9.98535 3.33138 9.85254 3.27051C9.71973 3.20964 9.58138 3.18197 9.4375 3.1875C9.28809 3.1875 9.14974 3.21517 9.02246 3.27051C8.89518 3.32585 8.78451 3.40055 8.69043 3.49463C8.59635 3.5887 8.51888 3.70215 8.45801 3.83496C8.39714 3.96777 8.36947 4.10612 8.375 4.25V5.3125Z"
                    />
                  </mask>
                  <path
                    d="M19 1.0625V11.6875H3.0625V9.5625H2V0H16.875V1.0625H19ZM14.75 1.0625C14.75 1.21191 14.7777 1.35026 14.833 1.47754C14.8883 1.60482 14.9631 1.71549 15.0571 1.80957C15.1512 1.90365 15.2646 1.98112 15.3975 2.04199C15.5303 2.10286 15.6686 2.13053 15.8125 2.125V1.0625H14.75ZM3.0625 2.125C3.21191 2.125 3.35026 2.09733 3.47754 2.04199C3.60482 1.98665 3.71549 1.91195 3.80957 1.81787C3.90365 1.7238 3.98112 1.61035 4.04199 1.47754C4.10286 1.34473 4.13053 1.20638 4.125 1.0625H3.0625V2.125ZM3.0625 6.375C3.35579 6.375 3.62972 6.43034 3.88428 6.54102C4.13883 6.65169 4.36572 6.80387 4.56494 6.99756C4.76416 7.19124 4.91634 7.41536 5.02148 7.66992C5.12663 7.92448 5.18197 8.20117 5.1875 8.5H13.6875C13.6875 8.20671 13.7428 7.93278 13.8535 7.67822C13.9642 7.42367 14.1164 7.19678 14.3101 6.99756C14.5037 6.79834 14.7279 6.64616 14.9824 6.54102C15.237 6.43587 15.5137 6.38053 15.8125 6.375V3.1875C15.5192 3.1875 15.2453 3.13216 14.9907 3.02148C14.7362 2.91081 14.5093 2.75863 14.3101 2.56494C14.1108 2.37126 13.9587 2.14714 13.8535 1.89258C13.7484 1.63802 13.693 1.36133 13.6875 1.0625H5.1875C5.1875 1.35579 5.13216 1.62972 5.02148 1.88428C4.91081 2.13883 4.75863 2.36572 4.56494 2.56494C4.37126 2.76416 4.14714 2.91634 3.89258 3.02148C3.63802 3.12663 3.36133 3.18197 3.0625 3.1875V6.375ZM15.8125 7.4375C15.6631 7.4375 15.5247 7.46517 15.3975 7.52051C15.2702 7.57585 15.1595 7.65055 15.0654 7.74463C14.9714 7.8387 14.8939 7.95215 14.833 8.08496C14.7721 8.21777 14.7445 8.35612 14.75 8.5H15.8125V7.4375ZM3.0625 8.5H4.125C4.125 8.35059 4.09733 8.21224 4.04199 8.08496C3.98665 7.95768 3.91195 7.84701 3.81787 7.75293C3.7238 7.65885 3.61035 7.58138 3.47754 7.52051C3.34473 7.45964 3.20638 7.43197 3.0625 7.4375V8.5ZM17.9375 2.125H16.875V9.5625H4.125V10.625H17.9375V2.125ZM5.71875 5.3125C5.57487 5.3125 5.45036 5.25993 5.34521 5.15479C5.24007 5.04964 5.1875 4.92513 5.1875 4.78125C5.1875 4.63737 5.24007 4.51286 5.34521 4.40771C5.45036 4.30257 5.57487 4.25 5.71875 4.25C5.86263 4.25 5.98714 4.30257 6.09229 4.40771C6.19743 4.51286 6.25 4.63737 6.25 4.78125C6.25 4.92513 6.19743 5.04964 6.09229 5.15479C5.98714 5.25993 5.86263 5.3125 5.71875 5.3125ZM13.1562 5.3125C13.0124 5.3125 12.8879 5.25993 12.7827 5.15479C12.6776 5.04964 12.625 4.92513 12.625 4.78125C12.625 4.63737 12.6776 4.51286 12.7827 4.40771C12.8879 4.30257 13.0124 4.25 13.1562 4.25C13.3001 4.25 13.4246 4.30257 13.5298 4.40771C13.6349 4.51286 13.6875 4.63737 13.6875 4.78125C13.6875 4.92513 13.6349 5.04964 13.5298 5.15479C13.4246 5.25993 13.3001 5.3125 13.1562 5.3125ZM9.4375 7.4375C9.14421 7.4375 8.87028 7.38216 8.61572 7.27148C8.36117 7.16081 8.13428 7.00863 7.93506 6.81494C7.73584 6.62126 7.58366 6.39714 7.47852 6.14258C7.37337 5.88802 7.31803 5.61133 7.3125 5.3125V4.25C7.3125 3.95671 7.36784 3.68278 7.47852 3.42822C7.58919 3.17367 7.74137 2.94678 7.93506 2.74756C8.12874 2.54834 8.35286 2.39616 8.60742 2.29102C8.86198 2.18587 9.13867 2.13053 9.4375 2.125C9.73079 2.125 10.0047 2.18034 10.2593 2.29102C10.5138 2.40169 10.7407 2.55387 10.9399 2.74756C11.1392 2.94124 11.2913 3.16536 11.3965 3.41992C11.5016 3.67448 11.557 3.95117 11.5625 4.25V5.3125C11.5625 5.60579 11.5072 5.87972 11.3965 6.13428C11.2858 6.38883 11.1336 6.61572 10.9399 6.81494C10.7463 7.01416 10.5221 7.16634 10.2676 7.27148C10.013 7.37663 9.73633 7.43197 9.4375 7.4375ZM8.375 5.3125C8.375 5.46191 8.40267 5.60026 8.45801 5.72754C8.51335 5.85482 8.58805 5.96549 8.68213 6.05957C8.7762 6.15365 8.88965 6.23112 9.02246 6.29199C9.15527 6.35286 9.29362 6.38053 9.4375 6.375C9.58691 6.375 9.72526 6.34733 9.85254 6.29199C9.97982 6.23665 10.0905 6.16195 10.1846 6.06787C10.2786 5.9738 10.3561 5.86035 10.417 5.72754C10.4779 5.59473 10.5055 5.45638 10.5 5.3125V4.25C10.5 4.10059 10.4723 3.96224 10.417 3.83496C10.3617 3.70768 10.2869 3.59701 10.1929 3.50293C10.0988 3.40885 9.98535 3.33138 9.85254 3.27051C9.71973 3.20964 9.58138 3.18197 9.4375 3.1875C9.28809 3.1875 9.14974 3.21517 9.02246 3.27051C8.89518 3.32585 8.78451 3.40055 8.69043 3.49463C8.59635 3.5887 8.51888 3.70215 8.45801 3.83496C8.39714 3.96777 8.36947 4.10612 8.375 4.25V5.3125Z"
                    fill="#2E2A24"
                    stroke="#2E2A24"
                    stroke-width="2"
                    mask="url(#path-1-inside-1_768_11)"
                  />
                </svg>
              </span>
              <div class="text-group">
                <span class="title">소비</span>
                <div class="sub-links">
                  <span class="sub">소비 캘린더</span>
                  <span class="sub">패턴 분석</span>
                </div>
              </div>
            </div>
          </div>

          <div class="menu-item" @click="emit('close')">
            <div class="menu-main">
              <span class="icon">
                <svg
                  width="20"
                  height="34"
                  viewBox="0 -3 20 20"
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

                <div class="sub-links" @click.stop="emit('close')">
                  <RouterLink
                    class="sub"
                    :to="{ path: '/benefit', query: { tab: 'condition' } }"
                  >
                    조건 기반 추천
                  </RouterLink>
                  <RouterLink
                    class="sub"
                    :to="{ path: '/benefit', query: { tab: 'consumption' } }"
                  >
                    소비 기반 추천
                  </RouterLink>
                  <RouterLink
                    class="sub"
                    :to="{ path: '/benefit', query: { tab: 'goal' } }"
                  >
                    목표 기반 추천
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>

          <div class="menu-item" @click="goPage({ name: 'MyPage' })">
            <div class="menu-main">
              <span class="icon"
                ><svg
                  width="20"
                  height="36"
                  viewBox="0 -3 20 20"
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

                <!--
                  부모 .menu-item 이 MyPage 로 보내므로 .stop 이 없으면
                  세부 화면으로 갔다가 마이페이지로 덮어써진다.
                  .stop 으로 부모를 막았으니 드로어를 닫는 것도 여기서 한다.
                -->
                <div class="sub-links" @click.stop="emit('close')">
                  <RouterLink class="sub" :to="{ name: 'ProfileEdit' }">
                    내 정보 수정
                  </RouterLink>
                  <RouterLink class="sub" :to="{ name: 'GoalEdit' }">
                    목표 수정
                  </RouterLink>
                  <RouterLink class="sub" :to="{ name: 'FavoriteBenefits' }">
                    관심 혜택
                  </RouterLink>
                  <RouterLink class="sub" :to="{ name: 'AppliedBenefits' }">
                    신청 혜택
                  </RouterLink>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>

  <KbModal v-if="showLogoutConfirm" title="로그아웃" :columns="2">
    <p class="modal-desc">정말 로그아웃 하시겠습니까?</p>
    <template #actions>
      <KbButton type="secondary" @click="showLogoutConfirm = false">
        취소
      </KbButton>
      <KbButton type="primary" @click="handleLogout">확인</KbButton>
    </template>
  </KbModal>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import authApi from '@/api/authApi';
import KbModal from '@/components/common/KbModal.vue';
import KbButton from '@/components/common/KbButton.vue';
import mypageApi from '@/api/mypageApi';

const props = defineProps({
  isOpen: { type: Boolean, default: false },
});

const regionName = ref('');
const emit = defineEmits(['close']);
const router = useRouter();
const auth = useAuthStore();

// 🌟 3. 로그아웃 확인 모달창 열림/닫힘 상태 변수
const showLogoutConfirm = ref(false);

// 마이페이지 도메인은 name으로 연결 — 없는 이름이면 vue-router 가 즉시 터져서
// 링크가 조용히 죽는 것을 막는다.
// consumption, asset, benefit은 우선 이름으로 연결하면 수정 시 깨질 수 있어서 변경 대기
const goPage = (to) => {
  router.push(to);
  emit('close');
};

// 헤더(DefaultLayout)와 같은 규칙 — 로그인 상태면 로그아웃 확인, 아니면 로그인 페이지로.
const onAuthAction = () => {
  if (auth.isLogin) {
    showLogoutConfirm.value = true;
    return;
  }
  goPage({ name: 'Login' });
};

const handleLogout = async () => {
  try {
    await authApi.logout();
  } catch (e) {
    // 토큰이 이미 만료된 경우 등 — 로컬 정리는 그대로 진행한다
  }
  auth.logout();
  regionName.value = '';
  showLogoutConfirm.value = false;
  router.push({ name: 'Login' });
  emit('close');
};

/*
 * 지역은 auth 스토어에 없어서(loginId·email·realName·roles 뿐) 프로필 API 를 따로 받는다.
 * 🔴 캐시하지 않는다 — 드로어가 DefaultLayout 안에 상시 마운트돼 있어서,
 *    한 번 받고 재사용하면 프로필을 수정해도 옛 지역이 계속 보인다.
 * 🔴 auth.isLogin 일 때만 호출할 것 — 비로그인에서 401 을 받으면
 *    api/index.js 인터셉터가 로그인 화면으로 튕겨버린다.
 */
const loadRegion = async () => {
  if (!auth.isLogin) return;

  try {
    const profile = await mypageApi.getProfile();
    // '경기도 수원시 장안구' 처럼 길어서 앞 두 토큰만 쓴다 (MyPage.vue 와 같은 규칙)
    regionName.value = profile.regionName
      ? profile.regionName.split(' ').slice(0, 2).join(' ')
      : '';
  } catch (e) {
    // 404 = 프로필이 사라진 경우이므로 지역을 비운다.
    // 그 외(네트워크 오류 등)는 이전 값을 그대로 둔다
    if (e.response?.status === 404) regionName.value = '';
  }
};

watch(
  () => props.isOpen,
  (open) => {
    if (open) loadRegion();
  },
);
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

.profile-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid #efece4;
}

/* 프로필 사진 자리. 업로드 API 가 없어 지금은 기본 아이콘 고정이다 */
.avatar {
  flex: 0 0 44px;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #efece4;
  cursor: pointer;
}

.profile-text {
  flex: 1;
  min-width: 0;
}

.profile-name {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #2e2a24;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.profile-region {
  margin: 2px 0 0;
  font-size: 12px;
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
  align-items: flex-start; /* 아이콘 박스를 제목 첫 줄에 맞춘다 */
}

/* 아이콘 크기는 여기서만 정한다. SVG 의 width/height 속성은 CSS 가 이긴다 */
.icon {
  flex: 0 0 24px;
  height: 24px; /* .title 의 한 줄 높이(16px × 1.5)와 같게 */
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon svg {
  width: 100%;
  height: 100%;
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
  line-height: 1.5; /* 24px — .icon 높이와 짝을 이룬다 */
}

.sub {
  font-size: 12px;
  color: #908980;
  line-height: 1.4;
  text-decoration: none !important;
}

/* .sub 가 inline 이라 세로로 쌓으려면 컨테이너가 필요하다.
   align-self 로 컨테이너를 내용 폭만큼만 차지하게 해서,
   글자 오른쪽 빈 곳을 눌렀을 때 드로어만 닫히는 일을 줄인다. */
.sub-links {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  align-self: flex-start;
  gap: 2px;
}

.auth-btn {
  background: none;
  border: none;
  font-size: 13px; /* 15px → 13px, 한 줄에 들어가야 한다 */
  flex-shrink: 0;
  cursor: pointer;
}

.auth-btn.logout {
  color: #d64545;
}

.auth-btn.login {
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
