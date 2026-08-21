import orderService from '../services/OrderService.js';

export class OrderController {
  async create(req, res, next) {
    try {
      const order = await orderService.placeOrder({
        ...req.body,
        customer_id: req.user.id,
      });
      res.status(201).json({ message: 'Order placed.', order });
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const orders = await orderService.getCustomerOrders(req.user.id);
      res.json(orders);
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const updated = await orderService.updateStatus(req.params.id, req.body.status);
      res.json({ message: 'Order status updated.', updated });
    } catch (error) {
      next(error);
    }
  }
}

export default new OrderController();
