// testSetup.cjs

const dotenv = require('dotenv');

const { MongoMemoryServer } = require('mongodb-memory-server');

module.exports = {

  startMongoServer: async () => {

    const mongoServer = new MongoMemoryServer();

    await mongoServer.start(); // Start the server

    const mongoUri = await mongoServer.getUri(); 

    process.env.SESSION_MONGO_URI = mongoUri;

    return mongoServer;

  },
  
  stopMongoServer: async (mongoServer) => {
    await mongoServer.stop();
  }
}