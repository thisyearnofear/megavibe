const express = require('express');
const cors = require('cors'); // Import the cors middleware

function configureMiddleware(app) {
  app.use(cors());
}

function createExpressApp() {
  const app = express();
  app.use(express.json());
  configureMiddleware(app);
  return app; // return the app object
}

module.exports = createExpressApp();