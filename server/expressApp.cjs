const express = require('express');
const cors = require('cors');
const sessionRoutes = require('./routes/sessionRoutes.cjs'); // Require your session routes

function configureMiddleware(app) {
  app.use(cors());
}

function createExpressApp() {
  const app = express();
  app.use(express.json());
  configureMiddleware(app);

  // Register your session routes
  app.use('/', sessionRoutes);

  return app;
}

module.exports = createExpressApp();
