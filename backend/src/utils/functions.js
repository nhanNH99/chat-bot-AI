// Function definitions for the chatbot
const functions = [
  {
    name: "get_word_definition",
    description:
      "Get definition, synonyms, and example sentences for English words",
    parameters: {
      type: "object",
      properties: {
        word: {
          type: "string",
          description: "The English word to get definition for",
        },
        include_examples: {
          type: "boolean",
          description: "Whether to include example sentences",
        },
      },
      required: ["word"],
    },
  },
  {
    name: "get_pronunciation_help",
    description: "Get pronunciation help for English words",
    parameters: {
      type: "object",
      properties: {
        word: {
          type: "string",
          description: "The English word to get pronunciation help for",
        },
        include_phonetics: {
          type: "boolean",
          description: "Whether to include IPA phonetic transcription",
        },
      },
      required: ["word"],
    },
  },
  {
    name: "get_grammar_explanation",
    description: "Get detailed grammar explanation for English language rules",
    parameters: {
      type: "object",
      properties: {
        topic: {
          type: "string",
          description:
            "The grammar topic to explain (e.g., 'present perfect', 'conditionals', 'passive voice')",
        },
        level: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "The difficulty level for the explanation",
        },
      },
      required: ["topic"],
    },
  },
  {
    name: "translate_text",
    description: "Translate text from one language to another",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to translate",
        },
        source_lang: {
          type: "string",
          description: "Source language code (e.g., 'en', 'vi', 'fr')",
        },
        target_lang: {
          type: "string",
          description: "Target language code (e.g., 'en', 'vi', 'fr')",
        },
      },
      required: ["text", "target_lang"],
    },
  },
  {
    name: "get_vocabulary_quiz",
    description: "Generate vocabulary quiz questions for English learning",
    parameters: {
      type: "object",
      properties: {
        level: {
          type: "string",
          enum: ["beginner", "intermediate", "advanced"],
          description: "The difficulty level for vocabulary quiz",
        },
        topic: {
          type: "string",
          description:
            "Topic for vocabulary (e.g., 'daily life', 'business', 'travel')",
        },
        question_count: {
          type: "number",
          description: "Number of quiz questions to generate",
        },
      },
      required: ["level"],
    },
  },
];

