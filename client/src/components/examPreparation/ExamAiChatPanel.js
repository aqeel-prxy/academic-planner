import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import './ExamAiChatPanel.css';

const QUICK_PROMPTS = [
  'Summarize the most important topics from these PDFs',
  'Ask me 5 practice questions based on the lecture PDFs',
  'Explain the key concepts in simple words',
  'What should I revise first for this exam?'
];

const toMessages = (payload) => {
  if (!payload || !Array.isArray(payload.messages)) return [];
  return payload.messages
    .filter((msg) => msg && (msg.role === 'user' || msg.role === 'assistant'))
    .map((msg) => ({
      role: msg.role,
      content: String(msg.content || ''),
      sources: Array.isArray(msg.sources) ? msg.sources : []
    }))
    .filter((msg) => msg.content.trim().length > 0);
};

const ExamAiChatPanel = ({ exam, isOpen }) => {
  const examId = exam?.id;
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [asking, setAsking] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState('');

  const canAsk = useMemo(() => !asking && question.trim().length > 0 && Boolean(examId), [asking, question, examId]);

  const loadHistory = async () => {
    if (!examId || !isOpen) return;

    try {
      setLoadingHistory(true);
      setError('');
      const result = await api.getExamAiChatHistory(examId);
      setMessages(toMessages(result));
    } catch (err) {
      setMessages([]);
      setError(err?.response?.data?.message || 'Failed to load AI chat history.');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [examId, isOpen]);

  const askQuestion = async (questionText) => {
    const normalized = String(questionText || '').trim();
    if (!normalized || !examId || asking) return;

    const userMessage = { role: 'user', content: normalized, sources: [] };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion('');
    setAsking(true);
    setError('');

    try {
      const result = await api.askExamAiQuestion(examId, normalized);
      const assistantMessage = {
        role: 'assistant',
        content: String(result?.answer || 'No answer was generated.'),
        sources: Array.isArray(result?.sources) ? result.sources : []
      };

      setMode(String(result?.mode || ''));
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to get AI answer.');
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'I could not process your question right now. Please try again.',
          sources: []
        }
      ]);
    } finally {
      setAsking(false);
    }
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await askQuestion(question);
  };

  const clearChat = async () => {
    if (!examId || clearing) return;

    try {
      setClearing(true);
      setError('');
      await api.clearExamAiChatHistory(examId);
      setMessages([]);
      setMode('');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to clear AI chat history.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <section className="exam-details-section exam-ai-chat-wrap">
      <div className="exam-section-head exam-ai-chat-head">
        <h3>AI Study Assistant</h3>
        <button type="button" className="btn-small" onClick={clearChat} disabled={clearing || asking || loadingHistory}>
          {clearing ? 'Clearing...' : 'Clear Chat'}
        </button>
      </div>

      <p className="exam-ai-chat-sub">Ask questions from your uploaded lecture PDFs. The assistant remembers this exam chat only.</p>

      <div className="exam-ai-chip-row">
        {QUICK_PROMPTS.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className="exam-ai-chip"
            disabled={asking || loadingHistory}
            onClick={() => askQuestion(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>

      <div className="exam-ai-chat-box" aria-live="polite">
        {loadingHistory ? (
          <div className="exam-ai-empty">Loading chat...</div>
        ) : messages.length === 0 ? (
          <div className="exam-ai-empty">No messages yet. Start by asking a question about your lecture PDFs.</div>
        ) : (
          messages.map((msg, index) => (
            <article key={`${msg.role}-${index}`} className={`exam-ai-message ${msg.role === 'user' ? 'user' : 'assistant'}`}>
              <div className="exam-ai-role">{msg.role === 'user' ? 'You' : 'AI'}</div>
              <div className="exam-ai-content">{msg.content}</div>
              {msg.role === 'assistant' && Array.isArray(msg.sources) && msg.sources.length > 0 && (
                <div className="exam-ai-sources">
                  <div className="exam-ai-sources-title">Sources</div>
                  {msg.sources.map((source, srcIndex) => (
                    <div className="exam-ai-source-item" key={`${source.fileName || 'pdf'}-${srcIndex}`}>
                      <div className="exam-ai-source-name">{source.fileName || 'Lecture PDF'}</div>
                      <div className="exam-ai-source-excerpt">{source.excerpt || ''}</div>
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>

      <form className="exam-ai-form" onSubmit={onSubmit}>
        <input
          type="text"
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="Ask a question from your lecture PDFs..."
          disabled={asking || loadingHistory || !examId}
        />
        <button type="submit" className="btn-primary" disabled={!canAsk}>
          {asking ? 'Asking...' : 'Ask'}
        </button>
      </form>

      {mode === 'fallback' && <div className="exam-ai-hint">AI fallback mode: response was generated with limited service availability.</div>}
      {mode === 'quota_exceeded' && <div className="exam-ai-hint">AI provider quota exceeded for this API key. Add credits/billing or switch to a key with available quota.</div>}
      {mode === 'api_key_invalid' && <div className="exam-ai-hint">Invalid API key or provider mismatch. For Gemini, use GEMINI_API_KEY and OPENAI_BASE_URL as https://generativelanguage.googleapis.com/v1beta/openai.</div>}
      {mode === 'model_invalid' && <div className="exam-ai-hint">Configured model is not available for the selected provider. Update GEMINI_MODEL or OPENAI_MODEL and try again.</div>}
      {mode === 'provider_credits_missing' && <div className="exam-ai-hint">Your xAI/provider account has no credits or license access yet. Add credits in the provider console, then try again.</div>}
      {error && <div className="exam-error">{error}</div>}
    </section>
  );
};

export default ExamAiChatPanel;
