// The last stop for anything that goes wrong.
//
// Express recognises a middleware with four arguments as an error handler, and sends
// anything thrown — or passed to next(error) — here. It is registered last in app.js, so
// it catches whatever the routes before it did not.
//
// Its job is to make sure a failure leaves as a tidy JSON answer with a sensible status
// code, rather than an HTML stack trace or a request that hangs.
export const errorHandler = (err, req, res, next) => {
  // Logged for whoever is watching the server; the client is told far less.
  console.error('Error:', err.message);

  // Something the caller sent was wrong.
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: err.message });
  }

  // They are not signed in, or their token was not accepted.
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Anything else. Models attach a `status` to errors they raise deliberately (404 for a
  // missing parcel, 409 for one already claimed), and that is used when present. A genuine
  // unexpected fault has no status, and becomes a 500.
  return res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
  });
};
