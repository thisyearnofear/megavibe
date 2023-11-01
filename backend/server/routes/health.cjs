const express = require('express');
const router = express.Router();
const fetch = require('node-fetch'); // Import fetch if not already imported

// Example external API check
async function checkApiHealth() {
  try {
    const res = await fetch('/health'); // Replace with the actual API URL
    if (res.status === 200) {
      return true;
    } else {
      throw new Error('API health check failed');
    }
  } catch (err) {
    throw err;
  }
}

// The main health route
router.get('/', async (req, res) => {
  let dbStatus, apiStatus;

  try {
    // Check database connection
    await checkDatabaseConnection();
    dbStatus = true;
  } catch (err) {
    dbStatus = false;
  }

  try {
    // Check API health
    await checkApiHealth();
    apiStatus = true;
  } catch (err) {
    apiStatus = false;
  }

  if (dbStatus && apiStatus) {
    return res.json({ status: 'healthy' });
  }

  res.status(500).json({
    status: 'unhealthy',
    message: 'One or more health checks failed',
  });
});

// Example DB check function
async function checkDatabaseConnection() {
  try {
    // Connect to the database
    // Replace with your MongoDB connection code
    const db = db.getCollection(collection); // Replace with the collection name
    // Perform a health check query
    const result = await db.find().limit(1); // Perform a simple query
    if (result.length > 0) {
      // The database is reachable and healthy
      return true;
    } else {
      throw new Error('Database health check failed');
    }
  } catch (err) {
    throw new Error('Database health check failed');
  }
}

module.exports = router;