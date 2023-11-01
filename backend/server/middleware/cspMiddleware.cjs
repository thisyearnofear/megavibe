const helmet = require('helmet');

const cspConfig = {
  directives: {
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'http://localhost:3000'],
    styleSrc: ["'self'"],
    imgSrc: ["'self'"],
    connectSrc: ["'self'"],
    fontSrc: ["'self'"],
  },
};

const cspMiddleware = helmet.contentSecurityPolicy(cspConfig);

module.exports = cspMiddleware;
