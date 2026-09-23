// A standalone delivery quote, from one point on the map to another.
//
// This is NOT how orders are priced. An order's delivery cost is worked out in
// models/Order.js using services/courierProvider.js, which measures between the shop's town
// and the customer's address. This route exists for a caller that already has coordinates
// — a map picker, or another service asking what a trip would cost.

import express from 'express';
import axios from 'axios';

const router = express.Router();

// Distance in kilometres between two points on the globe, allowing for its curve.
// The 6371 is the Earth's radius in kilometres.
const haversine = (a, b) => {
  const toRad = (value) => value * Math.PI / 180;
  const latitude = toRad(b.lat - a.lat);
  const longitude = toRad(b.lng - a.lng);
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(longitude / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(value));
};

// POST /api/delivery/quote — what would it cost to carry something from here to there?
//
// If Yango credentials are configured, their answer is passed straight back. Otherwise
// Zamglam's own riders quote it: a base fee plus a rate per kilometre.
router.post('/quote', async (req, res, next) => {
  try {
    const { pickup, dropoff } = req.body;
    if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) return res.status(400).json({ error: 'pickup and dropoff coordinates are required' });

    // Both variables must be set before an outside provider is used at all, so a
    // half-configured deployment never silently stops quoting.
    if (process.env.YANGO_API_URL && process.env.YANGO_API_KEY) {
      const response = await axios.post(`${process.env.YANGO_API_URL}/quote`, req.body, { headers: { Authorization: `Bearer ${process.env.YANGO_API_KEY}` } });
      return res.json(response.data);
    }

    const distance = haversine(pickup, dropoff);
    res.json({ distance_km: Number(distance.toFixed(2)), total_price: Number((20 + distance * 5).toFixed(2)), currency: 'ZMW', eta: `${Math.max(20, Math.ceil(distance * 4))}-${Math.max(35, Math.ceil(distance * 6))} min`, provider: 'Zamglam Courier' });
  } catch (error) { next(error); }
});

// A placeholder. Where a parcel has actually got to comes from the order endpoints, which
// know about parcels and who is carrying them; this answers only so an older caller does
// not get a 404.
router.get('/status/:id', async (req, res) => res.json({ id: req.params.id, status: 'pending', message: 'Courier status is being prepared' }));

export default router;
