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

// Upload documents
export const uploadDocuments = async (file, type) => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post('/stores/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
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
