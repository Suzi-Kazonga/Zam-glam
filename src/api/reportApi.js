import apiClient from './axios';

// Complaints between parties on an order, and the moderation that follows from them.

// Who else was on this order — the people you could report.
export const getReportableParties = async (orderId) => {
  try {
    const response = await apiClient.get(`/reports/order/${orderId}/parties`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const reportParty = async ({ orderId, reportedRole, reportedId, reason, details }) => {
  try {
    const response = await apiClient.post('/reports', {
      order_id: orderId,
      reported_role: reportedRole,
      reported_id: reportedId,
      reason,
      details,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// The signed-in user's own standing; drives the SUSPENDED notice.
export const getMyStanding = async () => {
  try {
    const response = await apiClient.get('/reports/me/standing');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin moderation.
export const getReportSummary = async () => {
  try {
    const response = await apiClient.get('/reports/admin/summary');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getReportsAgainst = async (role, id) => {
  try {
    const response = await apiClient.get(`/reports/admin/${role}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const setAccountStatus = async (role, id, status, reason) => {
  try {
    const response = await apiClient.patch(`/reports/admin/${role}/${id}/status`, { status, reason });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
