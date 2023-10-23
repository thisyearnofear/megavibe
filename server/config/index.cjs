// config/index.cjs

// Function to check if an environment variable is defined
function checkEnvVariable(variableName) {
  if (typeof process.env[variableName] === 'undefined') {
    throw new Error(`Environment variable ${variableName} is not defined.`);
  }
}

// Check and set the environment variables
checkEnvVariable('MONGO_URI');
checkEnvVariable('SESSION_MONGO_URI');
checkEnvVariable('STRIPE_SECRET_KEY');
checkEnvVariable('PORT');

// Set a default value for SESSION_SECRET
const defaultSessionSecret = 'your-default-session-secret';

module.exports = {
  mongoURI: process.env.MONGO_URI || 'mongodb://localhost:27017/yourdb',
  sessionDatabaseURI: process.env.SESSION_MONGO_URI || 'mongodb://localhost:27017/sessionsdb',
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || 'your-secret-key',
  port: process.env.PORT || 3000,
  sessionSecret: process.env.SESSION_SECRET || defaultSessionSecret,
};
