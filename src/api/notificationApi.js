import instance from '@/api';

const BASE_URL = '/api/notification';

export const getNotifications = async () => {
  const { data } = await instance.get(BASE_URL);
  return data;
};

export const getUnreadCount = async () => {
  const { data } = await instance.get(`${BASE_URL}/unread-count`);
  return data.count;
};

export const markRead = (notiNo) =>
  instance.patch(`${BASE_URL}/${notiNo}/read`);

export const markAllRead = () => instance.patch(`${BASE_URL}/read-all`);

export const removeNotification = (notiNo) =>
  instance.delete(`${BASE_URL}/${notiNo}`);
