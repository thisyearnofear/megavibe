// jest.setup.cjs

// Import dotenv
const dotenv = require('dotenv');

// Load the .env.test file
dotenv.config({ path: '.env.test' });

const mongoose = require('mongoose');
const app = require('./server/server.cjs');

const uri = process.env.SESSION_MONGO_URI;

async function connectDB() {
    try {
      if (mongoose.connection.readyState === 0) {
        await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        console.log('MongoDB connection established');
      }
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
    }
}

module.exports = async () => {
    await connectDB();
};