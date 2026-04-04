const {
  askExamAiQuestion,
  getExamAiChatHistory,
  clearExamAiChatHistory,
} = require("../services/aiExamChatService");

const askQuestion = async (req, res) => {
  try {
    const { examId } = req.params;
    const { question } = req.body || {};

    const result = await askExamAiQuestion({ examId, question });
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error asking exam AI question:", error.message);
    return res.status(error.status || 500).json({
      message: error.message || "Failed to get AI answer.",
      answer: "I could not process your request right now.",
      sources: [],
      mode: "error",
    });
  }
};

const getHistory = async (req, res) => {
  try {
    const { examId } = req.params;
    const result = await getExamAiChatHistory(examId);
    return res.status(200).json(result);
  } catch (error) {
    console.error("Error loading exam AI chat history:", error.message);
    return res.status(error.status || 500).json({
      message: error.message || "Failed to load exam AI chat history.",
      messages: [],
    });
  }
};

const clearHistory = async (req, res) => {
  try {
    const { examId } = req.params;
    const result = await clearExamAiChatHistory(examId);
    return res.status(200).json({
      message: "Exam AI chat history cleared.",
      ...result,
    });
  } catch (error) {
    console.error("Error clearing exam AI chat history:", error.message);
    return res.status(error.status || 500).json({
      message: error.message || "Failed to clear exam AI chat history.",
    });
  }
};

module.exports = {
  askQuestion,
  getHistory,
  clearHistory,
};
