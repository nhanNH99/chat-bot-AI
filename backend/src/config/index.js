require("dotenv").config({ path: __dirname + "/.env" });

const config = {
  // Server
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: parseInt(process.env.PORT) || 8080,

  // OpenAI
  OPENAI: {
    API_KEY: process.env.OPENAI_API_KEY || "sk-huX9DUcEp3kw0HVBcWH4_A",
    BASE_URL:
      process.env.OPENAI_BASE_URL ||
      "https://aiportalapi.stu-platform.live/jpe",
    MODEL: process.env.OPENAI_MODEL || "gpt-4o-mini",
    EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || "text-embedding-3-small",
    EMBEDDING_API_KEY:
      process.env.EMBEDDING_API_KEY ||
      process.env.OPENAI_API_KEY ||
      "sk-huX9DUcEp3kw0HVBcWH4_A",
  },

  // RAG
  RAG: {
    SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.7,
    MAX_RESULTS: parseInt(process.env.MAX_RESULTS) || 3,
  },

  // Logging
  LOGGING: {
    LEVEL: process.env.LOG_LEVEL || "info",
    FILE: process.env.LOG_FILE || "logs/app.log",
  },

  // CORS
  CORS: {
    ORIGINS:
      process.env.NODE_ENV === "production"
        ? ["https://chat-bot-ai-be.onrender.com"]
        : ["http://localhost:3000", "http://localhost:3001"],
  },
};

module.exports = config;
