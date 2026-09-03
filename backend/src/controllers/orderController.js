import Order from '../models/Order.js';

// Create an order from the customer's cart
export const createOrder = async (req, res) => {
  try {
    const { items, address, location, phone, paymentMethod } = req.body;
    const orderId = await Order.createForCustomer({
      user_id: req.user.id,
      items,
      address,
      location,
      phone,
      paymentMethod,
    });
    res.status(201).json({ id: orderId, status: 'placed' });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// List the current user's orders (their own orders for a customer, their store's orders for a seller)
export const getMyOrders = async (req, res) => {
  try {
    const orders = req.user.role === 'seller'
      ? await Order.findBySellerUserId(req.user.id)
      : await Order.findByCustomerUserId(req.user.id);
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get a single order's detail (owning customer, a seller with a line in it, or admin)
export const getOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findDetailById(id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const isAdmin = req.user.role === 'admin';
    const isOwningCustomer = req.user.role === 'customer' && await Order.customerOwnsOrder(id, req.user.id);
    const isInvolvedSeller = req.user.role === 'seller' && await Order.sellerOwnsOrder(id, req.user.id);
    if (!isAdmin && !isOwningCustomer && !isInvolvedSeller) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (isInvolvedSeller) {
      // A seller only sees their own line items within a (possibly multi-seller) order.
      const sellerId = await Order.resolveSellerId(req.user.id);
      order.items = order.items.filter((item) => item.seller_id === sellerId);
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an order's status: a seller may only advance orders containing their own products;
// a customer may only mark their own order delivered (e.g. "Mark as received"); admin can do either.
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const isAdmin = req.user.role === 'admin';
    const isInvolvedSeller = req.user.role === 'seller' && await Order.sellerOwnsOrder(id, req.user.id);
    const isOwningCustomerMarkingDelivered = req.user.role === 'customer' && status === 'delivered' && await Order.customerOwnsOrder(id, req.user.id);

    if (!isAdmin && !isInvolvedSeller && !isOwningCustomerMarkingDelivered) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    const updated = await Order.updateStatus(id, status);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