// Function execution logic
const executeFunction = async (functionName, args) => {
  console.log(`Executing function: ${functionName}`, args);

  switch (functionName) {
    case "get_word_definition":
      const wordDefinitions = {
        hello: {
          definition:
            "A greeting used when meeting someone or answering the telephone",
          synonyms: ["hi", "greetings", "hey"],
          examples: ["Hello, how are you?", "She said hello to her neighbor"],
        },
        goodbye: {
          definition: "A farewell remark",
          synonyms: ["farewell", "bye", "see you later"],
          examples: [
            "Goodbye! See you tomorrow.",
            "He waved goodbye from the train.",
          ],
        },
        thank: {
          definition: "To express gratitude to someone",
          synonyms: ["appreciate", "acknowledge", "be grateful"],
          examples: [
            "Thank you for your help.",
            "I want to thank everyone who supported me.",
          ],
        },
      };

      const wordData = wordDefinitions[args.word.toLowerCase()] || {
        definition: `The word "${args.word}" means... (definition would be provided by a dictionary API)`,
        synonyms: ["synonym1", "synonym2"],
        examples: [`Example sentence with "${args.word}".`],
      };

      let definitionContent = `**Từ**: ${args.word}\n\n**Định nghĩa**: ${
        wordData.definition
      }\n\n**Từ đồng nghĩa**: ${wordData.synonyms.join(", ")}`;

      if (args.include_examples) {
        definitionContent += `\n\n**Ví dụ**:\n${wordData.examples
          .map((ex) => `• ${ex}`)
          .join("\n")}`;
      }

      return {
        content: definitionContent,
        type: "word_definition",
      };

    case "get_vocabulary_quiz":
      const quizQuestions = {
        beginner: [
          "What does 'hello' mean?",
          "Choose the correct spelling: A) Thenk you B) Thank you C) Thankyu",
          "What is the opposite of 'good'?",
        ],
        intermediate: [
          "What does 'appreciate' mean?",
          "Choose the best synonym for 'important': A) Crucial B) Small C) Easy",
          "Complete: 'I _____ to the store yesterday' A) go B) went C) going",
        ],
        advanced: [
          "What does 'exacerbate' mean?",
          "Choose the most appropriate word: The situation was _____ complex A) incredibly B) incredible C) incredulous",
          "Explain the difference between 'affect' and 'effect'",
        ],
      };

      const questions = quizQuestions[args.level] || quizQuestions.beginner;
      const selectedQuestions = questions.slice(0, args.question_count || 3);

      return {
        content: `**Vocabulary Quiz - ${args.level.toUpperCase()} Level**\n${
          args.topic ? `**Chủ đề**: ${args.topic}\n` : ""
        }\n${selectedQuestions
          .map((q, i) => `${i + 1}. ${q}`)
          .join(
            "\n\n"
          )}\n\n💡 Hãy trả lời từng câu hỏi và tôi sẽ kiểm tra kết quả cho bạn!`,
        type: "vocabulary_quiz",
      };

    case "get_pronunciation_help":
      try {
        // Handle common English words with their phonetics
        const pronunciationDatabase = {
          hello: "/həˈloʊ/ - HEH-loh",
          goodbye: "/ɡʊdˈbaɪ/ - GOOD-bye",
          thank: "/θæŋk/ - THANK",
          you: "/juː/ - YOO",
          please: "/pliːz/ - PLEEZ",
          sorry: "/ˈsɔːri/ - SOR-ree",
          yes: "/jes/ - YES",
          no: "/noʊ/ - NOH",
          water: "/ˈwɔːtər/ - WAH-ter",
          love: "/lʌv/ - LUV",
        };

        const word = args.word.toLowerCase().trim();
        const customPhonetic = pronunciationDatabase[word];

        if (customPhonetic) {
          return {
            content: `Từ "${args.word}" được phát âm như sau:\n\n🔊 **Phiên âm IPA**: ${customPhonetic}\n\n📝 **Cách phát âm**: \n- Chia thành các âm tiết\n- Luyện tập từ từ\n- Lặp lại nhiều lần\n\n💡 **Mẹo**: Hãy nghe và lặp lại để cải thiện phát âm!`,
            type: "pronunciation_help",
          };
        } else {
          // Generic pronunciation help
          const phonetic = args.include_phonetics ? ` /fəˈnetɪk/` : "";
          return {
            content: `Từ "${
              args.word
            }" có thể được phát âm như sau:\n\n🔊 **Phiên âm**: ${args.word.toUpperCase()}${phonetic}\n\n📝 **Hướng dẫn**:\n- Chia từ thành các âm tiết\n- Chú ý trọng âm\n- Luyện tập thường xuyên\n\n💡 Bạn có thể tra từ điển hoặc nghe audio để có phát âm chính xác nhất!`,
            type: "pronunciation_help",
          };
        }
      } catch (error) {
        console.error("Error in pronunciation help:", error);
        return {
          content: `Có lỗi khi xử lý phát âm cho từ "${args.word}". Vui lòng thử lại!`,
          type: "error",
        };
      }

    case "get_grammar_explanation":
      return {
        content: `${args.topic.toUpperCase()} (${
          args.level
        } level):\n\nThis is a fundamental grammar concept that helps structure English sentences properly. Here are the key points:\n\n1. Definition and usage\n2. Common patterns and examples\n3. Practice exercises\n\nWould you like me to provide specific examples?`,
        type: "grammar_explanation",
      };

    case "translate_text":
      return {
        content: `Translation from ${args.source_lang || "auto-detected"} to ${
          args.target_lang
        }:\n\n"${args.text}" \n\n→ [Translated text would appear here]`,
        type: "translation",
      };

    default:
      return {
        content: `Unknown function: ${functionName}`,
        type: "error",
      };
  }
};

module.exports = {
  functions,
  executeFunction,
};
