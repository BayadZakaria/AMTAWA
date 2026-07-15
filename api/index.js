// Vercel serverless function entrypoint
const { app } = require('../dist/server.cjs');
module.exports = app;
