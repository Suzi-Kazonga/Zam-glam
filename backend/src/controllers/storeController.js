import Store from '../models/Store.js';
import Document from '../models/Document.js';
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

// Upload KYC documents
export const uploadDocuments = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user.id;

    if (!req.file || !type) {
      return res.status(400).json({ error: 'File and document type required' });
    }

    const url = `/uploads/${req.file.filename}`;

    const docId = await Document.create({
      user_id: userId,
      type,
      url,
    });

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: { id: docId, type, url, status: 'pending' },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seller documents
export const getDocuments = async (req, res) => {
  try {
    const userId = req.user.id;
    const documents = await Document.findByUser(userId);
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
