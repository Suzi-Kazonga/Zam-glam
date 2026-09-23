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

// Price a basket before it is placed, so checkout can show the delivery cost per shop.
// Creates nothing; uses the same calculation as order creation.
export const quoteOrder = async (req, res) => {
  try {
    const { items, location } = req.body;
    const quote = await Order.quoteForItems({ items, location });
    res.json({
      parcels: quote.parcels.map((parcel) => ({
        store_name: parcel.store_name,
        items_total: parcel.items_total,
        delivery_fee: parcel.delivery_fee,
        distance: parcel.distance,
        item_count: parcel.items.reduce((sum, line) => sum + line.quantity, 0),
      })),
      items_total: quote.items_total,
      delivery_total: quote.delivery_total,
      total: quote.total,
    });
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
    if (req.user.role !== 'courier') orders = orders.map((order) => Order.withCourierContactVisibility(order, req.user.role));
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
      order.shipments = order.shipments.filter((shipment) => shipment.seller_id === sellerId);
    }

    if (isAssignedCourier) {
      // A courier sees only the parcels assigned to them — not the other shops' parcels
      // in the same order, and not another courier's work.
      const courierId = await Order.resolveCourierId(req.user.id);
      order.shipments = order.shipments.filter((shipment) => shipment.courier_id === courierId);
      const mineSellerIds = new Set(order.shipments.map((shipment) => shipment.seller_id));
      order.items = order.items.filter((item) => mineSellerIds.has(item.seller_id));
    }

    // The courier always sees their own assignment; everyone else only after pickup.
    res.json(req.user.role === 'courier' ? order : Order.withCourierContactVisibility(order, req.user.role));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Parcels a shop has released that no courier has claimed yet. Only couriers on duty see
// the pool — an off-duty courier gets an empty list rather than work they will not do.
export const getAvailableParcels = async (req, res) => {
  try {
    if (req.user.role === 'admin') return res.json(await Order.findAvailableForPickup());
    if (req.user.role !== 'courier') return res.status(403).json({ error: 'Forbidden' });

    const shift = await Order.getCourierShift(req.user.id);
    if (!shift?.on_shift) return res.json([]);

    res.json(await Order.findAvailableForPickup({ courier_user_id: req.user.id }));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: everything a shop has released but nobody has collected, with how long it has
// been waiting.
export const getUnclaimedParcels = async (req, res) => {
  try {
    res.json(await Order.findUnclaimed());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// A courier's duty state.
export const getShift = async (req, res) => {
  try {
    const shift = await Order.getCourierShift(req.user.id);
    if (!shift) return res.status(404).json({ error: 'Courier profile not found' });
    // carrying > 0 means they cannot clock off yet.
    const carrying = await Order.countCarriedParcels(shift.id);
    res.json({ on_shift: Boolean(shift.on_shift), shift_changed_at: shift.shift_changed_at, carrying });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const setShift = async (req, res) => {
  try {
    const result = await Order.setCourierShift(req.user.id, Boolean(req.body.on_shift));
    res.json(result);
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Handing a parcel over takes both sides: the courier asks for it, and the shop confirms
// they actually handed it to that person. Until then the courier's details stay hidden and
// the parcel is not considered collected.
export const requestPickupParcel = async (req, res) => {
  try {
    if (req.user.role !== 'courier') return res.status(403).json({ error: 'Only couriers can collect parcels' });
    const result = await Order.requestPickup(req.params.id, req.user.id);
    res.json({ message: 'Pickup requested. The shop needs to confirm the handover.', ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const confirmPickupParcel = async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'Only the shop can confirm a handover' });
    const result = await Order.confirmPickup(req.params.id, req.user.id);
    res.json({ message: 'Handover confirmed', ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// The shop says the courier never turned up: back into the pool for someone else.
export const denyPickupParcel = async (req, res) => {
  try {
    if (req.user.role !== 'seller') return res.status(403).json({ error: 'Only the shop can report a failed handover' });
    const result = await Order.denyPickup(req.params.id, req.user.id, req.body?.reason);
    res.json({ message: 'Parcel returned to the pool for another courier', ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
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
        return res.status(403).json({ error: 'Only the courier who picked up this parcel can mark it delivered' });
      }
      // Delivery only follows a real pickup — nothing can jump straight from the shop's
      // shelf to delivered.
      const shipment = await Order.findShipmentById(id);
      if (!shipment) return res.status(404).json({ error: 'Parcel not found' });
      if (shipment.status !== 'picked_up') {
        return res.status(409).json({ error: 'This parcel has not been picked up yet' });
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
    res.status(error.status || 500).json({ error: error.message });
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
    res.status(error.status || 500).json({ error: error.message });
  }
};
