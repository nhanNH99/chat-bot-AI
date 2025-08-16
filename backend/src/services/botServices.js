// Separate chatbots for different purposes
const { ChatOpenAI } = require("@langchain/openai");
const config = require("../config");
const logger = require("../utils/logger");

class SupportBotService {
  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.OPENAI.API_KEY,
      modelName: config.OPENAI.MODEL,
      configuration: {
        baseURL: config.OPENAI.BASE_URL,
      },
    });
  }

  async processQuery(query, conversationHistory = []) {
    try {
      logger.info(`Processing support query: ${query}`);

      const supportMessages = [
        {
          role: "system",
          content: `You are a helpful customer support assistant for an English learning platform.
Your role is to:
- Help with technical issues and troubleshooting
- Provide information about subscription plans and pricing
- Assist with account-related questions
- Guide users through platform features
- Handle billing and payment inquiries

Be professional, helpful, and always try to resolve the user's issue.
If you cannot resolve something, direct them to human support.`,
        },
        ...conversationHistory.slice(-5).map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
        { role: "user", content: query },
      ];

      const completion = await this.llm.invoke(supportMessages);

      return {
        success: true,
        response: completion.content,
        mode: "Support Mode",
        type: "support",
        sources: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error processing support query:", error);
      return {
        success: false,
        error: "Failed to process support query",
        mode: "Support Error",
        type: "support",
        sources: [],
        timestamp: new Date().toISOString(),
      };
    }
  }
}

class LearningBotService {
  constructor() {
    this.llm = new ChatOpenAI({
      openAIApiKey: config.OPENAI.API_KEY,
      modelName: config.OPENAI.MODEL,
      configuration: {
        baseURL: config.OPENAI.BASE_URL,
      },
    });
  }

  async processQuery(query, conversationHistory = []) {
    try {
      logger.info(`Processing learning query: ${query}`);

      const learningMessages = [
        {
          role: "system",
          content: `You are an expert English learning tutor and conversation partner.
Your role is to:
- Help students practice English conversation
- Correct grammar mistakes gently and educationally
- Explain English grammar rules and concepts
- Provide pronunciation guidance
- Suggest learning strategies and tips
- Encourage and motivate learners

Be friendly, patient, and educational. Focus on helping the student improve their English skills.`,
        },
        ...conversationHistory.slice(-5).map((msg) => ({
          role: msg.sender === "user" ? "user" : "assistant",
          content: msg.text,
        })),
        { role: "user", content: query },
      ];

      const completion = await this.llm.invoke(learningMessages);

      return {
        success: true,
        response: completion.content,
        mode: "Learning Mode",
        type: "learning",
        sources: [],
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      logger.error("Error processing learning query:", error);
      return {
        success: false,
        error: "Failed to process learning query",
        mode: "Learning Error",
        type: "learning",
        sources: [],
        timestamp: new Date().toISOString(),
      };
    }
  }
}

module.exports = {
  SupportBotService: new SupportBotService(),
  LearningBotService: new LearningBotService(),
};
