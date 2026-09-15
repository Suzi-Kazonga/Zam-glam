// Products: the catalogue shoppers browse, and a shop’s own listings.

import apiClient from './axios';

// Get filtered products
export const getFilteredProducts = async (filters = {}) => {
  try {
    const response = await apiClient.get('/products', { params: filters });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get product by ID
export const getProduct = async (id) => {
  try {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const getCart = async () => {
  try {
    const response = await apiClient.get('/cart');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Product photos must reach the server as real files: a base64 preview does not fit the
// image_url column, and a listing with no usable photo is rejected by the API.
function toProductPayload({ imageFiles = [], ...fields }) {
  if (!imageFiles.length) return fields;
  const formData = new FormData();
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    // Skip data-URL previews; the files themselves are appended below.
    if (key === 'image_url' && String(value).startsWith('data:')) return;
    if (key === 'images' || key === 'previews') return;
    formData.append(key, value);
  });
  imageFiles.forEach((file) => formData.append('images', file));
  return formData;
}

// Create product
export const createProduct = async (productData) => {
  try {
    const response = await apiClient.post('/products', toProductPayload(productData));
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await apiClient.put(`/products/${id}`, toProductPayload(productData));
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Delete product
export const deleteProduct = async (id) => {
  try {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get seller's products
export const getSellerProducts = async () => {
  try {
    const response = await apiClient.get('/products/seller/my-products');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
