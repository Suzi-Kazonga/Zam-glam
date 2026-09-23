import Report from '../models/Report.js';

// A suspended account can still sign in and read — that is how it sees the SUSPENDED
// notice explaining why — but it cannot act: no orders, no listings, no deliveries.
// Enforced here rather than only in the UI, so hiding a button is not the only thing
// standing between a suspended account and the action.
export async function blockIfSuspended(req, res, next) {
  try {
    if (!req.user || req.user.role === 'admin') return next();

    const standing = await Report.statusFor(req.user.role, req.user.id);
    if (standing?.suspended) {
      return res.status(403).json({
        error: 'Your account is suspended',
        suspended: true,
        reason: standing.reason || 'Repeated complaints',
        suspended_at: standing.suspended_at,
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}
