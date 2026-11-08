/**
 * Vercel serverless entry — mounts the Express API.
 * SPA assets are served from Vite `dist/` via vercel.json; only `/api/*` hits this function.
 */
import app from '../server.js';

export default app;
