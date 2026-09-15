// Complaints, and the moderation decisions that follow them.

import Report from '../models/Report.js';

// File a complaint against another party on an order.
export const createReport = async (req, res) => {
  try {
    const { order_id, reported_role, reported_id, reason, details } = req.body;
    const result = await Report.create({
      user_id: req.user.id,
      reporter_role: req.user.role,
      order_id,
      reported_role,
      reported_id,
      reason,
      details,
    });
    res.status(201).json({ message: 'Report submitted. An admin will review it.', ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

// Who else was on this order, so the UI can offer the right people to report.
export const getReportableParties = async (req, res) => {
  try {
    const parties = await Report.partiesOnOrder(req.params.orderId);
    if (!parties) return res.status(404).json({ error: 'Order not found' });
    res.json(parties);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// The signed-in user's own standing — drives the SUSPENDED notice.
export const getMyStanding = async (req, res) => {
  try {
    const standing = await Report.statusFor(req.user.role, req.user.id);
    res.json(standing || { suspended: false });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: every party with open complaints, worst first.
export const getReportSummary = async (req, res) => {
  try {
    res.json(await Report.summary());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: the individual complaints against one party, so a decision is made on what was
// actually said rather than on a count.
export const getReportsAgainst = async (req, res) => {
  try {
    res.json(await Report.listAgainst(req.params.role, req.params.id));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Admin: suspend or reinstate.
export const setAccountStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const result = await Report.setAccountStatus({
      role: req.params.role,
      id: req.params.id,
      status,
      reason,
    });
    res.json({ message: `Account ${result.status}`, ...result });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
