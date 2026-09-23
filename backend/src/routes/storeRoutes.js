// Storefronts, and the paperwork that gets a shop verified.
//
// A shop has two parts: the SELLER, which is the account that signs in, and the STORE,
// which is the page shoppers visit. One seller has one store.

import express from 'express';
import * as storeController from '../controllers/storeController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';

const router = express.Router();

// --- Anybody can look at a shop ---------------------------------------------------
router.get('/', storeController.getAllStores);

// "Which store is mine?" — the signed-in shop's own storefront.
//
// This must come before '/:id', or Express would read the word "mine" as a store id. The
// frontend needs the real id: it used to guess the storefront from the shop's name, which
// sent every new shop to somebody else's page.
router.get('/mine', authMiddleware, roleMiddleware('seller'), storeController.getMyStore);

router.get('/:id', storeController.getStore);
router.get('/:id/products', storeController.getStoreProducts);

// --- A shop managing its own storefront -------------------------------------------
//
// The store's location matters beyond display: it is where a courier collects from, and
// what every delivery from this shop is priced against.
router.post('/', authMiddleware, roleMiddleware('seller'), storeController.createStore);
router.put('/:id', authMiddleware, roleMiddleware('seller'), storeController.updateStore);

// --- Verification -----------------------------------------------------------------
//
// A shop uploads its registration documents; an administrator checks them and decides.
// A verified shop carries a badge shoppers can see, which is the whole point of the
// exercise — it is the signal that somebody checked this business is real.
router.post('/documents/upload', authMiddleware, roleMiddleware('seller'), upload.single('file'), storeController.uploadDocuments);
router.get('/documents/list', authMiddleware, roleMiddleware('seller'), storeController.getDocuments);
router.get('/verification/sellers', authMiddleware, roleMiddleware('admin'), storeController.getSellersForReview);
router.patch('/verification/sellers/:id', authMiddleware, roleMiddleware('admin'), storeController.reviewSeller);

export default router;
