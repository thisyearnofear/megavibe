const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const { v4: uuidv4 } = require('uuid');

// Set up MongoDB connection using the .env variable
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Create a MongoDB session store
const store = new MongoDBStore({
  uri: process.env.MONGO_URI, // Use the same environment variable
  collection: 'sessions',
});

store.on('error', function (error) {
  console.error('MongoDB session store error:', error);
});

// Export the store variable for use in other files
module.exports = {
  store, // Export the store variable
  sessionMiddleware: async (req, res, next) => {
    // Get the sessionId from the request header
    const { sessionId } = req.headers;
    console.log('Request headers:', req.headers); // Log the request headers

    if (!sessionId) {
      console.log('No `sessionId` header provided, returning 401');
      // If no `sessionId` header is provided, return a 401 response
      return res.status(401).send('Invalid session');
    } else {
      try {
        // If a session ID is provided, retrieve the session from MongoDB
        const session = await new Promise((resolve, reject) => {
          store.get(sessionId, (error, session) => {
            if (error) {
              console.error('Error retrieving session from MongoDB:', error);
              return reject(error);
            }
            resolve(session);
          });
        });

        if (!session) {
          console.log('Session not found in MongoDB, returning 401');
          return res.status(401).send('Invalid session');
        }
        req.session = session;
        console.log('Session retrieved:', req.session);
      } catch (error) {
        // Handle any errors that occurred during session retrieval
        console.error('Error during session retrieval:', error);
        return res.status(500).send('Internal Server Error');
      }
    }
    next(); // Continue to the next middleware
  },
};
