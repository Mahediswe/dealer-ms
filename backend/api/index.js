import { createApp } from '../src/app.js';

// Vercel treats this file's default export as a request handler. An Express
// app is itself a valid (req, res) handler, so we can export it directly —
// no .listen() call needed or wanted here.
const app = createApp();

export default app;
