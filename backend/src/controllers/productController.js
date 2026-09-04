import Product from '../models/Product.js';
import { resolveSellerId, resolveStoreIdForSeller, resolveCategoryId } from '../utils/accounts.js';

// multer is mounted with .array('images'), but a single-file 'image' field is still
// accepted so older callers keep working.
function uploadedImagePaths(req) {
  let files = [];
  if (Array.isArray(req.files)) files = req.files;
  else if (req.files && typeof req.files === 'object') files = [...(req.files.images || []), ...(req.files.image || [])];
  else if (req.file) files = [req.file];
  return files.map((file) => `/uploads/${file.filename}`);
}

// Create product
export const createProduct = async (req, res) => {
  try {
    const { store_id, category_id, category, name, description, price, stock, image_url, audience, sizes } =
      req.body;
    const uploaded = uploadedImagePaths(req);
    const uploadedImageUrl = uploaded[0] || image_url;
    const sellerId = await resolveSellerId(req.user.id);

    if (!sellerId) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required' });
    }

    // Every listing needs a real picture: shoppers buy clothing on the photo, and a
    // base64 preview would blow past the image_url column.
    if (!uploaded.length) {
      return res.status(400).json({ error: 'At least one product image is required' });
    }

    // The form sends a category name and no store, so derive both server-side.
    const resolvedStoreId = store_id || await resolveStoreIdForSeller(sellerId);
    if (!resolvedStoreId) {
      return res.status(400).json({ error: 'This seller has no store yet' });
    }
    const resolvedCategoryId = category_id || await resolveCategoryId(category);

    const productId = await Product.create({
      seller_id: sellerId,
      store_id: resolvedStoreId,
      category_id: resolvedCategoryId,
      name,
      description,
      price,
      stock,
      image_url: uploadedImageUrl,
      audience,
      sizes,
      images: uploaded,
    });

    res.status(201).json({
      message: 'Product created successfully',
      product: { id: productId, seller_id: sellerId, name, price },
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
    const sellerId = await resolveSellerId(req.user.id);

    if (!sellerId) {
      return res.status(404).json({ error: 'Seller profile not found' });
    }

    const products = await Product.findByStore(sellerId);
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

    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId || product.seller_id !== sellerId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Replace the gallery only when new files were attached; otherwise keep what's stored,
    // so editing a price never silently drops the photos.
    const uploaded = uploadedImagePaths(req);
    const { category, ...rest } = req.body;
    const changes = { ...rest };
    if (uploaded.length) {
      changes.images = uploaded;
      changes.image_url = uploaded[0];
    } else {
      delete changes.images;
      if (typeof changes.image_url === 'string' && changes.image_url.startsWith('data:')) delete changes.image_url;
    }
    if (category && !changes.category_id) changes.category_id = await resolveCategoryId(category);

    const success = await Product.update(id, changes);

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

    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId || product.seller_id !== sellerId) {
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
