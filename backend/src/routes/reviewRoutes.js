// Ratings — what shoppers say about a shop after a delivery, and the shop's reply.
//
// Ratings used to be kept in the rater's own browser, so nobody else could see them and
// the score on a shop card was decorative. They are in the database now, which is why
// every route here goes through a controller rather than the browser.

import express from 'express';
import * as reviewController from '../controllers/reviewController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Reading ratings.
//
// The two '/mine' paths must be declared before '/seller/:sellerId', or Express would read
// the word "mine" as a seller id and look for a shop with that number.
router.get('/mine', authMiddleware, roleMiddleware('seller'), reviewController.getMyReviews);          // what people said about my shop
router.get('/mine/customer', authMiddleware, roleMiddleware('customer'), reviewController.getMyRatings); // what I have rated
router.get('/seller/:sellerId', reviewController.getSellerReviews);                                     // public: one shop's ratings

// Leaving a rating, and the shop answering it. Both need a signed-in account; the
// controller checks that the right kind of account is doing it.
router.post('/', authMiddleware, reviewController.createReview);
router.post('/:id/reply', authMiddleware, reviewController.replyToReview);

export default router;
