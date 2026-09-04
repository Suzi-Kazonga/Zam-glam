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

// Document upload routes
router.post('/documents/upload', authMiddleware, upload.single('file'), storeController.uploadDocuments);
router.get('/documents/list', authMiddleware, storeController.getDocuments);

export default router;
