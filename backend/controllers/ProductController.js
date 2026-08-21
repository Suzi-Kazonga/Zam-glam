import productService from '../services/ProductService.js';

export class ProductController {
  async list(req, res, next) {
    try {
      const products = await productService.listProducts();
      res.json(products);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await productService.getProductById(req.params.id);
      if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
      }
      return res.json(product);
    } catch (error) {
      return next(error);
    }
  }

  async create(req, res, next) {
    try {
      const payload = { ...req.body, seller_id: req.user.id };
      const result = await productService.createProduct(payload);
      res.status(201).json({ message: 'Product created.', result });
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const updated = await productService.updateProduct(req.params.id, req.body);
      res.json({ message: 'Product updated.', updated });
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      await productService.deleteProduct(req.params.id);
      res.json({ message: 'Product deleted.' });
    } catch (error) {
      next(error);
    }
  }

  async sellerProducts(req, res, next) {
    try {
      const products = await productService.listSellerProducts(req.user.id);
      res.json(products);
    } catch (error) {
      next(error);
    }
  }
}

export default new ProductController();
