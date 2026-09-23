// Storefronts: reading them, a shop managing its own, and the verification paperwork.

import apiClient from './axios';

// Get all stores
export const getAllStores = async () => {
  try {
    const response = await apiClient.get('/stores');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// The signed-in seller's own store — use this rather than guessing the storefront path
// from the shop name.
export const getMyStore = async () => {
  try {
    const response = await apiClient.get('/stores/mine');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get store by ID
export const getStore = async (id) => {
  try {
    const response = await apiClient.get(`/stores/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Create store
export const createStore = async (storeData) => {
  try {
    const response = await apiClient.post('/stores', storeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update store
export const updateStore = async (id, storeData) => {
  try {
    const response = await apiClient.put(`/stores/${id}`, storeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get store products
export const getStoreProducts = async (id, filters = {}) => {
  try {
    const response = await apiClient.get(`/stores/${id}/products`, { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Upload a verification document (national ID, business licence, tax ID, bank statement).
export const uploadDocuments = async (file, type, docNumber) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    if (docNumber) formData.append('doc_number', docNumber);

    const response = await apiClient.post('/stores/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: sellers awaiting verification, with their paperwork.
export const getSellersForReview = async () => {
  try {
    const response = await apiClient.get('/stores/verification/sellers');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Admin: approve or reject a seller.
export const reviewSeller = async (sellerId, status, note) => {
  try {
    const response = await apiClient.patch(`/stores/verification/sellers/${sellerId}`, { status, note });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get seller documents
export const getDocuments = async () => {
  try {
    const response = await apiClient.get('/stores/documents/list');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
