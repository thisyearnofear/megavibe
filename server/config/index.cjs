// config/index.js

module.exports = {
    mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/yourdb',
    stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'your-secret-key',
    port: process.env.PORT || 3000,
  };
  