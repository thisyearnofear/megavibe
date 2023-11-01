require('dotenv').config();

const express = require('express');
const session = require('express-session');
const app = express();

// Modularize configuration
const { sessionConfig } = require('./config/sessionconfig.cjs');
const { securityConfig } = require('./config/securityconfig.cjs');

// Routes
const healthRoute = require('./routes/health.cjs');
const usersRoute = require('./routes/users.cjs');
const paymentsRoute = require('./routes/paymentsRoutes.cjs');
const reactionRoute = require('./routes/reactionRoutes.cjs');
const Waitlist = require('./models/Waitlist');


// Controllers
const { getUserProfile } = require('./controllers/usersController.cjs');

// Middleware
const { requestLogger } = require('./middleware/loggerMiddleware.cjs');
const { validateUser } = require('./middleware/validationMiddleware.cjs');

// Static assets
app.use(express.static('public'));

// Session middleware
app.use(session(sessionConfig));

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Security
if (process.env.NODE_ENV === 'production') {
  app.use(securityConfig);
}

// Error handling middleware
app.use((err, req, res, next) => {
  // Handle errors here
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// Define routes
app.get('/', healthRoute);
app.get('/users/:id', validateUser, getUserProfile);
app.use('/users', usersRoute);
app.use('/payments', paymentsRoute);
app.use('/reactions', reactionRoute);

app.post('/submit', async function (req, res) {
  const { name, email, link } = req.body;

  try {
    const newEntry = new Waitlist({ name, email, link });
    await newEntry.save();

    res.send('Form submitted!');
  } catch (err) {
    console.error(err);
    res.status(500).send('Internal server error');
  }
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});