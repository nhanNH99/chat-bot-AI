import React, { useState, useRef, useEffect } from "react";
import {
  Send,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Trash2,
  Volume2,
  VolumeX,
  Settings,
  User,
  Bot,
  BookOpen,
  HelpCircle,
} from "lucide-react";
import useChat from "../hooks/useChat";
import ttsService from "../services/ttsService";
import "../styles/Chatbot.css";

const Chatbot = () => {
  const [inputMessage, setInputMessage] = useState("");
  const [botType, setBotType] = useState("rag"); // 'rag', 'support', 'learning'
  const [currentMode, setCurrentMode] = useState("english-practice"); // 'faq' or 'english-practice'
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [speakingMessageId, setSpeakingMessageId] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const {
    messages,
    isTyping,
    error,
    isConnected,
    sendMessage,
    sendQuickMessage,
    clearConversation,
    checkConnection,
  } = useChat("rag", currentMode === "faq" ? "faq" : "practice"); // Pass explicit mode

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Format timestamp
  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Handle TTS (Text-to-Speech)
  const handleTTS = async (messageId, text) => {
    try {
      if (speakingMessageId === messageId) {
        // Stop speaking if already speaking this message
        ttsService.stop();
        setSpeakingMessageId(null);
      } else {
        // Start speaking
        setSpeakingMessageId(messageId);
        await ttsService.speak(text);
        setSpeakingMessageId(null);
      }
    } catch (error) {
      console.error("TTS Error:", error);
      setSpeakingMessageId(null);
    }
  };

  // Extract word from pronunciation messages
  const extractWordFromPronunciation = (text) => {
    const match = text.match(/từ\s+"([^"]+)"/i) || text.match(/từ\s+(\w+)/i);
    return match ? match[1] : text;
  };

  // Handle mode switching
  const switchToFAQMode = () => {
    setCurrentMode("faq");
    clearConversation();

    // Add FAQ welcome message
    setTimeout(() => {
      const welcomeMessage = {
        id: Date.now(),
        text: "👋 Xin chào! Tôi ở đây để giúp bạn với:\n\n📋 Thông tin gói học và giá cả\n🗺️ Lộ trình học tập\n📞 Hỗ trợ kỹ thuật\n🔧 Khắc phục sự cố\n\nBạn cần hỗ trợ gì?",
        sender: "bot",
        mode: "FAQ Mode",
        timestamp: new Date(),
      };
      // This should add to messages but we don't have direct access
      // The clearConversation will trigger useChat to show default welcome
    }, 100);
  };

  const switchToEnglishPracticeMode = () => {
    setCurrentMode("english-practice");
    clearConversation();

    // Add English Practice welcome message
    setTimeout(() => {
      const welcomeMessage = {
        id: Date.now(),
        text: '🎓 Welcome to English Practice Mode! I can help you with:\n\n🔊 Pronunciation ("từ hello phát âm như nào")\n📝 Grammar check ("kiểm tra ngữ pháp câu này")\n🔄 Translation ("dịch sang tiếng Anh")\n📚 Word definitions ("nghĩa của từ beautiful")\n🎯 Vocabulary quiz\n\nWhat would you like to practice?',
        sender: "bot",
        mode: "English Practice Mode",
        timestamp: new Date(),
      };
      // This should add to messages but we don't have direct access
    }, 100);
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputMessage.trim() && !isTyping) {
      sendMessage(inputMessage);
      setInputMessage("");
    }
  };

  // Handle quick actions - different for each mode
  const getFAQActions = () => [
    {
      key: "subscription plans",
      label: "💳 Plans",
      title: "Subscription Plans",
    },
    { key: "learning roadmap", label: "🗺️ Roadmap", title: "Learning Roadmap" },
    { key: "contact support", label: "📞 Support", title: "Contact Support" },
    { key: "technical troubleshoot", label: "� Help", title: "Technical Help" },
  ];

  const getEnglishPracticeActions = () => [
    {
      key: "từ hello phát âm như nào",
      label: "🔊 Pronunciation",
      title: "Practice Pronunciation",
    },
    {
      key: "kiểm tra ngữ pháp câu I am student",
      label: "📝 Grammar",
      title: "Grammar Check",
    },
    {
      key: "dịch câu này sang tiếng Anh: Tôi đang học",
      label: "� Translate",
      title: "Translation",
    },
    {
      key: "cho tôi bài quiz từ vựng cơ bản",
      label: "🎯 Quiz",
      title: "Vocabulary Quiz",
    },
    {
      key: "nghĩa của từ beautiful",
      label: "📚 Definition",
      title: "Word Definition",
    },
  ];

  const quickActions =
    currentMode === "faq" ? getFAQActions() : getEnglishPracticeActions();

  return (
    <div className="chatbot-container">
      {/* Header */}
      <div className="chatbot-header">
        <div className="header-info">
          <h2>🤖 English Learning Assistant</h2>
          <p>
            {currentMode === "faq"
              ? "FAQ Support & Information"
              : "English Practice & Learning"}
          </p>
          <div className="connection-status">
            {isConnected ? (
              <span className="status connected">
                <CheckCircle size={12} /> Connected
              </span>
            ) : (
              <span className="status disconnected">
                <AlertCircle size={12} /> Disconnected
              </span>
            )}
          </div>
        </div>

        {/* Mode Selector */}
        <div className="mode-selector">
          <button
            onClick={switchToEnglishPracticeMode}
            className={`mode-btn ${currentMode === "english-practice" ? "active" : ""}`}
            title="English Practice Mode"
          >
            <BookOpen size={16} />
            <span>Study</span>
          </button>
          <button
            onClick={switchToFAQMode}
            className={`mode-btn ${currentMode === "faq" ? "active" : ""}`}
            title="FAQ Support Mode"
          >
            <HelpCircle size={16} />
            <span>Help</span>
          </button>
        </div>

        <div className="header-actions">
          <button
            onClick={checkConnection}
            className="action-btn"
            title="Refresh connection"
            disabled={isTyping}
          >
            <RefreshCw size={16} />
          </button>
          <button
            onClick={clearConversation}
            className="action-btn"
            title="Clear conversation"
            disabled={isTyping}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => checkConnection()}>Retry</button>
        </div>
      )}

      {/* Quick action buttons */}
      <div className="quick-actions">
        {quickActions.map((action) => (
          <button
            key={action.key}
            onClick={() => sendQuickMessage(action.key)}
            className="quick-btn"
            title={action.title}
            disabled={isTyping}
          >
            {action.label}
          </button>
        ))}
      </div>

      {/* Messages container */}
      <div className="messages-container">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`message ${message.sender} ${message.isError ? "error" : ""}`}
          >
            <div className="message-content">
              {/* Mode indicator */}
              {message.mode && (
                <div
                  className={`mode-indicator mode-${message.mode.toLowerCase().replace(" ", "-").replace("mode", "").trim()}`}
                >
                  <span className="mode-icon">
                    {message.mode === "FAQ Mode"
                      ? "📚"
                      : message.mode === "English Practice Mode"
                        ? "💬"
                        : message.isError
                          ? "⚠️"
                          : "🤖"}
                  </span>
                  <span className="mode-text">{message.mode}</span>
                </div>
              )}

              {/* Message text */}
              <div className="message-text">
                {message.text && typeof message.text === "string" ? (
                  message.text.split("\n").map((line, index) => (
                    <React.Fragment key={index}>
                      {line}
                      {index < message.text.split("\n").length - 1 && <br />}
                    </React.Fragment>
                  ))
                ) : (
                  <span>No message content</span>
                )}
              </div>

              {/* TTS Button - only for pronunciation messages */}
              {message.sender === "bot" &&
                message.text &&
                message.sources &&
                message.sources.some(
                  (s) =>
                    s.metadata?.type === "function_call" &&
                    s.metadata?.name === "get_pronunciation_help"
                ) && (
                  <div className="message-actions">
                    <button
                      className={`tts-btn ${speakingMessageId === message.id ? "speaking" : ""}`}
                      onClick={() => {
                        const textToSpeak = extractWordFromPronunciation(
                          message.text
                        );
                        handleTTS(message.id, textToSpeak);
                      }}
                      title={
                        speakingMessageId === message.id
                          ? "Dừng phát âm"
                          : "Nghe phát âm"
                      }
                      disabled={!ttsService.isSupportedByBrowser()}
                    >
                      {speakingMessageId === message.id ? (
                        <VolumeX size={14} />
                      ) : (
                        <Volume2 size={14} />
                      )}
                      <span className="tts-text">
                        {speakingMessageId === message.id
                          ? "Dừng"
                          : "Nghe phát âm"}
                      </span>
                    </button>
                  </div>
                )}

              {/* Sources (for FAQ mode) */}
              {message.sources && message.sources.length > 0 && (
                <div className="message-sources">
                  <details>
                    <summary>📖 Sources ({message.sources.length})</summary>
                    <div className="sources-list">
                      {message.sources.map((source, index) => (
                        <div key={index} className="source-item">
                          <div className="source-header">
                            <strong>
                              {source.metadata.type?.replace("_", " ")}
                            </strong>
                            {source.similarity && (
                              <span className="similarity">
                                {Math.round(source.similarity * 100)}% match
                              </span>
                            )}
                          </div>
                          <p>{source.content}</p>
                        </div>
                      ))}
                    </div>
                  </details>
                </div>
              )}

              {/* Timestamp */}
              <div className="message-timestamp">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="message bot typing">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="typing-text">Assistant is typing...</div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} className="input-form">
        <div className="input-container">
          <input
            ref={inputRef}
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={
              !isConnected
                ? "Connecting to server..."
                : currentMode === "faq"
                  ? "Ask about plans, pricing, support, roadmap..."
                  : "Practice pronunciation, grammar, vocabulary..."
            }
            disabled={isTyping || !isConnected}
            maxLength={1000}
            className={!isConnected ? "disabled" : ""}
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isTyping || !isConnected}
            className="send-btn"
            title="Send message"
          >
            <Send size={18} />
          </button>
        </div>
        <div className="input-info">
          <span className="char-count">{inputMessage.length}/1000</span>
          {!isConnected && (
            <span className="connection-warning">
              Server connection required
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Chatbot;
