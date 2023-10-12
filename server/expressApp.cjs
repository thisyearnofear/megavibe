const express = require('express');
const app = express(); // create app instance

const cors = require('cors');

app.use(express.json());

function configureMiddleware(app) {
  app.use(cors());

}

// Route handler
app.get('/', (req, res) => {
  res.send('Hello World!'); 
});

function createExpressApp() {
  const app = express();
  configureMiddleware(app);
  return app;
}

module.exports = app;
