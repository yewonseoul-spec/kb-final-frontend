<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { errorMessage } from '@/api';
import {
  getNotifications,
  markRead,
  markAllRead,
  removeNotification,
} from '@/api/notificationApi';
import KbCard from '@/components/common/KbCard.vue';
import KbButton from '@/components/common/KbButton.vue';
import { useNotificationStore } from '@/stores/notification';

const router = useRouter();
const notiStore = useNotificationStore();

const items = ref([]);
const loading = ref(true);
const error = ref('');

const unreadCount = computed(
  () => items.value.filter((n) => n.isRead === 'N').length,
);

const TYPE_TITLE = {
  DEADLINE: '신청 마감이 다가와요',
  SECURITY: '비밀번호가 변경되었어요',
  ACCOUNT: '내 정보가 수정되었어요',
};

// 설명이 제목을 그대로 반복하면 그 앞부분만 떼어 낸다.
// content 는 서버가 한 문장으로 보내므로 제목과 겹치는 경우가 있다.
const descOf = (n) => {
  const text = String(n.content ?? '').trim();
  const title = TYPE_TITLE[n.notiType];
  if (!title || !text.startsWith(title)) return text;
  return text.slice(title.length).replace(/^[.\s]+/, '');
};

const TYPE_LABEL = {
  DEADLINE: '관심 혜택',
  SECURITY: '보안',
  ACCOUNT: '계정',
};

// '2026-08-18 09:30:00' 을 new Date() 에 그대로 넣으면
// 일부 브라우저가 Invalid Date 를 만든다. 'T' 로 바꿔서 넘긴다.
const toDate = (value) => new Date(String(value).replace(' ', 'T'));

const relativeTime = (value) => {
  const created = toDate(value);
  if (Number.isNaN(created.getTime())) return '';

  const minutes = Math.floor((Date.now() - created.getTime()) / 60000);
  if (minutes < 1) return '방금 전';
  if (minutes < 60) return `${minutes}분 전`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  if (hours < 48) return '어제';

  return `${created.getMonth() + 1}월 ${created.getDate()}일`;
};

const badgesOf = (n) => {
  const list = [{ text: TYPE_LABEL[n.notiType] ?? '알림', variant: 'gray' }];

  if (n.notiType === 'DEADLINE' && n.dDay !== null && n.dDay !== undefined) {
    list.unshift({
      text:
        n.dDay < 0 ? '마감됨' : n.dDay === 0 ? '오늘 마감' : `D-${n.dDay} 마감`,
      variant: n.dDay < 0 ? 'gray' : n.dDay <= 7 ? 'danger' : 'default',
    });
  }
  return list;
};

const load = async () => {
  loading.value = true;
  error.value = '';
  try {
    items.value = await getNotifications();
    // 이 조회가 오늘 첫 조회면 서버가 마감 알림을 새로 만든다.
    // 헤더는 그 전에 개수를 받아 갔을 수 있으므로 여기서 다시 맞춘다.
    notiStore.refresh();
  } catch (e) {
    error.value = errorMessage(e, '알림을 불러오지 못했어요.');
  } finally {
    loading.value = false;
  }
};

// 카드를 누르면 읽음 처리하고, 마감 알림이면 혜택 상세로 보낸다
const onCardClick = async (n) => {
  if (n.isRead === 'N') {
    n.isRead = 'Y'; // 먼저 반영한다. 실패해도 되돌리지 않는다(부가 동작)
    try {
      await markRead(n.notiNo);
      // 목록만 고치면 헤더 배지가 남는다. 서버 값으로 같이 맞춘다.
      notiStore.refresh();
    } catch (e) {
      // 읽음 처리 실패로 이동까지 막을 이유는 없다
    }
  }

  if (n.notiType === 'DEADLINE' && n.refNo) {
    router.push({ name: 'benefit-detail', params: { benefitNo: n.refNo } });
  }
};

const onMarkAll = async () => {
  try {
    await markAllRead();
    items.value.forEach((n) => {
      n.isRead = 'Y';
    });
    notiStore.refresh();
  } catch (e) {
    error.value = errorMessage(e, '읽음 처리에 실패했어요.');
  }
};

const onRemove = async (n) => {
  try {
    await removeNotification(n.notiNo);
    items.value = items.value.filter((item) => item.notiNo !== n.notiNo);
    notiStore.refresh();
  } catch (e) {
    error.value = errorMessage(e, '삭제하지 못했어요.');
  }
};

onMounted(load);
</script>

<template>
  <div class="notification">
    <div class="summary">
      <p class="summary-text">
        읽지 않은 알림 <strong>{{ unreadCount }}</strong
        >건
      </p>
      <KbButton
        v-if="unreadCount > 0"
        type="secondary"
        size="small"
        @click="onMarkAll"
      >
        모두 읽음
      </KbButton>
    </div>

    <p v-if="loading" class="state-box">불러오는 중…</p>
    <p v-else-if="error" class="state-box">{{ error }}</p>
    <p v-else-if="items.length === 0" class="state-box">
      아직 도착한 알림이 없어요.
    </p>

    <ul v-else class="noti-list">
      <li v-for="n in items" :key="n.notiNo">
        <div
          class="noti-item"
          :class="{ unread: n.isRead === 'N' }"
          role="button"
          tabindex="0"
          @click="onCardClick(n)"
          @keydown.enter="onCardClick(n)"
        >
          <KbCard
            :badges="badgesOf(n)"
            :title="TYPE_TITLE[n.notiType] ?? '알림'"
            :description="descOf(n)"
          >
            <p class="noti-time">{{ relativeTime(n.createdAt) }}</p>
          </KbCard>

          <button
            type="button"
            class="noti-remove"
            aria-label="알림 삭제"
            @click.stop="onRemove(n)"
          >
            ×
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.notification {
  padding: 16px;
  /* 탭바에 가리지 않도록. Home·MyPage 와 같은 값 */
  padding-bottom: 96px;
}

.summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
}

.summary-text {
  margin: 0;
  font-size: 14px;
  color: #2e2a24;
}

.summary-text strong {
  font-weight: 700;
}

.state-box {
  margin: 0;
  padding: 40px 0;
  text-align: center;
  font-size: 14px;
  color: #8b8577;
}

.noti-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* 카드와 삭제 버튼을 겹쳐 놓기 위한 기준점 */
.noti-item {
  position: relative;
  cursor: pointer;
}

/* 안 읽은 알림만 왼쪽에 표시선을 둔다 */
.noti-item.unread :deep(.kb-card) {
  border-left: 3px solid #ffbc00;
}

.noti-time {
  margin: 0;
  font-size: 12px;
  color: #8b8577;
}

.noti-remove {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 24px;
  height: 24px;
  border: none;
  background: transparent;
  color: #8b8577;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  border-radius: 6px;
}

.noti-remove:hover {
  background-color: #f5f3ee;
  color: #2e2a24;
}
</style>
