import apiClient from './axios';

export async function getDeals() {
  const { data } = await apiClient.get('/deals');
  return data;
}