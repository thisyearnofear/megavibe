// controllers/sessionController.cjs

const { handleError } = require('../utils/errorHandler.cjs');

function saveSession(req, res) {

  return new Promise((resolve, reject) => {
    req.session.save(error => {
      if (error) {
        console.error('Error saving session:', error);
        reject(new Error('Session save error'));
      } else {
        console.log('Session saved successfully');
        resolve();
      }
    });
  });
}

async function createSession(req, res) {
  try {
    if (req.body && req.body.userId) {
      req.session.userId = req.body.userId;
      console.log('User id set in session');
    }

    await saveSession(req, res);
    console.log('Session saved successfully');
    // Set the cookie in the response headers
    res.setHeader('Set-Cookie', `sessionId=${req.session.id}; HttpOnly`);
    res.status(201).json({ message: 'Session created' });
  } catch (error) {
    console.log('Error caught in createSession:', error);
    if (error.message === 'Session save error') {
      handleError(res, error, { statusCode: 422, message: error.message });

    } else {
      handleError(res, error, { statusCode: 500, message: 'Unexpected error' });

    }
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
  retrieveSession, endSession, createSession, saveSession
};
