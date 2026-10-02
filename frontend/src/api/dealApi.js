// Fetches the home page’s "today’s offers" strip.

import apiClient from './axios';

export async function getDeals() {
  const { data } = await apiClient.get('/deals');
  return data;
}

export async function getSellerPromotions() {
  const { data } = await apiClient.get('/deals/mine');
  return data;
}

export async function createSellerPromotion(promotion) {
  const { data } = await apiClient.post('/deals/mine', promotion);
  return data;
}

export async function deleteSellerPromotion(id) {
  const { data } = await apiClient.delete(`/deals/mine/${id}`);
  return data;
}