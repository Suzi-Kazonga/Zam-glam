import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { initializeDatabase, testConnection } from './config/db.js';
import { errorHandler } from './middleware/error.js';
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import storeRoutes from './routes/storeRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import deliveryRoutes from './routes/deliveryRoutes.js';
import dealRoutes from './routes/dealRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import Order from './models/Order.js';
import { apiLimiter } from './middleware/rateLimit.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Behind a proxy the client address arrives in X-Forwarded-For; without this the rate
// limiter would count every visitor as the proxy and lock everyone out together.
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.get('/health', (req, res) => {
  res.json({ status: 'ok', database: process.env.DB_NAME || 'zamglam_db' });
});

app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/store', storeRoutes);
app.use('/api/stores', storeRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/delivery', deliveryRoutes);
app.use('/api/deals', dealRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reports', reportRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found.' });
});

app.use(errorHandler);

// A parcel nobody picks up would otherwise sit in the pool forever, so anything still
// unclaimed after the threshold is assigned to the least-loaded courier on duty.
const ESCALATION_MINUTES = Number(process.env.PICKUP_ESCALATION_MINUTES) || 60;
const ESCALATION_SWEEP_MS = Number(process.env.PICKUP_ESCALATION_SWEEP_MS) || 5 * 60 * 1000;

function startPickupEscalation() {
  const sweep = async () => {
    try {
      const escalated = await Order.escalateStaleParcels(ESCALATION_MINUTES);
      escalated.forEach((item) => {
        console.log(`↑ Parcel ${item.shipment_id} unclaimed for ${ESCALATION_MINUTES}m — assigned to ${item.courier_name}`);
      });
    } catch (error) {
      console.error('Pickup escalation sweep failed:', error.message);
    }
  };

  sweep();
  const timer = setInterval(sweep, ESCALATION_SWEEP_MS);
  timer.unref?.();
  console.log(`⏱  Pickup escalation: unclaimed parcels are assigned after ${ESCALATION_MINUTES} minutes`);
}

async function startServer() {
  try {
    await initializeDatabase();
    await testConnection();
    app.listen(PORT, () => {
      console.log(`Zamglam backend running on http://localhost:${PORT}`);
      startPickupEscalation();
    });
  } catch (error) {
    console.error('Database initialization failed:', error.message);
    process.exit(1);
  }
}

startServer();
