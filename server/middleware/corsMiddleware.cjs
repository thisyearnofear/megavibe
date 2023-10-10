const cors = require('cors');

const corsOptions = {
  origin: '*', // Allow requests from any origin during development
  methods: 'GET, POST', // Adjust allowed HTTP methods as needed
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
