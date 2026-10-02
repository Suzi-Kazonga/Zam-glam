import StoreMessage from '../models/StoreMessage.js';
import { resolveCustomerId, resolveSellerId } from '../utils/accounts.js';

const validId = (value) => Number.isInteger(Number(value)) && Number(value) > 0;

async function resolveThreadAccess(req) {
  const storeId = Number(req.params.storeId);
  if (!validId(storeId)) return { error: 'Invalid conversation' };

  if (req.user.role === 'customer') {
    const ownerId = await resolveCustomerId(req.user.id);
    if (!ownerId) return { error: 'Customer profile not found', status: 404 };
    if (req.params.customerId && Number(req.params.customerId) !== ownerId) return { error: 'Forbidden', status: 403 };
    if (!(await StoreMessage.storeExists(storeId))) return { error: 'Store not found', status: 404 };
    const existingThread = await StoreMessage.hasThread(storeId, ownerId);
    if (!existingThread && !(await StoreMessage.storeIsOpen(storeId))) return { error: 'Store not found', status: 404 };
    return { storeId, customerId: ownerId, senderRole: 'customer', senderId: ownerId };
  }

  if (req.user.role === 'seller') {
    const customerId = Number(req.params.customerId);
    if (!validId(customerId)) return { error: 'Invalid conversation' };
    const sellerId = await resolveSellerId(req.user.id);
    if (!sellerId || !(await StoreMessage.sellerOwnsStore(sellerId, storeId))) return { error: 'Conversation not found', status: 404 };
    if (!(await StoreMessage.customerExists(customerId)) || !(await StoreMessage.hasThread(storeId, customerId))) {
      return { error: 'Conversation not found', status: 404 };
    }
    return { storeId, customerId, senderRole: 'seller', senderId: sellerId };
  }

  return { error: 'Forbidden', status: 403 };
}

export async function listThreads(req, res) {
  try {
    if (req.user.role === 'customer') {
      const customerId = await resolveCustomerId(req.user.id);
      if (!customerId) return res.status(404).json({ error: 'Customer profile not found' });
      return res.json(await StoreMessage.customerThreads(customerId));
    }
    if (req.user.role === 'seller') {
      const sellerId = await resolveSellerId(req.user.id);
      if (!sellerId) return res.status(404).json({ error: 'Seller profile not found' });
      return res.json(await StoreMessage.sellerThreads(sellerId));
    }
    return res.status(403).json({ error: 'Forbidden' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getThread(req, res) {
  try {
    const access = await resolveThreadAccess(req);
    if (access.error) return res.status(access.status || 400).json({ error: access.error });
    return res.json(await StoreMessage.getThread(access.storeId, access.customerId));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function sendMessage(req, res) {
  try {
    const access = await resolveThreadAccess(req);
    if (access.error) return res.status(access.status || 400).json({ error: access.error });
    const body = typeof req.body.body === 'string' ? req.body.body.trim() : '';
    if (!body || body.length > 2000) return res.status(400).json({ error: 'Message must be between 1 and 2000 characters' });

    const message = await StoreMessage.create({ ...access, body });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}