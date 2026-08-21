import ProductModel from '../models/ProductModel.js';

export class ProductService {
  async listProducts() {
    return ProductModel.getAll();
  }

  async getProductById(id) {
    return ProductModel.findById(id);
  }

  async createProduct(payload) {
    const result = await ProductModel.create({
      seller_id: payload.seller_id,
      name: payload.name,
      description: payload.description,
      price: payload.price,
      stock: payload.stock || 0,
      image_url: payload.image_url || '',
    });

    return result;
  }

  async updateProduct(id, payload) {
    return ProductModel.updateById(id, payload);
  }

  async deleteProduct(id) {
    return ProductModel.deleteById(id);
  }

  async listSellerProducts(sellerId) {
    return ProductModel.getBySeller(sellerId);
  }
}

export default new ProductService();
