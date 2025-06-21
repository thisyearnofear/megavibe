// token.cjs
const jwt = require("jsonwebtoken");

if (!process.env.JWT_SECRET) {
  throw new Error("JWT_SECRET environment variable is not set");
}

function generateToken(userId) {
  const payload = { userId };
  const options = { expiresIn: "1h" }; // Token expiration time

  return jwt.sign(payload, process.env.JWT_SECRET, options); // Use the secret from the environment variables
}

module.exports = {
  generateToken,
};
