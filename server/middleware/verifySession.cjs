// middleware/verifySession.cjs

const uuidRegex = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

function verifySession(req, res, next) {
  const sessionId = req.headers.sessionid; // Change to lowercase for consistency

  if (!uuidRegex.test(sessionId)) {
    return res.status(401).send('Invalid session ID');
  }

  store.get(sessionId, (error, session) => {
    if (error) {
      console.error('Error retrieving session from MongoDB:', error);
      return res.status(500).send('Internal Server Error');
    }

    if (!session) {
      return res.status(401).send('Invalid session');
    }

    req.session = session;
    next();
  });
}

module.exports = verifySession;
