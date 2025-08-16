const winston = require("winston");
const path = require("path");
const config = require("../config");

// Create logs directory if it doesn't exist
const fs = require("fs");
const logsDir = path.dirname(config.LOGGING.FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: config.LOGGING.LEVEL,
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: "english-chatbot-backend" },
  transports: [
    // Write to all logs with level `info` and below to combined.log
    new winston.transports.File({
      filename: config.LOGGING.FILE,
      level: "info",
    }),
    // Write all logs error (and below) to error.log
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
    }),
  ],
});

// If we're not in production, log to console as well
if (config.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple(),
        winston.format.printf(
          ({ timestamp, level, message, service, ...meta }) => {
            return `${timestamp} [${service}] ${level}: ${message} ${
              Object.keys(meta).length ? JSON.stringify(meta, null, 2) : ""
            }`;
          }
        )
      ),
    })
  );
}

module.exports = logger;
