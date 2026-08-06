/**
 * Vercel serverless entrypoint for the Express app.
 * Vercel compiles this file, traces the import into dist/server/app.js
 * and serves every request through the Express app (SSR + static files).
 * The dist folder is produced by the "build" command before packaging.
 */
import app from "../dist/server/app.js";

export default app;
