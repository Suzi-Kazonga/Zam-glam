import Review from '../models/Review.js';
import { resolveSellerId, resolveCustomerId } from '../utils/accounts.js';

// A shop's ratings, public so shoppers can judge a seller before buying.
export const getSellerReviews = async (req, res) => {
  try {
    const sellerId = Number(req.params.sellerId);
    const [reviews, score] = await Promise.all([
      Review.findBySeller(sellerId),
      Review.scoreForSeller(sellerId),
    ]);
    res.json({ ...score, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// The signed-in seller's own ratings, for their dashboard.
export const getMyReviews = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });
    const [reviews, score] = await Promise.all([
      Review.findBySeller(sellerId),
      Review.scoreForSeller(sellerId),
    ]);
    res.json({ ...score, reviews });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// What this customer has already rated, so the UI knows which orders still need a rating.
export const getMyRatings = async (req, res) => {
  try {
    const customerId = await resolveCustomerId(req.user.id);
    if (!customerId) return res.status(404).json({ error: 'Customer profile not found' });
    res.json(await Review.findByCustomer(customerId));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    if (req.user.role !== 'customer') return res.status(403).json({ error: 'Only customers can rate shops' });
    const { seller_id, order_id, rating, comment } = req.body;
    const score = await Review.upsert({ user_id: req.user.id, seller_id, order_id, rating, comment });
    res.status(201).json({ message: 'Thanks for rating this shop', ...score });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const replyToReview = async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'Only the shop can reply' });
    const { reply } = req.body;
    if (!reply?.trim()) return res.status(400).json({ error: 'Reply cannot be empty' });
    await Review.reply({ user_id: req.user.id, review_id: req.params.id, reply: reply.trim() });
    res.json({ message: 'Reply posted' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
