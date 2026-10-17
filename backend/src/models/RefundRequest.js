import { pool } from '../config/db.js';
import { resolveCustomerId, resolveSellerId, sameDatabaseId } from '../utils/accounts.js';

const PROFILE_RESOLVERS = {
  customer: resolveCustomerId,
  seller: resolveSellerId,
};

function errorWithStatus(message, status) {
  return Object.assign(new Error(message), { status });
}

async function profileIdFor(role, userId) {
  const resolver = PROFILE_RESOLVERS[role];
  if (!resolver) throw errorWithStatus('This account cannot access refund requests', 403);
  const profileId = await resolver(userId);
  if (!profileId) throw errorWithStatus('Your account could not be resolved', 404);
  return profileId;
}

async function shipmentContext(shipmentId) {
  const [rows] = await pool.query(
    `SELECT sh.id AS shipment_id, sh.order_id, sh.seller_id, sh.status AS shipment_status,
            o.customer_id, c.name AS customer_name, s.shop_name AS seller_name
     FROM shipments sh
     JOIN orders o ON o.id = sh.order_id
     JOIN customers c ON c.id = o.customer_id
     JOIN sellers s ON s.id = sh.seller_id
     WHERE sh.id = ?`,
    [shipmentId],
  );
  return rows[0] || null;
}

async function requestSummary(id) {
  const [rows] = await pool.query(
    `SELECT rr.id, rr.order_id, rr.shipment_id, rr.customer_id, rr.seller_id,
            rr.reason, rr.details, rr.status, rr.seller_recommendation, rr.seller_note,
            rr.admin_decision_note, rr.created_at, rr.updated_at,
            c.name AS customer_name, s.shop_name AS seller_name
     FROM refund_requests rr
     JOIN customers c ON c.id = rr.customer_id
     JOIN sellers s ON s.id = rr.seller_id
     WHERE rr.id = ?`,
    [id],
  );
  return rows[0] || null;
}

async function requestDetails(id) {
  const refund = await requestSummary(id);
  if (!refund) return null;
  const [messages] = await pool.query(
    `SELECT m.id, m.sender_role, m.sender_id, m.body, m.created_at,
            CASE WHEN m.sender_role = 'customer' THEN c.name ELSE s.shop_name END AS sender_name
     FROM refund_messages m
     LEFT JOIN customers c ON m.sender_role = 'customer' AND c.id = m.sender_id
     LEFT JOIN sellers s ON m.sender_role = 'seller' AND s.id = m.sender_id
     WHERE m.refund_request_id = ?
     ORDER BY m.created_at, m.id`,
    [id],
  );
  return { ...refund, messages };
}

function assertParticipant(refund, role, profileId) {
  const ownsCase = role === 'customer'
    ? sameDatabaseId(refund.customer_id, profileId)
    : role === 'seller' && sameDatabaseId(refund.seller_id, profileId);
  if (!ownsCase) throw errorWithStatus('You cannot access this refund request', 403);
}

