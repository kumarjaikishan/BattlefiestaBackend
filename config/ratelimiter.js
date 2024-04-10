const rateLimit = require('express-rate-limit')

const limiter = rateLimit({
  windowMs: 1000 * 60 * 15, // 15 minutes
  limit: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes).
  standardHeaders: "draft-7", // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
  // store: ... , // Use an external store for consistency across multiple server instances.
  message: "Too many requests from this IP, please try again later",
  handler: (req, res, next, options) => {
    return next({ status: 429, message: "Too Many Request, try after sometime" });
  },

});

module.exports = limiter