import Store from '../models/Store.js';
import Document from '../models/Document.js';
import Seller, { VERIFICATION_STATUSES } from '../models/Seller.js';
import { resolveSellerId } from '../utils/accounts.js';

// The signed-in seller's own store. The frontend needs the real store id to know which
// storefront belongs to them — guessing it from the shop name sends new sellers to
// someone else's shop.
export const getMyStore = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });

    const store = await Store.findBySellerId(sellerId);
    if (!store) return res.status(404).json({ error: 'This seller has no store yet' });

    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create store
export const createStore = async (req, res) => {
  try {
    const { name, description, logo_url, location, open_hours } = req.body;
    const seller_id = await resolveSellerId(req.user.id);

    if (!seller_id) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    if (!name) {
      return res.status(400).json({ error: 'Store name is required' });
    }

    const storeId = await Store.create({
      seller_id,
      name,
      description,
      logo_url,
      location,
      open_hours,
    });

    res.status(201).json({
      message: 'Store created successfully',
      store: { id: storeId, seller_id, name, description, location },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get store by ID
export const getStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    res.json(store);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get all stores
export const getAllStores = async (req, res) => {
  try {
    const stores = await Store.getAll();
    res.json(stores);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get store products with filters
export const getStoreProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const { audience, category } = req.query;

    const products = await Store.getProducts(id, {
      audience,
      category: category ? parseInt(category) : null,
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const store = await Store.findById(id);

    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }

    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId || store.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const success = await Store.update(id, req.body);

    if (success) {
      res.json({ message: 'Store updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update store' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upload a verification document (national ID, business licence, tax ID, bank statement).
// Submitting puts the seller back into review.
export const uploadDocuments = async (req, res) => {
  try {
    const { type, doc_number } = req.body;
    const sellerId = await resolveSellerId(req.user.id);

    if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });
    if (!req.file || !type) {
      return res.status(400).json({ error: 'File and document type required' });
    }

    const url = `/uploads/${req.file.filename}`;
    const docId = await Document.create({ seller_id: sellerId, type, url, doc_number });

    // A rejected seller who submits fresh paperwork goes back into the pending queue.
    const seller = await Seller.findById(sellerId);
    if (seller?.verification_status === 'rejected') {
      await Seller.setVerificationStatus(sellerId, 'pending');
    }

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: { id: docId, type, url, status: 'pending' },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// The signed-in seller's own documents and verification status.
export const getDocuments = async (req, res) => {
  try {
    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });

    const [documents, seller] = await Promise.all([
      Document.findBySeller(sellerId),
      Seller.findById(sellerId),
    ]);

    res.json({
      verification_status: seller?.verification_status || 'pending',
      verified_at: seller?.verified_at || null,
      documents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: every seller with their verification state and paperwork.
export const getSellersForReview = async (req, res) => {
  try {
    const [sellers, documents] = await Promise.all([
      Seller.findAllForReview(),
      Document.findAllWithSellers(),
    ]);

    res.json(sellers.map((seller) => ({
      ...seller,
      documents: documents.filter((doc) => doc.seller_id === seller.id),
    })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: approve or reject a seller.
export const reviewSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    if (!VERIFICATION_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of ${VERIFICATION_STATUSES.join(', ')}` });
    }

    const seller = await Seller.findById(id);
    if (!seller) return res.status(404).json({ error: 'Seller not found' });

    await Seller.setVerificationStatus(id, status);

    // Mirror the decision onto the paperwork so the seller sees why.
    const documents = await Document.findBySeller(id);
    const docStatus = status === 'verified' ? 'approved' : status === 'rejected' ? 'rejected' : 'pending';
    await Promise.all(documents.map((doc) => Document.updateStatus(doc.id, docStatus, note)));

    res.json({ message: `Seller marked ${status}`, seller_id: Number(id), status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
