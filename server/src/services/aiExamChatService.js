const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");
const pdfParseLib = require("pdf-parse");
const ExamPreparation = require("../models/ExamPreparationModel");
const ExamAiChatSession = require("../models/ExamAiChatSession");

const uploadsBaseDir = path.join(__dirname, "../../uploads/exam-pdfs");

const MAX_HISTORY_FOR_PROMPT = 14;
const MAX_HISTORY_STORED = 24;
const MAX_CONTEXT_CHUNKS = 6;
const MIN_READABLE_TEXT_LENGTH = 50;

const STOP_WORDS = new Set([
  "the", "and", "for", "are", "with", "that", "this", "from", "your", "have", "what", "when", "where", "which", "into", "about", "will", "would", "there", "their", "were", "been", "them", "they", "then", "than", "also", "each", "only", "more", "some", "such", "very", "just", "like", "need", "show", "give", "explain", "please", "based", "using", "used", "make", "made", "does", "did", "doing", "how", "why", "who", "can", "could", "should", "shall", "you", "our", "his", "her", "its", "but", "not", "all", "any", "too", "was", "is", "of", "to", "in", "on", "at", "by", "or", "as", "an", "be", "it", "if", "we", "i"
]);

const SYSTEM_PROMPT = "You are a student study assistant. Answer only using the provided lecture PDF context and the current chat conversation context. Use simple English. Match the student's requested format. If they ask for bullet points, return bullet points. If they ask for an explanation, return a clear explanation. If they ask for steps, return steps. If they ask for a short answer, keep it short. If they ask for a summary, summarize clearly. If they ask for practice questions, create them only from the lecture context. If the uploaded lecture PDF context is insufficient, say so clearly. Do not add outside knowledge. Do not hallucinate.";

const pdfTextCache = new Map();
let openaiClient;
let openaiClientSignature = "";

const AppError = (message, status = 400) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

const toSafeText = (value) => (value == null ? "" : String(value));

const normalizeMessages = (messages) => {
  if (!Array.isArray(messages)) return [];

  return messages
    .filter((msg) => msg && (msg.role === "user" || msg.role === "assistant"))
    .map((msg) => ({
      role: msg.role,
      content: toSafeText(msg.content).trim(),
    }))
    .filter((msg) => msg.content.length > 0);
};

const trimHistory = (messages, limit) => {
  const normalized = normalizeMessages(messages);
  if (normalized.length <= limit) return normalized;
  return normalized.slice(normalized.length - limit);
};

const isXaiKey = (key) => toSafeText(key).startsWith("xai-");
const isGeminiKey = (key) => toSafeText(key).startsWith("AIza");
const isGroqKey = (key) => toSafeText(key).startsWith("gsk_");

const resolveProviderConfig = () => {
  const openAiKey = toSafeText(process.env.OPENAI_API_KEY).trim();
  const geminiKey = toSafeText(process.env.GEMINI_API_KEY).trim();
  const explicitBaseUrl = toSafeText(process.env.OPENAI_BASE_URL).trim();

  // Priority:
  // 1. Explicit OpenAI key (supports OpenAI + xAI when base URL or key pattern is present)
  // 2. Gemini key fallback
  if (openAiKey) {
    const provider = isXaiKey(openAiKey)
      ? "xai"
      : isGroqKey(openAiKey)
      ? "groq"
      : "openai";
    const baseURL = explicitBaseUrl
      || (provider === "xai" ? "https://api.x.ai/v1" : "")
      || (provider === "groq" ? "https://api.groq.com/openai/v1" : "")
      || undefined;
    const defaultModel = provider === "xai"
      ? "grok-3-mini"
      : provider === "groq"
      ? "llama-3.1-8b-instant"
      : "gpt-4o-mini";

    return {
      provider,
      apiKey: openAiKey,
      baseURL,
      model:
        toSafeText(process.env.OPENAI_MODEL).trim()
        || (provider === "xai" ? toSafeText(process.env.XAI_MODEL).trim() : "")
        || (provider === "groq" ? toSafeText(process.env.GROQ_MODEL).trim() : "")
        || defaultModel,
    };
  }

  if (geminiKey) {
    return {
      provider: "gemini",
      apiKey: geminiKey,
      baseURL: explicitBaseUrl || "https://generativelanguage.googleapis.com/v1beta/openai",
      model: toSafeText(process.env.GEMINI_MODEL).trim() || toSafeText(process.env.OPENAI_MODEL).trim() || "gemini-2.5-flash",
    };
  }

  return {
    provider: "unknown",
    apiKey: "",
    baseURL: explicitBaseUrl || undefined,
    model: toSafeText(process.env.OPENAI_MODEL).trim() || "gpt-4o-mini",
  };
};

