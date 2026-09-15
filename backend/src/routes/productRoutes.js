// Products — the catalogue shoppers browse, and the listings shops manage.

import express from 'express';
import * as productController from '../controllers/productController.js';
import { authMiddleware, roleMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { blockIfSuspended } from '../middleware/suspension.js';

const router = express.Router();

// Browsing is open to everybody, signed in or not — a shopper should be able to look
// before creating an account.
router.get('/', productController.getFilteredProducts);   // the catalogue, with filters
router.get('/:id', productController.getProduct);         // one product

// Photo handling for the two routes that accept them.
//
// A listing may carry up to six photos under 'images'. The single-file 'image' field is
// kept because older versions of the seller form sent that, and those callers still work.
const productImages = upload.fields([{ name: 'images', maxCount: 6 }, { name: 'image', maxCount: 1 }]);

// Managing listings. Three checks stack up before the handler runs: a valid token, a seller
// account, and an account that is not suspended. Ownership — that this seller owns *this*
// product — is checked inside the controller, since it needs the product.
router.post('/', authMiddleware, roleMiddleware('seller'), blockIfSuspended, productImages, productController.createProduct);
router.get('/seller/my-products', authMiddleware, roleMiddleware('seller'), productController.getSellerProducts);
router.put('/:id', authMiddleware, roleMiddleware('seller'), productImages, productController.updateProduct);
router.delete('/:id', authMiddleware, roleMiddleware('seller'), productController.deleteProduct);

export default router;
