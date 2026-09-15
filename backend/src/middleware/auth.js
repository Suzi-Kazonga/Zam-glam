// Who is asking, and are they allowed?
//
// These two run before the handlers on every protected route. Between them they answer
// "is this a real signed-in account" and "is it the right kind of account".

import jwt from 'jsonwebtoken';

// Checks the sign-in token and remembers who it belongs to.
//
// The token arrives as "Authorization: Bearer <token>", so the value is split on the space
// and the second half taken. Verifying it proves two things at once: that we issued it,
// and that it has not been tampered with — the signature would no longer match.
//
// What it decodes (id, email, role) is put on req.user, which is how every handler after
// this knows who it is serving.
export const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    // Expired, tampered with, or signed with a different secret — all the same answer.
    // The browser treats this as "your session has ended" and asks the user to sign in.
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// Restricts a route to one kind of account.
//
// Called as roleMiddleware('admin'), it hands back a middleware for that role — so the
// same check can be written once and used on any route, for any role.
//
// It runs after authMiddleware, which is what puts req.user there in the first place.
export const roleMiddleware = (role) => (req, res, next) => {
  if (!req.user || req.user.role !== role) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
