const { handleError } = require('../utils/errorHandler.cjs');

// Function to create a new session
function createSession(req, res) {
  try {
    // If 'userId' is provided in the request body, associate it with the session
    if (req.body.userId) {
      req.session.userId = req.body.userId;
    }

    res.status(201).json({ message: 'Session created' }); // Use status 201 for resource creation
  } catch (error) {
    handleError(res, { statusCode: 400, message: 'Bad Request' }); // Use a 400 status code for invalid input
  }
}

// Function to retrieve a specific session
function retrieveSession(req, res) {
  try {
    const { sessionId } = req.session;
    const sessionData = sessionManager.getSession(sessionId);

    if (typeof sessionData !== 'undefined') {
      res.json({ sessionId, sessionData });
    } else {
      handleError(res, { statusCode: 404, message: 'Session not found' }); // Use a 404 status code for resource not found
    }
  } catch (error) {
    handleError(res, { statusCode: 500, message: 'Internal server error' });
  }
}

// Function to end or delete a session (log out)
function endSession(req, res) {
  try {
    if (req.session) {
      req.session.destroy((error) => {
        if (error) {
          handleError(res, { statusCode: 500, message: 'Internal server error' });
        } else {
          res.json({ message: 'Session ended' });
        }
      });
    } else {
      handleError(res, { statusCode: 404, message: 'Session not found' });
    }
  } catch (error) {
    handleError(res, { statusCode: 500, message: 'Internal server error' });
  }
}

module.exports = {
  retrieveSession, endSession, createSession,
};
