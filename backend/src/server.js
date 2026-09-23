import dotenv from 'dotenv';
import app from './app.js';
import { initializeDatabase, testConnection } from './config/db.js';
import Order from './models/Order.js';
import Admin from './models/Admin.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;

// A parcel nobody picks up would otherwise sit in the pool forever, so anything still
// unclaimed after the threshold is assigned to the least-loaded courier on duty.
const ESCALATION_MINUTES = Number(process.env.PICKUP_ESCALATION_MINUTES) || 60;
const ESCALATION_SWEEP_MS = Number(process.env.PICKUP_ESCALATION_SWEEP_MS) || 5 * 60 * 1000;

function startPickupEscalation() {
  const sweep = async () => {
    try {
      const purged = await Admin.purgeExpired();
      purged.forEach((item) => console.log(`🗑  Grace period expired: ${item.role} ${item.id} permanently removed`));
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