const getApiBaseUrl = () => {
  return resolveProviderConfig().baseURL;
};

const getOpenAiClient = () => {
  const { apiKey, baseURL } = resolveProviderConfig();
  if (!apiKey) return null;

  const signature = `${apiKey}:${baseURL || "default"}`;

  if (!openaiClient || openaiClientSignature !== signature) {
    const options = baseURL ? { apiKey, baseURL } : { apiKey };
    openaiClient = new OpenAI(options);
    openaiClientSignature = signature;
  }

  return openaiClient;
};

const getOpenAiModel = () => {
  return resolveProviderConfig().model;
};

const extractKeywords = (text) => {
  const normalized = toSafeText(text)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));

  return [...new Set(normalized)];
};

const chunkText = (text, chunkSize = 1400, overlap = 220) => {
  const value = toSafeText(text).trim();
  if (!value) return [];

  const chunks = [];
  let start = 0;

  while (start < value.length) {
    const end = Math.min(start + chunkSize, value.length);
    chunks.push(value.slice(start, end).trim());
    if (end >= value.length) break;
    start = Math.max(end - overlap, start + 1);
  }

  return chunks.filter(Boolean);
};

const scoreChunk = (chunkTextValue, questionKeywords) => {
  if (!chunkTextValue || questionKeywords.length === 0) return 0;

  const chunkLower = chunkTextValue.toLowerCase();
  let score = 0;

  questionKeywords.forEach((keyword) => {
    if (chunkLower.includes(keyword)) {
      score += 1;
      if (chunkLower.includes(`${keyword} `) || chunkLower.includes(` ${keyword}`)) {
        score += 0.25;
      }
    }
  });

  return score;
};

const selectRelevantChunks = (question, chunks) => {
  if (!Array.isArray(chunks) || chunks.length === 0) return [];

  const keywords = extractKeywords(question);
  const scored = chunks
    .map((chunk) => ({
      ...chunk,
      _score: scoreChunk(chunk.text, keywords),
    }))
    .sort((a, b) => b._score - a._score);

  const positive = scored.filter((item) => item._score > 0).slice(0, MAX_CONTEXT_CHUNKS);
  if (positive.length > 0) return positive;

  return scored.slice(0, Math.min(MAX_CONTEXT_CHUNKS, scored.length));
};

const safeExcerpt = (text, max = 260) => {
  const cleaned = toSafeText(text).replace(/\s+/g, " ").trim();
  if (cleaned.length <= max) return cleaned;
  return `${cleaned.slice(0, max - 3)}...`;
};

const extractPdfText = async (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer)) return "";

  if (typeof pdfParseLib === "function") {
    const result = await pdfParseLib(buffer);
    return toSafeText(result && result.text).trim();
  }

  if (pdfParseLib && typeof pdfParseLib.PDFParse === "function") {
    const parser = new pdfParseLib.PDFParse({ data: buffer });
    const result = await parser.getText();
    return toSafeText(result && result.text).trim();
  }

  if (pdfParseLib && typeof pdfParseLib.default === "function") {
    const result = await pdfParseLib.default(buffer);
    return toSafeText(result && result.text).trim();
  }

  return "";
};

