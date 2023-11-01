const cors = require('cors');

const corsOptions = {
  origin: '*', // Allow requests from any origin during development
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
