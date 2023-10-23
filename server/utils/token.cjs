const dotenv = require('dotenv');
require('dotenv').config({ path: './server/.env' });

const jwt = require('jsonwebtoken');
const secretKey = process.env.JWT_SECRET 

if (!secretKey) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

function generateToken(userId) {
  const payload = { userId };
  const options = { expiresIn: '1h' }; // Token expiration time

  return jwt.sign(payload, secretKey, options);
}

module.exports = {
  generateToken,
};
