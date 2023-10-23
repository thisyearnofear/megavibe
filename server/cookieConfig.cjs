// server/cookieConfig.cjs

const defaultCookieOptions = {
    secure: true, // Set to true when running over HTTPS
    httpOnly: true, // Prevent client-side JavaScript from accessing the cookie
    maxAge: 604800000, // Set a reasonable expiration time (in milliseconds)
  };
  
  module.exports = defaultCookieOptions;
  