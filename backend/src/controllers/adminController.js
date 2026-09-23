import Admin from '../models/Admin.js';

const VALID_ROLES = ['customers', 'sellers', 'couriers'];

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
