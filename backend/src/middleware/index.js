const logger = require("../utils/logger");

// Simple rate limiting middleware (no external dependency)
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!requests.has(key)) {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);
    // Clean old requests
    const recentRequests = userRequests.filter((time) => now - time < windowMs);

    if (recentRequests.length >= max) {
      logger.warn("Rate limit exceeded", { ip: req.ip, path: req.path });
      return res.status(429).json({
        error: "Too many requests",
        message: "You have exceeded the rate limit. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
      });
    }

    recentRequests.push(now);
    requests.set(key, recentRequests);
    next();
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    logger.info("HTTP Request", {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get("User-Agent"),
    });
  });

  next();
};

// Error handling middleware
const errorHandler = (error, req, res, next) => {
  logger.error("Unhandled error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).json({
    error: "Internal server error",
    message: "Something went wrong. Please try again later.",
    code: "INTERNAL_ERROR",
  });
};

// 404 handler
const notFoundHandler = (req, res) => {
  logger.warn("404 Not Found", {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });

  res.status(404).json({
    error: "Not found",
    message: `The requested resource ${req.method} ${req.path} was not found.`,
    code: "NOT_FOUND",
  });
};

module.exports = {
  createRateLimiter,
  requestLogger,
  errorHandler,
  notFoundHandler,
};
