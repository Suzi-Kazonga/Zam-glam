import express from 'express';
import * as storeController from '../controllers/storeController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// Public routes
router.get('/', storeController.getAllStores);
// Must precede '/:id', or Express matches "mine" as a store id.
router.get('/mine', authMiddleware, roleMiddleware('seller'), storeController.getMyStore);
router.get('/:id', storeController.getStore);
router.get('/:id/products', storeController.getStoreProducts);

// Seller routes (protected)
router.post('/', authMiddleware, roleMiddleware('seller'), storeController.createStore);
router.put('/:id', authMiddleware, roleMiddleware('seller'), storeController.updateStore);

// Vendor verification: sellers submit paperwork, admins review it.
router.post('/documents/upload', authMiddleware, roleMiddleware('seller'), upload.single('file'), storeController.uploadDocuments);
router.get('/documents/list', authMiddleware, roleMiddleware('seller'), storeController.getDocuments);
router.get('/verification/sellers', authMiddleware, roleMiddleware('admin'), storeController.getSellersForReview);
router.patch('/verification/sellers/:id', authMiddleware, roleMiddleware('admin'), storeController.reviewSeller);

export default router;
