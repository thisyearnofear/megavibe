// server/services/sessionManager.cjs
const { store } = require('../middleware/sessionMiddleware.cjs'); // Import the store object

// Define session manager object
const sessionManager = {
  // Get an existing session
  getSession(sessionId) {
    return new Promise((resolve, reject) => {
      store.get(sessionId, (error, session) => {
        if (error) {
          console.error('Error retrieving session from MongoDB:', error);

          // You can return a specific error message here
          return reject('Failed to retrieve session');
        }
        resolve(session);
      });
    })
      .catch(error => {
        console.error('Error in getSession:', error);
        throw error;
      });
  },

  // Delete a session
  endSession(sessionId) {
    return new Promise((resolve, reject) => {
      store.destroy(sessionId, (error) => {
        if (error) {
          console.error('Error deleting session from MongoDB:', error);

          // You can return a specific error message here
          return reject('Failed to delete session');
        }
        resolve();
      });
    });
  }
};

// Export session manager object
module.exports = sessionManager;
