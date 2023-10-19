const sessionManager = require('../services/sessionManager.cjs');

async function verifySession(req, res, next) {
  try {
    const session = await sessionManager.getSession(req.session.id);

    if (!session) {
      // Continue the request if there is no session
      return next();
    }

    req.session = session;
    next();
  } catch (error) {
    console.error('Error retrieving session from MongoDB:', error);
    return res.status(500).send('Internal Server Error');
  }
}

module.exports = verifySession;
