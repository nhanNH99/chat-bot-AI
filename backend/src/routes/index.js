const express = require("express");
const chatController = require("../controllers/chatController");

const router = express.Router();

// Chat endpoint
router.post("/chat", chatController.chat);

// Health check endpoint
router.get("/health", chatController.health);

// API info endpoint
router.get("/info", (req, res) => {
  res.json({
    name: "English Learning Chatbot API",
    version: "1.0.0",
    description: "RAG-powered chatbot for English learning support",
    endpoints: {
      "POST /api/chat": "Main chat endpoint",
      "GET /api/health": "Health check",
      "GET /api/info": "API information",
    },
    documentation: "See README.md for detailed API documentation",
  });
});

module.exports = router;
