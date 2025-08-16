const express = require("express");
const cors = require("cors");
const helmet = require("helmet");

const config = require("./config");
const logger = require("./utils/logger");
const ragService = require("./services/ragService");
const routes = require("./routes");
const {
  createRateLimiter,
  requestLogger,
  errorHandler,
  notFoundHandler,
} = require("./middleware");

class Server {
  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // Disable CSP for API
        crossOriginEmbedderPolicy: false,
      })
    );

    // CORS
    this.app.use(
      cors({
        origin: config.CORS.ORIGINS,
        credentials: true,
        optionsSuccessStatus: 200,
      })
    );

    // Rate limiting
    this.app.use("/api", createRateLimiter(15 * 60 * 1000, 100)); // 100 requests per 15 minutes
    this.app.use("/api/chat", createRateLimiter(5 * 60 * 1000, 20)); // 20 chat requests per 5 minutes

    // Body parsing
    this.app.use(express.json({ limit: "10mb" }));
    this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

    // Request logging
    this.app.use(requestLogger);
  }

  setupRoutes() {
    // API routes
    this.app.use("/api", routes);

    // Root endpoint
    this.app.get("/", (req, res) => {
      res.json({
        name: "English Learning Chatbot API",
        version: "1.0.0",
        status: "running",
        documentation: "Visit /api/info for API information",
      });
    });
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use(notFoundHandler);

    // Global error handler
    this.app.use(errorHandler);
  }

  async start() {
    try {
      // Initialize RAG service
      logger.info("Starting server initialization...");
      await ragService.initialize();

      // Start HTTP server
      this.server = this.app.listen(config.PORT, () => {
        logger.info(`🚀 Server running on port ${config.PORT}`);
        logger.info(`📚 RAG service initialized: ${ragService.isInitialized}`);
        logger.info(`🌍 Environment: ${config.NODE_ENV}`);
        logger.info(
          `🔗 Health check: http://localhost:${config.PORT}/api/health`
        );
        logger.info(`📖 API info: http://localhost:${config.PORT}/api/info`);
      });

      // Graceful shutdown handling
      process.on("SIGTERM", () => this.shutdown("SIGTERM"));
      process.on("SIGINT", () => this.shutdown("SIGINT"));
    } catch (error) {
      logger.error("❌ Failed to start server:", error);
      process.exit(1);
    }
  }

  async shutdown(signal) {
    logger.info(`🛑 Received ${signal}, shutting down gracefully...`);

    if (this.server) {
      this.server.close(() => {
        logger.info("✅ HTTP server closed");
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        logger.error(
          "❌ Could not close connections in time, forcefully shutting down"
        );
        process.exit(1);
      }, 10000);
    } else {
      process.exit(0);
    }
  }
}

// Start server if this file is run directly
if (require.main === module) {
  const server = new Server();
  server.start();
}

module.exports = Server;
