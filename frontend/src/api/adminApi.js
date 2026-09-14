import apiClient from './axios';

// The admin console reads real accounts through these. It used to read a hardcoded list
// from localStorage, so its figures and its "accounts" were invented.

export const getAdminStats = async () => {
  try {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// role: 'customers' | 'sellers' | 'couriers'
export const getAdminUsers = async (role) => {
  try {
    const response = await apiClient.get(`/admin/users/${role}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Shops awaiting verification and courier sign-ups awaiting approval.
export const getPendingRegistrations = async () => {
  try {
    const response = await apiClient.get('/admin/pending');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const reviewCourierApproval = async (courierId, status) => {
  try {
    const response = await apiClient.patch(`/admin/couriers/${courierId}/approval`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Account management. `role` here is singular — 'seller' | 'customer' | 'courier'.
export const editAdminAccount = async (role, id, fields) => {
  try {
    const response = await apiClient.patch(`/admin/${role}/${id}`, fields);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// A soft delete: the account is greyed out for a grace period before it is removed.
export const deleteAdminAccount = async (role, id) => {
  try {
    const response = await apiClient.delete(`/admin/${role}/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const restoreAdminAccount = async (role, id) => {
  try {
    const response = await apiClient.patch(`/admin/${role}/${id}/restore`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
