const ragService = require("../services/ragService");
const {
  SupportBotService,
  LearningBotService,
} = require("../services/botServices");
const logger = require("../utils/logger");

class ChatController {
  async chat(req, res) {
    try {
      const {
        message,
        conversationHistory = [],
        botType = "rag",
        mode = null,
      } = req.body;

      // Validate input
      if (
        !message ||
        typeof message !== "string" ||
        message.trim().length === 0
      ) {
        return res.status(400).json({
          error: "Message is required and must be a non-empty string",
          code: "INVALID_MESSAGE",
        });
      }

      if (message.length > 1000) {
        return res.status(400).json({
          error: "Message too long (max 1000 characters)",
          code: "MESSAGE_TOO_LONG",
        });
      }

      let result;

      // Route to appropriate bot service based on botType
      switch (botType) {
        case "support":
          result = await SupportBotService.processQuery(
            message.trim(),
            conversationHistory
          );
          break;
        case "learning":
          result = await LearningBotService.processQuery(
            message.trim(),
            conversationHistory
          );
          break;
        case "rag":
        default:
          // Pass mode to ragService for explicit routing
          result = await ragService.processQuery(
            message.trim(),
            conversationHistory,
            mode // Pass explicit mode from client
          );
          break;
      }

      // Log successful request
      logger.info("Chat request processed successfully", {
        botType,
        mode: result.mode,
        sourcesCount: result.sources.length,
        messageLength: message.length,
      });

      res.json(result);
    } catch (error) {
      logger.error("Error in chat endpoint:", error);

      res.status(500).json({
        error: "Internal server error",
        message:
          "Something went wrong while processing your message. Please try again.",
        code: "INTERNAL_ERROR",
      });
    }
  }

  async health(req, res) {
    try {
      const health = {
        status: "healthy",
        ragInitialized: ragService.isInitialized,
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        version: process.env.npm_package_version || "1.0.0",
        availableBots: ["rag", "support", "learning"],
      };

      res.json(health);
    } catch (error) {
      logger.error("Health check failed:", error);
      res.status(500).json({
        status: "unhealthy",
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}

module.exports = new ChatController();
