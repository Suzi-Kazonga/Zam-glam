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
    let orders;
    if (req.user.role === 'seller') orders = await Order.findBySellerUserId(req.user.id);
    else if (req.user.role === 'courier') orders = await Order.findByCourierUserId(req.user.id);
    else orders = await Order.findByCustomerUserId(req.user.id);

    // The courier always sees their own assignment; everyone else only after pickup.
    if (req.user.role !== 'courier') orders = orders.map(Order.withCourierContactVisibility);
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
    const isAssignedCourier = req.user.role === 'courier' && await Order.courierOwnsOrder(id, req.user.id);
    if (!isAdmin && !isOwningCustomer && !isInvolvedSeller && !isAssignedCourier) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (isInvolvedSeller) {
      // A seller only sees their own line items within a (possibly multi-seller) order.
      const sellerId = await Order.resolveSellerId(req.user.id);
      order.items = order.items.filter((item) => item.seller_id === sellerId);
    }

    // The courier always sees their own assignment; everyone else only after pickup.
    res.json(req.user.role === 'courier' ? order : Order.withCourierContactVisibility(order));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update ONE parcel (shipment) within an order. Each store's parcel moves independently,
// so one shop packing or handing over never changes another shop's parcel. Delivery stays
// the courier's call alone.
export const updateShipmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const isAdmin = req.user.role === 'admin';

    if (status === 'delivered') {
      const isAssignedCourier = req.user.role === 'courier' && await Order.courierOwnsShipment(id, req.user.id);
      if (!isAdmin && !isAssignedCourier) {
        return res.status(403).json({ error: 'Only the assigned courier can mark a parcel delivered' });
      }
    } else {
      const isOwningSeller = req.user.role === 'seller' && await Order.sellerOwnsShipment(id, req.user.id);
      if (!isAdmin && !isOwningSeller) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const result = await Order.updateShipmentStatus(id, status);
    if (!result) return res.status(404).json({ error: 'Parcel not found' });
    res.json({ message: 'Parcel status updated', ...result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an order's status. Delivery is the courier's call alone: only the courier assigned
// to the parcel (or an admin) may mark it delivered. A seller moves it through their own
// stages up to handing it over ('shipped') but can never declare it delivered, and a
// customer cannot change status at all.
export const updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowedStatuses = ['placed', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });

    const isAdmin = req.user.role === 'admin';

    if (status === 'delivered') {
      const isAssignedCourier = req.user.role === 'courier' && await Order.courierOwnsOrder(id, req.user.id);
      if (!isAdmin && !isAssignedCourier) {
        return res.status(403).json({ error: 'Only the assigned courier can mark a parcel delivered' });
      }
    } else {
      const isInvolvedSeller = req.user.role === 'seller' && await Order.sellerOwnsOrder(id, req.user.id);
      if (!isAdmin && !isInvolvedSeller) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const updated = await Order.updateStatus(id, status);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json({ message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