class RefundRequest {
  static async create({ userId, shipmentId, reason, details }) {
    const customerId = await profileIdFor('customer', userId);
    const shipment = await shipmentContext(shipmentId);
    if (!shipment) throw errorWithStatus('Parcel not found', 404);
    if (!sameDatabaseId(shipment.customer_id, customerId)) {
      throw errorWithStatus('You can only request a refund for your own order', 403);
    }
    if (shipment.shipment_status !== 'delivered') {
      throw errorWithStatus('A refund request can be opened after the parcel is delivered', 409);
    }

    const cleanReason = typeof reason === 'string' ? reason.trim() : '';
    const cleanDetails = typeof details === 'string' ? details.trim() : '';
    if (!cleanReason || cleanReason.length > 100) {
      throw errorWithStatus('Choose a reason of 100 characters or fewer', 400);
    }
    if (!cleanDetails || cleanDetails.length > 4000) {
      throw errorWithStatus('Explain the problem in 1 to 4000 characters', 400);
    }

    const connection = await pool.getConnection();
    let requestId;
    try {
      await connection.beginTransaction();
      const [result] = await connection.query(
        `INSERT INTO refund_requests
          (order_id, shipment_id, customer_id, seller_id, reason, details)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [shipment.order_id, shipment.shipment_id, customerId, shipment.seller_id, cleanReason, cleanDetails],
      );
      requestId = result.insertId;
      await connection.query(
        `INSERT INTO refund_messages (refund_request_id, sender_role, sender_id, body)
         VALUES (?, 'customer', ?, ?)`,
        [requestId, customerId, `${cleanReason}: ${cleanDetails}`],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      if (error.code === 'ER_DUP_ENTRY') {
        throw errorWithStatus('A refund request has already been opened for this parcel', 409);
      }
      throw error;
    } finally {
      connection.release();
    }

    return requestDetails(requestId);
  }

  static async getForShipment({ userId, role, shipmentId }) {
    const shipment = await shipmentContext(shipmentId);
    if (!shipment) throw errorWithStatus('Parcel not found', 404);

    if (role !== 'admin') {
      const profileId = await profileIdFor(role, userId);
      const isCustomer = role === 'customer' && sameDatabaseId(shipment.customer_id, profileId);
      const isSeller = role === 'seller' && sameDatabaseId(shipment.seller_id, profileId);
      if (!isCustomer && !isSeller) throw errorWithStatus('You cannot access this parcel', 403);
    }

    const [rows] = await pool.query(
      'SELECT id FROM refund_requests WHERE shipment_id = ?',
      [shipmentId],
    );
    return rows[0] ? requestDetails(rows[0].id) : null;
  }

  static async getById({ userId, role, id }) {
    const refund = await requestSummary(id);
    if (!refund) throw errorWithStatus('Refund request not found', 404);
    if (role !== 'admin') {
      const profileId = await profileIdFor(role, userId);
      assertParticipant(refund, role, profileId);
    }
    return requestDetails(id);
  }

  static async listFor({ userId, role }) {
    const column = role === 'customer' ? 'customer_id' : role === 'seller' ? 'seller_id' : null;
    if (!column) throw errorWithStatus('Only customers and sellers can view their refund requests', 403);
    const profileId = await profileIdFor(role, userId);
    const [rows] = await pool.query(
      `SELECT rr.id, rr.order_id, rr.shipment_id, rr.reason, rr.details, rr.status,
              rr.seller_recommendation, rr.seller_note, rr.admin_decision_note,
              rr.created_at, rr.updated_at, c.name AS customer_name, s.shop_name AS seller_name
       FROM refund_requests rr
       JOIN customers c ON c.id = rr.customer_id
       JOIN sellers s ON s.id = rr.seller_id
       WHERE rr.${column} = ?
       ORDER BY rr.updated_at DESC, rr.id DESC`,
      [profileId],
    );
    return rows;
  }

  static async listAll() {
    const [rows] = await pool.query(
      `SELECT rr.id, rr.order_id, rr.shipment_id, rr.reason, rr.details, rr.status,
              rr.seller_recommendation, rr.seller_note, rr.admin_decision_note,
              rr.created_at, rr.updated_at, c.name AS customer_name, s.shop_name AS seller_name
       FROM refund_requests rr
       JOIN customers c ON c.id = rr.customer_id
       JOIN sellers s ON s.id = rr.seller_id
       ORDER BY FIELD(rr.status, 'admin_review', 'seller_review', 'approved', 'rejected'),
                rr.updated_at DESC, rr.id DESC`,
    );
    return rows;
  }

  static async addMessage({ userId, role, id, body }) {
    if (!['customer', 'seller'].includes(role)) {
      throw errorWithStatus('Only the customer and seller may join this conversation', 403);
    }
    const profileId = await profileIdFor(role, userId);
    const cleanBody = typeof body === 'string' ? body.trim() : '';
    if (!cleanBody || cleanBody.length > 4000) {
      throw errorWithStatus('Message must contain 1 to 4000 characters', 400);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        'SELECT id, customer_id, seller_id, status FROM refund_requests WHERE id = ? FOR UPDATE',
        [id],
      );
      const refund = rows[0];
      if (!refund) throw errorWithStatus('Refund request not found', 404);
      assertParticipant(refund, role, profileId);
      if (!['seller_review', 'admin_review'].includes(refund.status)) {
        throw errorWithStatus('This refund discussion is closed', 409);
      }
      await connection.query(
        'INSERT INTO refund_messages (refund_request_id, sender_role, sender_id, body) VALUES (?, ?, ?, ?)',
        [id, role, profileId, cleanBody],
      );
      await connection.query('UPDATE refund_requests SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return requestDetails(id);
  }

  static async recommend({ userId, id, recommendation, note }) {
    const sellerId = await profileIdFor('seller', userId);
    const cleanNote = typeof note === 'string' ? note.trim() : '';
    if (!['approve', 'reject'].includes(recommendation) || !cleanNote || cleanNote.length > 4000) {
      throw errorWithStatus('Choose a recommendation and provide a note of 1 to 4000 characters', 400);
    }

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const [rows] = await connection.query(
        'SELECT id, seller_id, status FROM refund_requests WHERE id = ? FOR UPDATE',
        [id],
      );
      const refund = rows[0];
      if (!refund) throw errorWithStatus('Refund request not found', 404);
      assertParticipant(refund, 'seller', sellerId);
      if (refund.status !== 'seller_review') {
        throw errorWithStatus('This request has already been sent for admin review', 409);
      }
      await connection.query(
        `UPDATE refund_requests
         SET seller_recommendation = ?, seller_note = ?, status = 'admin_review',
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [recommendation, cleanNote, id],
      );
      await connection.query(
        `INSERT INTO refund_messages (refund_request_id, sender_role, sender_id, body)
         VALUES (?, 'seller', ?, ?)`,
        [id, sellerId, `Seller recommends ${recommendation === 'approve' ? 'approving' : 'declining'} the refund: ${cleanNote}`],
      );
      await connection.commit();
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

    return requestDetails(id);
  }

  static async decide({ id, decision, note }) {
    const cleanNote = typeof note === 'string' ? note.trim() : '';
    if (!['approved', 'rejected'].includes(decision) || !cleanNote || cleanNote.length > 4000) {
      throw errorWithStatus('Choose approve or reject and provide a decision note of 1 to 4000 characters', 400);
    }

    const [result] = await pool.query(
      `UPDATE refund_requests
       SET status = ?, admin_decision_note = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND status = 'admin_review'`,
      [decision, cleanNote, id],
    );
    if (!result.affectedRows) {
      const refund = await requestSummary(id);
      if (!refund) throw errorWithStatus('Refund request not found', 404);
      throw errorWithStatus('The seller must submit a recommendation before the final decision', 409);
    }
    return requestDetails(id);
  }
}

export default RefundRequest;
