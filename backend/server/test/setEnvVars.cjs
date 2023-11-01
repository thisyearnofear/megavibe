//test/setEnvVars.cjs

const setupEnvironmentVariablesForTesting = () => {
    const dotenv = require('dotenv');
    const path = require('path');
    const envPath = process.env.NODE_ENV === 'test' ? path.join(__dirname, '../../.env.test') : path.join(__dirname, '../../.env');
    return dotenv.config({ path: envPath });
}
  
module.exports = { setupEnvironmentVariablesForTesting };