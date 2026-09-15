// Signing up, signing in, and signing out.
//
// The token and the signed-in person are kept in the browser’s storage so a refresh does
// not sign anybody out. axios.js attaches the token to every request after this.

import apiClient from './axios';

// Register user
export const register = async (name, email, password, role = 'customer', profileData = {}) => {
  try {
    const response = await apiClient.post('/auth/signup', {
      name,
      email,
      password,
      role,
      address: profileData.address || '',
      phone: profileData.phone || '',
      location: profileData.location || '',
      city: profileData.location || '',
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Login user
export const login = async (email, password) => {
  try {
    const response = await apiClient.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const response = await apiClient.get('/auth/me');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// Logout
export const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
};
