// loadEnvVars.cjs
const { setupEnvironmentVariablesForTesting } = require('./server/test/setEnvVars.cjs');

const dotenv = require('dotenv');

setupEnvironmentVariablesForTesting();

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'gabbadocious'; 
}