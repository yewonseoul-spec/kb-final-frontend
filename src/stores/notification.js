import { ref } from 'vue';
import { defineStore } from 'pinia';
import { getUnreadCount } from '@/api/notificationApi';
import { useAuthStore } from '@/stores/auth';

export const useNotificationStore = defineStore('notification', () => {
  const unread = ref(0);

  /*
   * 개수는 서버에 다시 물어본다. 화면에서 unread-- 로 맞추면
   * 읽음·모두읽음·삭제·생성 네 경로 중 하나만 빠뜨려도 숫자가 영영 틀어진다.
   * 백엔드가 그 네 경로 전부에서 캐시를 지우므로(NotificationServiceImpl
   * invalidateUnread) 다시 물어보면 항상 맞는 값이 온다.
   */
  const refresh = async () => {
    const auth = useAuthStore();

    if (!auth.isLogin) {
      unread.value = 0;
      return;
    }

    try {
      unread.value = await getUnreadCount();
    } catch (e) {
      // 배지는 부가 정보다. 실패해도 화면을 막지 않는다.
      unread.value = 0;
    }
  };

  return { unread, refresh };
});