const loadExamChunks = async (exam) => {
  const pdfItems = Array.isArray(exam.lecturePdfs) ? exam.lecturePdfs : [];
  const allChunks = [];
  const unreadablePdfs = [];

  for (const pdf of pdfItems) {
    const fileName = toSafeText(pdf.fileName || pdf.storedFileName || "Lecture PDF");
    const storedFileName = toSafeText(pdf.storedFileName).trim();
    if (!storedFileName) continue;

    const fullPath = path.join(uploadsBaseDir, storedFileName);
    if (!fs.existsSync(fullPath)) {
      unreadablePdfs.push(fileName);
      continue;
    }

    try {
      const stats = fs.statSync(fullPath);
      const cacheKey = `${storedFileName}:${stats.mtimeMs}:${stats.size}`;
      let cached = pdfTextCache.get(cacheKey);

      if (!cached) {
        const buffer = fs.readFileSync(fullPath);
        const extractedText = await extractPdfText(buffer);
        const chunks = chunkText(extractedText);
        cached = {
          extractedText,
          chunks,
        };
        pdfTextCache.set(cacheKey, cached);
      }

      const extractedText = toSafeText(cached.extractedText).trim();
      if (extractedText.length < MIN_READABLE_TEXT_LENGTH || cached.chunks.length === 0) {
        unreadablePdfs.push(fileName);
        continue;
      }

      cached.chunks.forEach((text, index) => {
        allChunks.push({
          fileName,
          storedFileName,
          text,
          chunkIndex: index,
        });
      });
    } catch (error) {
      console.warn("AI chat PDF extraction failed:", {
        fileName,
        message: error.message,
      });
      unreadablePdfs.push(fileName);
    }
  }

  return {
    chunks: allChunks,
    unreadablePdfs,
  };
};

const buildSources = (chunks) => {
  const unique = new Map();

  chunks.forEach((chunk) => {
    const key = `${chunk.fileName}:${chunk.chunkIndex}`;
    if (unique.has(key)) return;
    unique.set(key, {
      fileName: chunk.fileName,
      excerpt: safeExcerpt(chunk.text),
    });
  });

  return [...unique.values()].slice(0, MAX_CONTEXT_CHUNKS);
};

const buildFallbackAnswer = (sources, unreadablePdfs, reason) => {
  if (!Array.isArray(sources) || sources.length === 0) {
    if (Array.isArray(unreadablePdfs) && unreadablePdfs.length > 0) {
      return `I could not find enough readable text in the uploaded lecture PDFs to answer this fully. Please upload clearer PDFs or text-based lecture notes. ${reason || ""}`.trim();
    }

    return `I could not find enough relevant content in the uploaded lecture PDFs to answer this fully. ${reason || ""}`.trim();
  }

  const firstSource = sources[0];
  return `I could not reach the AI service right now, but based on your lecture PDFs I found this related point: ${firstSource.excerpt}`;
};

