import axios from "axios";

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:8080";

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    console.log(
      `🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`
    );
    return config;
  },
  (error) => {
    console.error("❌ API Request Error:", error);
    return Promise.reject(error);
  }
);

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.url}`);
    return response;
  },
  (error) => {
    console.error(
      "❌ API Response Error:",
      error.response?.data || error.message
    );
    return Promise.reject(error);
  }
);

class ChatService {
  /**
   * Send a chat message to the backend
   * @param {string} message - The user's message
   * @param {Array} conversationHistory - Previous conversation messages
   * @param {string} botType - Type of bot ('rag', 'support', 'learning')
   * @param {string} mode - Explicit mode ('faq', 'practice') for rag bot
   * @returns {Promise} Response from the backend
   */
  async sendMessage(
    message,
    conversationHistory = [],
    botType = "rag",
    mode = null
  ) {
    try {
      const requestPayload = {
        message: message.trim(),
        conversationHistory: conversationHistory,
        botType: botType,
      };

      // Add mode for rag bot
      if (botType === "rag" && mode) {
        requestPayload.mode = mode;
      }

      const response = await apiClient.post("/api/chat", requestPayload);

      return response.data;
    } catch (error) {
      // Handle different types of errors
      if (error.response) {
        // Server responded with an error status
        throw new Error(error.response.data.message || "Server error occurred");
      } else if (error.request) {
        // Request was made but no response received
        throw new Error(
          "Unable to connect to the server. Please check your connection."
        );
      } else {
        // Something else happened
        throw new Error("An unexpected error occurred");
      }
    }
  }

  /**
   * Check the health of the API
   * @returns {Promise} Health status
   */
  async checkHealth() {
    try {
      const response = await apiClient.get("/api/health");
      return response.data;
    } catch (error) {
      throw new Error("Health check failed");
    }
  }

  /**
   * Get API information
   * @returns {Promise} API info
   */
  async getApiInfo() {
    try {
      const response = await apiClient.get("/api/info");
      return response.data;
    } catch (error) {
      throw new Error("Failed to get API info");
    }
  }
}

export default new ChatService();
