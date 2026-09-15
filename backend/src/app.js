import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
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
import { apiLimiter } from './middleware/rateLimit.js';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

// The Express application, with nothing that binds a port or starts a timer. server.js
// listens with it; the tests drive the very same routes through supertest, so what they
// check is the application itself rather than a copy of its rules.
const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Behind a proxy the client address arrives in X-Forwarded-For; without this the rate
// limiter would count every visitor as the proxy and lock everyone out together.
app.set('trust proxy', 1);
app.use(helmet());
// Any origin by default, which is what the phone-on-the-same-Wi-Fi setup needs. A
// deployment can pin it: CORS_ORIGIN accepts one origin or a comma-separated list.
// docker-compose.yml sets this, and it used to have no effect at all.
const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors(allowedOrigins.length ? { origin: allowedOrigins, credentials: true } : undefined));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));
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

export default app;
