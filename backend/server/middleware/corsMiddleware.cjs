const cors = require('cors');

// Environment-based CORS configuration for hackathon demo
const allowedOrigins = [
  'http://localhost:5173',  // Vite dev server
  'http://localhost:3000',  // Alternative dev port
  'https://megavibe.vercel.app',  // Production domain
  'https://megavibe-frontend.vercel.app',  // Alternative production domain
  'https://localhost:5173',  // HTTPS dev
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,  // Allow cookies/sessions
  optionsSuccessStatus: 200,
};

const corsMiddleware = cors(corsOptions);

module.exports = corsMiddleware;
