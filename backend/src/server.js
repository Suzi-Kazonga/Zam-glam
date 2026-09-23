// Starts the server.
//
// The application itself is built in app.js. This file does the two things that only a
// running server should do: listen on a port, and keep a timer going for the work that
// has to happen on its own — chasing parcels nobody has collected, and clearing out
// accounts whose restore window has passed.
//
// Keeping these apart is what lets the tests drive the real application without ever
// opening a port or starting a timer.

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

// Connect to the database, make sure the schema is up to date, then start listening.
//
// The order matters: if the database is not reachable the server exits instead of coming
// up and answering every request with an error.
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
