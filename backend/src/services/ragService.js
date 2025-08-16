// LangChain imports
const { ChatOpenAI, OpenAIEmbeddings } = require("@langchain/openai");
const { MemoryVectorStore } = require("langchain/vectorstores/memory");
const { Document } = require("@langchain/core/documents");
const { PromptTemplate } = require("@langchain/core/prompts");
const {
  RunnableSequence,
  RunnablePassthrough,
} = require("@langchain/core/runnables");
const { StringOutputParser } = require("@langchain/core/output_parsers");

const fs = require("fs").promises;
const path = require("path");
const config = require("../config");
const logger = require("../utils/logger");
const { functions, executeFunction } = require("../utils/functions");

class RAGService {
  constructor() {
    // LangChain ChatOpenAI for completions
    this.llm = new ChatOpenAI({
      openAIApiKey: config.OPENAI.API_KEY,
      modelName: config.OPENAI.MODEL,
      configuration: {
        baseURL: config.OPENAI.BASE_URL,
      },
    });

    // LangChain OpenAI Embeddings
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: config.OPENAI.EMBEDDING_API_KEY,
      modelName: config.OPENAI.EMBEDDING_MODEL,
      configuration: {
        baseURL: config.OPENAI.BASE_URL,
      },
    });

    this.knowledgeBase = null;
    this.vectorStore = null;
    this.retriever = null;
    this.ragChain = null;
    this.isInitialized = false;

    // RAG Prompt Template
    this.promptTemplate = PromptTemplate.fromTemplate(`
You are an intelligent English learning assistant. Use the following context to answer the user's question.
If the context doesn't contain relevant information, provide a helpful general response about English learning.

IMPORTANT INSTRUCTIONS:
- If the user asks about pronunciation in Vietnamese (e.g., "từ hello phát âm như nào", "cách đọc từ goodbye"), extract the English word and call get_pronunciation_help function
- If user asks about weather, call get_current_weather function
- If user asks about grammar, call get_grammar_explanation function
- If user asks for translation, call translate_text function
- Always respond in the same language as the user's question
- For pronunciation questions, provide detailed phonetic guidance in Vietnamese

Context: {context}

Question: {question}

Answer in a helpful and educational manner. If discussing pronunciation, provide phonetic transcriptions when relevant.
`);
  }

  async initialize() {
    try {
      logger.info("Initializing RAG Service with LangChain...");

      // Load knowledge base
      await this.loadKnowledgeBase();

      // Create documents from knowledge base
      const documents = this.createDocuments();
      logger.info(`Created ${documents.length} documents from knowledge base`);

      // Create vector store with embeddings
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        documents,
        this.embeddings
      );

      // Create retriever
      this.retriever = this.vectorStore.asRetriever({
        k: 3, // Return top 3 most relevant documents
      });

      // Create RAG chain
      this.ragChain = RunnableSequence.from([
        {
          context: this.retriever.pipe((docs) =>
            docs.map((doc) => doc.pageContent).join("\n\n")
          ),
          question: new RunnablePassthrough(),
        },
        this.promptTemplate,
        this.llm,
        new StringOutputParser(),
      ]);

      this.isInitialized = true;
      logger.info("RAG Service initialized successfully with LangChain");
    } catch (error) {
      logger.error("Failed to initialize RAG Service:", error);
      throw error;
    }
  }

  async loadKnowledgeBase() {
    const knowledgeBasePath = path.join(
      __dirname,
      "../data/knowledge-base.json"
    );
    this.knowledgeBase = JSON.parse(
      await fs.readFile(knowledgeBasePath, "utf8")
    );
    logger.info("Knowledge base loaded");
  }

  createDocuments() {
    logger.info("Creating LangChain documents from knowledge base...");

    const documents = [];

    // Convert subscription plans to documents
    if (this.knowledgeBase.subscription_plans) {
      this.knowledgeBase.subscription_plans.forEach((plan, index) => {
        documents.push(
          new Document({
            pageContent: `Subscription Plan: ${plan.title}\nPrice: ${
              plan.price
            }\nDescription: ${plan.description}\nFeatures: ${plan.features.join(
              ", "
            )}`,
            metadata: {
              type: "subscription_plan",
              id: `plan_${index}`,
              title: plan.title,
            },
          })
        );
      });
    }

    // Convert learning roadmap to documents
    if (this.knowledgeBase.learning_roadmap) {
      Object.entries(this.knowledgeBase.learning_roadmap).forEach(
        ([level, data], index) => {
          documents.push(
            new Document({
              pageContent: `Learning Level: ${data.level}\nDuration: ${
                data.duration
              }\nGoals: ${data.goals.join(", ")}\nTopics: ${data.topics.join(
                ", "
              )}\nRecommended Study Time: ${data.recommended_study_time}`,
              metadata: {
                type: "learning_roadmap",
                id: `roadmap_${index}`,
                level: data.level,
              },
            })
          );
        }
      );
    }

    // Convert troubleshooting to documents
    if (this.knowledgeBase.troubleshooting) {
      this.knowledgeBase.troubleshooting.forEach((issue, index) => {
        documents.push(
          new Document({
            pageContent: `Technical Issue: ${
              issue.issue
            }\nCauses: ${issue.causes.join(
              ", "
            )}\nSolutions: ${issue.solutions.join(", ")}`,
            metadata: {
              type: "troubleshooting",
              id: `troubleshoot_${index}`,
              issue: issue.issue,
            },
          })
        );
      });
    }

    // Convert support info to documents
    if (this.knowledgeBase.contact_support) {
      const support = this.knowledgeBase.contact_support;
      documents.push(
        new Document({
          pageContent: `Support Contact Information\nEmail: ${
            support.email
          }\nPhone: ${support.phone}\nHours: ${support.hours}\nLive Chat: ${
            support.live_chat
          }\nEmail Response Time: ${
            support.response_time.email
          }\nPhone Response Time: ${
            support.response_time.phone
          }\nSupported Languages: ${support.languages_supported.join(", ")}`,
          metadata: {
            type: "support_info",
            id: "support_contact",
            title: "Contact Support",
          },
        })
      );
    }

    logger.info(`Created ${documents.length} LangChain documents`);
    return documents;
  }

  isFAQQuery(query) {
    const queryLower = query.toLowerCase();

    // Các từ khóa function calling - KHÔNG phải FAQ
    const functionCallingKeywords = [
      "phát âm",
      "pronunciation",
      "cách đọc",
      "đọc như nào",
      "kiểm tra ngữ pháp",
      "grammar check",
      "sửa ngữ pháp",
      "ngữ pháp của",
      "dịch",
      "translate",
      "dịch sang",
      "dịch câu",
      "quiz",
      "bài tập",
      "vocabulary quiz",
      "từ vựng",
      "nghĩa của từ",
      "define",
      "definition",
      "từ này có nghĩa",
    ];

    // Nếu chứa function calling keywords -> không phải FAQ
    if (
      functionCallingKeywords.some((keyword) => queryLower.includes(keyword))
    ) {
      return false;
    }

    // FAQ keywords - về business/support (cả tiếng Anh và tiếng Việt)
    const faqKeywords = [
      // English keywords
      "price",
      "cost",
      "plan",
      "subscription",
      "pricing",
      "contact",
      "support",
      "phone",
      "email",
      "help desk",
      "roadmap",
      "learning path",
      "study plan",
      "course",
      "features",
      "benefit",
      "troubleshoot",
      "problem",
      "issue",
      "how to subscribe",
      "how to contact",
      "how to learn",
      "what is the price",
      "what are the features",

      // Vietnamese keywords
      "giá cả",
      "chi phí",
      "gói học",
      "đăng ký",
      "bảng giá",
      "liên hệ",
      "hỗ trợ",
      "điện thoại",
      "email",
      "trợ giúp",
      "lộ trình",
      "lộ trình học",
      "kế hoạch học",
      "khóa học",
      "tính năng",
      "lợi ích",
      "khắc phục",
      "vấn đề",
      "sự cố",
      "làm sao để đăng ký",
      "cách liên hệ",
      "cách học",
      "giá bao nhiêu",
      "có những tính năng gì",

      // Combined phrases
      "lộ trình học tập",
      "người mới bắt đầu",
      "kế hoạch học tập",
      "gói subscription",
      "thông tin liên hệ",
      "hỗ trợ khách hàng",
    ];

    // Check FAQ patterns first
    const faqPatterns = [
      // Vietnamese patterns
      /tôi muốn hỏi.*lộ trình/,
      /cho tôi biết.*lộ trình/,
      /lộ trình.*người mới/,
      /kế hoạch.*học tập/,
      /gói.*học/,
      /giá.*bao nhiêu/,
      /làm sao.*đăng ký/,
      /thông tin.*liên hệ/,

      // English patterns
      /what.*price/,
      /how.*subscribe/,
      /learning.*roadmap/,
      /study.*plan/,
      /contact.*information/,
    ];

    // Check if query matches FAQ patterns
    if (faqPatterns.some((pattern) => pattern.test(queryLower))) {
      return true;
    }

    // Then check FAQ keywords
    return faqKeywords.some((keyword) => queryLower.includes(keyword));
  }

  async processQuery(query, conversationHistory = [], explicitMode = null) {
    try {
      if (!this.isInitialized) {
        throw new Error("RAG Service not initialized");
      }

      // Use explicit mode from client if provided, otherwise auto-detect
      let shouldUseFAQ;
      if (explicitMode === "faq") {
        shouldUseFAQ = true;
        logger.info(`Using explicit FAQ mode for query: ${query}`);
      } else if (explicitMode === "practice") {
        shouldUseFAQ = false;
        logger.info(`Using explicit English Practice mode for query: ${query}`);
      } else {
        // Fallback to auto-detection if no explicit mode
        shouldUseFAQ = this.isFAQQuery(query);
        logger.info(
          `Auto-detected mode for query: ${query} -> ${
            shouldUseFAQ ? "FAQ" : "English Practice"
          }`
        );
      }

      // Route to appropriate handler
      if (shouldUseFAQ) {
        return await this.processFAQQuery(query);
      } else {
        return await this.processEnglishPracticeQuery(
          query,
          conversationHistory
        );
      }
    } catch (error) {
      logger.error("Error processing query with LangChain:", error);
      return {
        success: false,
        error: "Failed to process query",
        mode: "Error",
        sources: [],
        timestamp: new Date().toISOString(),
      };
    }
  }

  async processFAQQuery(query) {
    logger.info(`Processing FAQ query with LangChain: ${query}`);

    // Use LangChain RAG chain for knowledge-based queries
    const response = await this.ragChain.invoke(query);

    // Get relevant documents for sources
    const relevantDocs = await this.retriever.getRelevantDocuments(query);
    const sources = relevantDocs.map((doc) => ({
      content: doc.pageContent.substring(0, 200) + "...",
      metadata: doc.metadata,
      source: `${doc.metadata.type}_${doc.metadata.id}`,
    }));

    return {
      success: true,
      response,
      mode: "FAQ Mode",
      sources,
      timestamp: new Date().toISOString(),
    };
  }

  async processEnglishPracticeQuery(query, conversationHistory = []) {
    logger.info(`Processing English Practice query: ${query}`);

    // System prompt for English practice with function calling
    const conversationMessages = [
      {
        role: "system",
        content: `You are a friendly English tutor helping students practice English conversation. 
You can respond in both Vietnamese and English based on the user's language.

FUNCTION CALLING RULES:
1. For pronunciation questions in Vietnamese (like "từ hello phát âm như nào", "cách đọc từ goodbye"):
   - Extract the English word mentioned (hello, goodbye, etc.)
   - Call get_pronunciation_help with that word
   
2. For word definition questions: Call get_word_definition
3. For vocabulary quiz requests: Call get_vocabulary_quiz
4. For grammar questions: Call get_grammar_explanation  
5. For translation requests: Call translate_text

EXAMPLES:
- "từ hello phát âm như nào" → call get_pronunciation_help with word: "hello"
- "nghĩa của từ goodbye là gì" → call get_word_definition with word: "goodbye"
- "cho tôi bài quiz từ vựng cơ bản" → call get_vocabulary_quiz with level: "beginner"
- "dịch câu này sang tiếng Anh" → call translate_text

Always extract English words accurately from Vietnamese questions and provide helpful responses.`,
      },
      ...conversationHistory.slice(-5).map((msg) => ({
        role: msg.sender === "user" ? "user" : "assistant",
        content: msg.text,
      })),
      { role: "user", content: query },
    ];

    // Create LLM with function calling support
    const llmWithTools = this.llm.bind({
      tools: functions.map((func) => ({
        type: "function",
        function: {
          name: func.name,
          description: func.description,
          parameters: func.parameters,
        },
      })),
    });

    const completion = await llmWithTools.invoke(conversationMessages);
    let response;
    const sources = [];

    // Check if the response contains tool calls
    if (completion.tool_calls && completion.tool_calls.length > 0) {
      response = await this.handleFunctionCalls(
        completion,
        conversationMessages,
        sources
      );
    } else {
      response = completion.content;
    }

    return {
      success: true,
      response,
      mode: "English Practice Mode",
      sources,
      timestamp: new Date().toISOString(),
    };
  }

  async handleFunctionCalls(completion, conversationMessages, sources) {
    const toolCall = completion.tool_calls[0];

    // Debug log the tool call structure
    console.log("Tool call structure:", JSON.stringify(toolCall, null, 2));

    // Handle different tool call structures
    let functionName, functionArgs;

    if (toolCall.function && toolCall.function.name) {
      // OpenAI API format
      functionName = toolCall.function.name;
      functionArgs = JSON.parse(toolCall.function.arguments || "{}");
    } else if (toolCall.name) {
      // LangChain format
      functionName = toolCall.name;
      functionArgs = toolCall.args || {};
    } else {
      logger.error("Invalid tool call structure:", toolCall);
      return "Sorry, there was an error processing your request.";
    }

    if (functionName) {
      // Execute the function
      const functionResult = await executeFunction(functionName, functionArgs);

      // Create follow-up messages with function result
      const followUpMessages = [
        ...conversationMessages,
        {
          role: "assistant",
          content: completion.content,
          tool_calls: completion.tool_calls,
        },
        {
          role: "tool",
          tool_call_id: toolCall.id,
          content: JSON.stringify(functionResult),
        },
      ];

      // Get final response incorporating function result
      const finalCompletion = await this.llm.invoke(followUpMessages);

      // Add function call info to sources
      sources.push({
        content: `Function called: ${functionName}`,
        metadata: {
          type: "function_call",
          name: functionName,
          args: functionArgs,
        },
        source: `function_${functionName}`,
      });

      return finalCompletion.content;
    }

    return completion.content;
  }
}

module.exports = new RAGService();
