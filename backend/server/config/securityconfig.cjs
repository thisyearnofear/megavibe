// securityConfig.cjs

const helmet = require('helmet');

const securityConfig = (app) => {
  app.use(helmet());
  // Add other security-related middleware or settings here.
};

module.exports = securityConfig;
