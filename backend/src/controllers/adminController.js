// The admin console. Every figure and every list here is read from the database, and
// every action writes to it.
//
// The console used to be backed by a hardcoded list in the browser, so its counts were
// invented and its Delete button changed nothing about the real account.

import Admin from '../models/Admin.js';

// Which groups of accounts may be listed. Anything else is a typo or somebody guessing at
// URLs, and is refused rather than turned into SQL.
const VALID_ROLES = ['customers', 'sellers', 'couriers'];

// The dashboard figures: how many of each kind of account exist, how many registrations
// are waiting for a decision, and how much has happened on the platform.
export const getStats = async (req, res) => {
  try {
    res.json(await Admin.stats());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// One endpoint for each group of subscribers, so clicking a figure on the dashboard can
// open the people behind it.
export const getUsers = async (req, res) => {
  try {
    const { role } = req.params;
    if (!VALID_ROLES.includes(role)) {
      return res.status(400).json({ error: `role must be one of ${VALID_ROLES.join(', ')}` });
    }
    res.json(await Admin[role]());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Shops awaiting verification and courier sign-ups awaiting approval.
export const getPendingRegistrations = async (req, res) => {
  try {
    res.json(await Admin.pendingRegistrations());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Letting a new courier start work, or turning them away.
//
// Couriers carry other people’s parcels, so a sign-up waits here until somebody decides.
// Rejecting one also takes them off duty immediately.
export const reviewCourier = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ error: 'status must be approved, rejected or pending' });
    }
    const updated = await Admin.setCourierApproval(req.params.id, status);
    if (!updated) return res.status(404).json({ error: 'Courier not found' });
    res.json({ message: `Courier ${status}`, courier_id: Number(req.params.id), status });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Deleting is reversible for a grace period; the row stays, greyed out, until it expires.
export const deleteAccount = async (req, res) => {
  try {
    res.json({ message: 'Account deleted. It can be restored during the grace period.', ...(await Admin.softDelete(req.params.role, req.params.id)) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const restoreAccount = async (req, res) => {
  try {
    res.json({ message: 'Account restored', ...(await Admin.restore(req.params.role, req.params.id)) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};

export const editAccount = async (req, res) => {
  try {
    res.json({ message: 'Account updated', ...(await Admin.updateAccount(req.params.role, req.params.id, req.body)) });
  } catch (error) {
    res.status(error.status || 500).json({ error: error.message });
  }
};
