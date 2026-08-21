import Product from '../models/Product.js';
import { pool } from '../config/db.js';

// Create product
export const createProduct = async (req, res) => {
  try {
    const { store_id, category_id, name, description, price, stock, image_url, audience, sizes } =
      req.body;
    const uploadedImageUrl = req.file ? `/uploads/${req.file.filename}` : image_url;
    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    const seller = sellerRows[0];

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    const productId = await Product.create({
      seller_id: seller.id,
      store_id,
      category_id,
      name,
      description,
      price,
      stock,
      image_url: uploadedImageUrl,
      audience,
      sizes,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: { id: productId, seller_id: seller.id, name, price },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get product by ID
export const getProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get filtered products (audience + category)
export const getFilteredProducts = async (req, res) => {
  try {
    const { store_id, audience, category_id } = req.query;

    const products = await Product.getFiltered({
      store_id: store_id ? parseInt(store_id) : null,
      audience,
      category_id: category_id ? parseInt(category_id) : null,
    });

    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get seller's products
export const getSellerProducts = async (req, res) => {
  try {
    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    const seller = sellerRows[0];

    if (!seller) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    const products = await Product.findByStore(seller.id);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update product
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows[0] || product.seller_id !== sellerRows[0].id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const success = await Product.update(id, req.body);

    if (success) {
      res.json({ message: 'Product updated successfully' });
    } else {
      res.status(400).json({ error: 'Failed to update product' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete product
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const [sellerRows] = await pool.query('SELECT id FROM sellers WHERE user_id = ?', [req.user.id]);
    if (!sellerRows[0] || product.seller_id !== sellerRows[0].id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const success = await Product.delete(id);

    if (success) {
      res.json({ message: 'Product deleted successfully' });
    } else {
      res.status(400).json({ error: 'Failed to delete product' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