const classifyOpenAiError = (error) => {
  const code = toSafeText(error?.code || error?.error?.code).toLowerCase();
  const status = Number(error?.status || error?.statusCode || 0);
  const message = toSafeText(error?.message || error?.error?.message).toLowerCase();
  const errorType = toSafeText(error?.error?.error_type || "").toLowerCase();
  const providerConfig = resolveProviderConfig();
  const usingXai = providerConfig.provider === "xai";
  const usingGemini = providerConfig.provider === "gemini";
  const usingGroq = providerConfig.provider === "groq";

  // Debug: Log full error for analysis
  console.error("Detailed error info:", {
    code,
    status,
    message,
    errorType,
    provider: providerConfig.provider,
    rawError: error?.error
  });

  if (code === "insufficient_quota" || status === 429 || message.includes("rate_limit") || message.includes("rate-limit")) {
    return {
      mode: "quota_exceeded",
      reason: "Provider API rate limit or quota exceeded.",
      answer: usingGemini
        ? "I cannot generate a full AI answer right now because the Gemini API quota for this key has been exceeded. Please add billing/credits or use a different Gemini key, then ask again."
        : "I cannot generate a full AI answer right now because the API quota for this key has been exceeded. Please add billing/credits or use a different key, then ask again.",
    };
  }

  if (code === "invalid_api_key" || status === 401 || errorType === "permission_denied" || message.includes("authentication") || message.includes("unauthorized")) {
    return {
      mode: "api_key_invalid",
      reason: "Invalid API key or provider endpoint mismatch.",
      answer: usingGemini
        ? "Your Gemini API key is invalid or not authorized. Ensure your Google Cloud project has the Generative AI API enabled and the key has the right permissions. Check your GEMINI_API_KEY in .env."
        : usingXai
        ? "Your Grok/xAI key is not accepted with the current provider settings. Set OPENAI_BASE_URL to https://api.x.ai/v1 and use an xAI model such as grok-2-latest."
        : usingGroq
        ? "Your Groq key is invalid or not authorized. Verify OPENAI_API_KEY starts with gsk_ and OPENAI_BASE_URL is https://api.groq.com/openai/v1."
        : "The API key is invalid for the current provider. Check your key and try again.",
    };
  }

  if (status === 403 && usingGemini) {
    // 403 from Gemini typically means billing/project issue
    return {
      mode: "provider_credits_missing",
      reason: "Gemini account has no billing or the API is not enabled.",
      answer: "Your Google Cloud project does not have billing enabled for Gemini API, or the Generative AI API is not enabled. Set up billing in the Google Cloud Console and enable the Generative AI API for your project, then try again.",
    };
  }

  if (status === 403 && (message.includes("doesn't have any credits") || message.includes("credits") || message.includes("licenses") || message.includes("not available"))) {
    return {
      mode: "provider_credits_missing",
      reason: "Provider account has no credits/licenses.",
      answer: usingXai
        ? "Your xAI team currently has no credits or licenses, so Grok cannot generate answers yet. Add credits/licenses in your xAI console, then try again."
        : usingGemini
        ? "Your Gemini/Google account currently has no credits or the model is not available. Add billing information, then try again."
        : usingGroq
        ? "Your Groq project has no credits or rate limit budget for this model. Add credits or use a lighter model, then try again."
        : "Your provider account currently has no credits or access for this model. Add credits/access, then try again.",
    };
  }

  if (code === "model_not_found" || status === 404 || message.includes("model not found") || message.includes("not found")) {
    return {
      mode: "model_invalid",
      reason: "Configured model is not available for this provider.",
      answer: usingGemini
        ? "The configured model is not available on Gemini. Update GEMINI_MODEL (or OPENAI_MODEL) to a valid Gemini model such as gemini-2.5-flash and try again."
        : usingXai
        ? "The configured model is not available on xAI. Update OPENAI_MODEL to a valid xAI model (for example grok-3-mini) and try again."
        : usingGroq
        ? "The configured model is not available on Groq. Set OPENAI_MODEL (or GROQ_MODEL) to an available model such as llama-3.1-8b-instant."
        : "The configured model is not available for this provider. Update OPENAI_MODEL and try again.",
    };
  }

  return {
    mode: "fallback",
    reason: `${error?.message || "API request failed"}`,
    answer: "",
  };
};

const getOrCreateSession = async (examPreparationId) => {
  let session = await ExamAiChatSession.findOne({
    where: { examPreparationId },
  });

  if (!session) {
    session = await ExamAiChatSession.create({
      examPreparationId,
      messages: [],
    });
  }

  return session;
};

