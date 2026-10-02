import apiClient from './axios';

export async function getMessageThreads() {
  const { data } = await apiClient.get('/messages/threads');
  return Array.isArray(data) ? data : [];
}

export async function getThreadMessages(storeId, customerId) {
  const path = customerId
    ? `/messages/threads/${storeId}/${customerId}`
    : `/messages/threads/${storeId}`;
  const { data } = await apiClient.get(path);
  return Array.isArray(data) ? data : [];
}

export async function sendThreadMessage(storeId, body, customerId) {
  const path = customerId
    ? `/messages/threads/${storeId}/${customerId}`
    : `/messages/threads/${storeId}`;
  const { data } = await apiClient.post(path, { body });
  return data;
}