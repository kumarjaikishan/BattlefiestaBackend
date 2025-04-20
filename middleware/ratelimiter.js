const rateLimit = require('express-rate-limit');

const createAccountLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 3, // Limit each IP to 5 requests per window
    message: {
      status: 429,
      message: 'Too many registration attempts. Please try again later .'
    }
  });

  module.exports = createAccountLimiter;