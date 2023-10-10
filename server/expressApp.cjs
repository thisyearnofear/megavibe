const express = require('express');
const app = express(); // create app instance

const cors = require('cors');

function configureMiddleware(app) {
  app.use(cors());
  app.use(express.json());
}

function createExpressApp() {
  const app = express();
  configureMiddleware(app);
  return app;
}

module.exports = app;
