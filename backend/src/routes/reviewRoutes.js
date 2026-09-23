import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Specific paths before '/seller/:sellerId' so they are not read as an id.
router.get('/mine', authMiddleware, roleMiddleware('seller'), reviewController.getMyReviews);
router.get('/mine/customer', authMiddleware, roleMiddleware('customer'), reviewController.getMyRatings);
router.get('/seller/:sellerId', reviewController.getSellerReviews);

router.post('/', authMiddleware, reviewController.createReview);
router.post('/:id/reply', authMiddleware, reviewController.replyToReview);

export default router;
