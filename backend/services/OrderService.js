import OrderModel from '../models/OrderModel.js';

export class OrderService {
  async placeOrder(payload) {
    const result = await OrderModel.createOrder({
      customer_id: payload.customer_id,
      product_id: payload.product_id,
      quantity: payload.quantity || 1,
      status: payload.status || 'pending',
    });

    return { id: result };
  }

  async getCustomerOrders(customerId) {
    return OrderModel.getByCustomer(customerId);
  }

  async updateStatus(orderId, status) {
    return OrderModel.updateById(orderId, { status });
  }
}

export default new OrderService();
