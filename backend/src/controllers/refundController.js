import RefundRequest from '../models/RefundRequest.js';

function handleError(res, error) {
  return res.status(error.status || 500).json({ error: error.message });
}

export const createRequest = async (req, res) => {
  try {
    const refund = await RefundRequest.create({
      userId: req.user.id,
      shipmentId: req.body.shipment_id,
      reason: req.body.reason,
      details: req.body.details,
    });
    res.status(201).json({ message: 'Refund request opened for seller review.', refund });
  } catch (error) {
    handleError(res, error);
  }
};

export const getForShipment = async (req, res) => {
  try {
    const refund = await RefundRequest.getForShipment({
      userId: req.user.id,
      role: req.user.role,
      shipmentId: req.params.shipmentId,
    });
    res.json({ refund });
  } catch (error) {
    handleError(res, error);
  }
};

export const getMyRequests = async (req, res) => {
  try {
    res.json(await RefundRequest.listFor({ userId: req.user.id, role: req.user.role }));
  } catch (error) {
    handleError(res, error);
  }
};

export const getRequest = async (req, res) => {
  try {
    res.json(await RefundRequest.getById({
      userId: req.user.id,
      role: req.user.role,
      id: req.params.id,
    }));
  } catch (error) {
    handleError(res, error);
  }
};

export const addMessage = async (req, res) => {
  try {
    res.json(await RefundRequest.addMessage({
      userId: req.user.id,
      role: req.user.role,
      id: req.params.id,
      body: req.body.body,
    }));
  } catch (error) {
    handleError(res, error);
  }
};

export const submitRecommendation = async (req, res) => {
  try {
    res.json(await RefundRequest.recommend({
      userId: req.user.id,
      id: req.params.id,
      recommendation: req.body.recommendation,
      note: req.body.note,
    }));
  } catch (error) {
    handleError(res, error);
  }
};

export const getAdminQueue = async (_req, res) => {
  try {
    res.json(await RefundRequest.listAll());
  } catch (error) {
    handleError(res, error);
  }
};

export const decide = async (req, res) => {
  try {
    const refund = await RefundRequest.decide({
      id: req.params.id,
      decision: req.body.decision,
      note: req.body.note,
    });
    res.json({ message: `Refund request ${refund.status}. No payment has been transferred.`, refund });
  } catch (error) {
    handleError(res, error);
  }
};
