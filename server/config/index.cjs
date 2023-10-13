// config/index.js

module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/yourdb',
  sessionDatabaseURI: process.env.SESSION_MONGO_URI || 'mongodb://localhost:27017/sessionsdb', // Add a default URI
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'your-secret-key',
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || 'your-session-secret',
};
