import { useState, useEffect, useCallback } from "react";
import chatService from "../services/chatService";

const useChat = (botType = "rag", mode = null) => {
  const [messages, setMessages] = useState([]);
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  // Check connection function
  const checkConnection = useCallback(async () => {
    try {
      setError(null);
      await chatService.checkHealth();
      setIsConnected(true);
    } catch (error) {
      console.error("Connection check failed:", error);
      setIsConnected(false);
      setError("Unable to connect to the chat service");
    }
  }, []);

  // Initialize chat
  useEffect(() => {
    // Load messages from localStorage
    const loadMessages = () => {
      try {
        const savedMessages = localStorage.getItem("chatbot-messages");
        if (savedMessages) {
          const parsedMessages = JSON.parse(savedMessages);
          return parsedMessages.map((msg) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
            text: msg.text || "Empty message", // Ensure text is never undefined
          }));
        }
      } catch (error) {
        console.error("Error loading messages from localStorage:", error);
      }

      // Return default welcome message
      return [
        {
          id: 1,
          text: "Hello! I'm your English learning assistant. I can help you with:\n• Subscription plans and pricing\n• Learning roadmaps for different levels\n• Common English errors and grammar help\n• Technical support\n• English conversation practice\n\nHow can I help you today?",
          sender: "bot",
          mode: null,
          timestamp: new Date(),
        },
      ];
    };

    setMessages(loadMessages());
    checkConnection();
  }, [checkConnection]);

  // Save messages to localStorage whenever messages change
  useEffect(() => {
    try {
      localStorage.setItem("chatbot-messages", JSON.stringify(messages));
    } catch (error) {
      console.error("Error saving messages to localStorage:", error);
    }
  }, [messages]);

  // Send message function
  const sendMessage = useCallback(
    async (messageText) => {
      if (!messageText?.trim()) return;

      setIsTyping(true);
      setError(null);

      // Add user message
      const userMessage = {
        id: Date.now(),
        text: messageText.trim() || "Empty message",
        sender: "user",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Prepare conversation history (last 5 messages)
        const conversationHistory = messages.slice(-5).map((msg) => ({
          text: msg.text || "",
          sender: msg.sender,
        }));

        const response = await chatService.sendMessage(
          messageText,
          conversationHistory,
          botType,
          mode // Pass explicit mode
        );

        // Add bot response
        const botMessage = {
          id: Date.now() + 1,
          text: response.response || "No response received",
          sender: "bot",
          mode: response.mode || "Unknown",
          sources: response.sources || [],
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, botMessage]);
        setIsConnected(true);
      } catch (error) {
        console.error("Error sending message:", error);
        setError(error.message);
        setIsConnected(false);

        // Add error message
        const errorMessage = {
          id: Date.now() + 1,
          text: "Sorry, I'm having trouble connecting to the server. Please check your connection and try again.",
          sender: "bot",
          mode: "Error",
          isError: true,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, botType, mode]
  );

  // Send quick message function
  const sendQuickMessage = useCallback(
    (messageText) => {
      sendMessage(messageText);
    },
    [sendMessage]
  );

  // Clear conversation
  const clearConversation = useCallback(() => {
    setMessages([
      {
        id: 1,
        text: "Hello! I'm your English learning assistant. How can I help you today?",
        sender: "bot",
        mode: null,
        timestamp: new Date(),
      },
    ]);
    localStorage.removeItem("chatbot-messages");
  }, []);

  return {
    messages,
    isTyping,
    error,
    isConnected,
    sendMessage,
    sendQuickMessage,
    clearConversation,
    checkConnection,
  };
};

export default useChat;
