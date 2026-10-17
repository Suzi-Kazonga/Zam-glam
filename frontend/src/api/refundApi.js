import apiClient from './axios';

export async function getRefundForShipment(shipmentId) {
  const { data } = await apiClient.get(`/refunds/shipment/${shipmentId}`);
  return data.refund;
}

export async function createRefundRequest(payload) {
  const { data } = await apiClient.post('/refunds', payload);
  return data.refund;
}

export async function getMyRefundRequests() {
  const { data } = await apiClient.get('/refunds/my');
  return data;
}

export async function getRefundRequest(id) {
  const { data } = await apiClient.get(`/refunds/${id}`);
  return data;
}

export async function sendRefundMessage(id, body) {
  const { data } = await apiClient.post(`/refunds/${id}/messages`, { body });
  return data;
}

export async function submitRefundRecommendation(id, recommendation, note) {
  const { data } = await apiClient.patch(`/refunds/${id}/recommendation`, { recommendation, note });
  return data;
}

export async function getAdminRefundRequests() {
  const { data } = await apiClient.get('/refunds/admin');
  return data;
}

export async function decideRefundRequest(id, decision, note) {
  const { data } = await apiClient.patch(`/refunds/admin/${id}/decision`, { decision, note });
  return data.refund;
}
