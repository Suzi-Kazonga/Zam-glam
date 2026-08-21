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

// Create product
export const createProduct = async (productData) => {
  try {
    const payload = productData.imageFile ? (() => {
      const formData = new FormData();
      Object.entries(productData).forEach(([key, value]) => { if (key !== 'imageFile') formData.append(key, value); });
      formData.append('image', productData.imageFile);
      return formData;
    })() : productData;
    const response = await apiClient.post('/products', payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Update product
export const updateProduct = async (id, productData) => {
  try {
    const response = await apiClient.put(`/products/${id}`, productData);
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