const askExamAiQuestion = async ({ examId, question }) => {
  const parsedExamId = Number(examId);
  const normalizedQuestion = toSafeText(question).trim();

  if (!Number.isInteger(parsedExamId) || parsedExamId <= 0) {
    throw AppError("Invalid exam ID.", 400);
  }

  if (!normalizedQuestion) {
    throw AppError("Question is required.", 400);
  }

  const exam = await ExamPreparation.findByPk(parsedExamId);
  if (!exam) {
    throw AppError("Exam not found.", 404);
  }

  const session = await getOrCreateSession(parsedExamId);
  const existingHistory = trimHistory(session.messages, MAX_HISTORY_FOR_PROMPT);

  const { chunks, unreadablePdfs } = await loadExamChunks(exam);
  const relevantChunks = selectRelevantChunks(normalizedQuestion, chunks);
  const sources = buildSources(relevantChunks);

  if (sources.length === 0) {
    const answer = buildFallbackAnswer(sources, unreadablePdfs);
    const updated = trimHistory(
      [...existingHistory, { role: "user", content: normalizedQuestion }, { role: "assistant", content: answer }],
      MAX_HISTORY_STORED
    );

    await session.update({ messages: updated });

    return {
      answer,
      sources,
      mode: "fallback",
      history: updated,
    };
  }

  const contextText = relevantChunks
    .map((chunk, index) => `Source ${index + 1} (${chunk.fileName})\n${chunk.text}`)
    .join("\n\n");

  const unreadableLabel = unreadablePdfs.length > 0
    ? `Unreadable or empty PDFs: ${unreadablePdfs.join(", ")}.`
    : "";

  const modelMessages = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "system",
      content: `Exam: ${exam.subject || "Subject"} - ${exam.examTitle || "Exam"}.\nUse only the lecture PDF context and chat history below. ${unreadableLabel}`,
    },
    {
      role: "system",
      content: `Lecture PDF context:\n${contextText}`,
    },
    ...existingHistory,
    { role: "user", content: normalizedQuestion },
  ];

  let answer = "";
  let mode = "ai";

  try {
    const client = getOpenAiClient();
    if (!client) {
      throw AppError("AI provider API key is missing on the server.", 500);
    }

    console.log("Sending request to AI provider:", {
      provider: resolveProviderConfig().provider,
      model: getOpenAiModel(),
      baseURL: getApiBaseUrl(),
      messageCount: modelMessages.length
    });

    const completion = await client.chat.completions.create({
      model: getOpenAiModel(),
      messages: modelMessages,
      temperature: 0.2,
    });

    answer = toSafeText(completion?.choices?.[0]?.message?.content).trim();
    if (!answer) {
      throw AppError("No answer returned from AI provider.", 502);
    }
  } catch (error) {
    const failure = classifyOpenAiError(error);
    const providerConfig = resolveProviderConfig();
    console.error("AI askExamAiQuestion failed:", {
      provider: providerConfig.provider,
      baseURL: providerConfig.baseURL,
      model: getOpenAiModel(),
      message: error.message,
      status: error.status,
      code: error.code,
      reason: failure.reason,
      fullError: JSON.stringify(error, null, 2)
    });

    mode = failure.mode;
    answer = failure.answer || buildFallbackAnswer(
      sources,
      unreadablePdfs,
      "Please try again in a moment."
    );
  }

  const updatedHistory = trimHistory(
    [...existingHistory, { role: "user", content: normalizedQuestion }, { role: "assistant", content: answer }],
    MAX_HISTORY_STORED
  );

  await session.update({ messages: updatedHistory });

  return {
    answer,
    sources,
    mode,
    history: updatedHistory,
  };
};

const getExamAiChatHistory = async (examId) => {
  const parsedExamId = Number(examId);
  if (!Number.isInteger(parsedExamId) || parsedExamId <= 0) {
    throw AppError("Invalid exam ID.", 400);
  }

  const exam = await ExamPreparation.findByPk(parsedExamId);
  if (!exam) {
    throw AppError("Exam not found.", 404);
  }

  const session = await getOrCreateSession(parsedExamId);
  const messages = trimHistory(session.messages, MAX_HISTORY_STORED);

  return {
    examId: parsedExamId,
    messages,
  };
};

const clearExamAiChatHistory = async (examId) => {
  const parsedExamId = Number(examId);
  if (!Number.isInteger(parsedExamId) || parsedExamId <= 0) {
    throw AppError("Invalid exam ID.", 400);
  }

  const exam = await ExamPreparation.findByPk(parsedExamId);
  if (!exam) {
    throw AppError("Exam not found.", 404);
  }

  const session = await getOrCreateSession(parsedExamId);
  await session.update({ messages: [] });

  return {
    examId: parsedExamId,
    messages: [],
  };
};

const deleteExamAiChatSession = async (examId) => {
  const parsedExamId = Number(examId);
  if (!Number.isInteger(parsedExamId) || parsedExamId <= 0) return;

  await ExamAiChatSession.destroy({
    where: { examPreparationId: parsedExamId },
  });
};

module.exports = {
  askExamAiQuestion,
  getExamAiChatHistory,
  clearExamAiChatHistory,
  deleteExamAiChatSession,
};
