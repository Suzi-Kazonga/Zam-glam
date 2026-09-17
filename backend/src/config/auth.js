import dotenv from 'dotenv';

dotenv.config();

// Local setup may not have a backend/.env yet. Keep sign-in usable in development,
// while production deployments should always provide their own JWT_SECRET.
export const JWT_SECRET = process.env.JWT_SECRET || 'zamglam-development-secret-change-me';