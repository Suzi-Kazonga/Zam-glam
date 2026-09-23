import apiClient from './axios';

// Seller ratings now live in the database, so a rating one customer leaves is visible to
// every other shopper — previously each browser only ever saw its own.

// Public: a shop's score and its reviews.
export const getSellerReviews = async (sellerId) => {
  try {
    const response = await apiClient.get(`/reviews/seller/${sellerId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// The signed-in seller's own reviews.
export const getMyReviews = async () => {
  try {
    const response = await apiClient.get('/reviews/mine');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

// What this customer has already rated.
export const getMyRatings = async () => {
  try {
    const response = await apiClient.get('/reviews/mine/customer');
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const rateSeller = async ({ sellerId, orderId, rating, comment }) => {
  try {
    const response = await apiClient.post('/reviews', {
      seller_id: sellerId,
      order_id: orderId,
      rating,
      comment,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};

export const replyToReview = async (reviewId, reply) => {
  try {
    const response = await apiClient.post(`/reviews/${reviewId}/reply`, { reply });
    return response.data;
  } catch (error) {
    throw error.response?.data || error.message;
  }
};
