import express from 'express';
import axios from 'axios';

const router = express.Router();
const haversine = (a, b) => {
  const toRad = (value) => value * Math.PI / 180;
  const latitude = toRad(b.lat - a.lat);
  const longitude = toRad(b.lng - a.lng);
  const value = Math.sin(latitude / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(longitude / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(value));
};

router.post('/quote', async (req, res, next) => {
  try {
    const { pickup, dropoff } = req.body;
    if (!pickup?.lat || !pickup?.lng || !dropoff?.lat || !dropoff?.lng) return res.status(400).json({ error: 'pickup and dropoff coordinates are required' });
    if (process.env.YANGO_API_URL && process.env.YANGO_API_KEY) {
      const response = await axios.post(`${process.env.YANGO_API_URL}/quote`, req.body, { headers: { Authorization: `Bearer ${process.env.YANGO_API_KEY}` } });
      return res.json(response.data);
    }
    const distance = haversine(pickup, dropoff);
    res.json({ distance_km: Number(distance.toFixed(2)), total_price: Number((20 + distance * 5).toFixed(2)), currency: 'ZMW', eta: `${Math.max(20, Math.ceil(distance * 4))}-${Math.max(35, Math.ceil(distance * 6))} min`, provider: 'Zamglam Courier' });
  } catch (error) { next(error); }
});

router.get('/status/:id', async (req, res) => res.json({ id: req.params.id, status: 'pending', message: 'Courier status is being prepared' }));

export default router;
