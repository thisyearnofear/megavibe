// loadEnvVars.cjs
const {
  setupEnvironmentVariablesForTesting,
} = require("./backend/server/test/setEnvVars.cjs");

const dotenv = require("dotenv");

setupEnvironmentVariablesForTesting();
