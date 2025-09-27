import React, { useEffect, useRef, useState } from 'react';
import './ChatMessages.css';

const ChatMessages = ({ messages, isSending }) => {
  const bottomRef = useRef(null);

  const [voices, setVoices] = useState([]);
  const [speaking, setSpeaking] = useState(false);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isSending]);

  // Load voices for speech synthesis
  useEffect(() => {
    const loadVoices = () => {
      const v = speechSynthesis.getVoices();
      setVoices(v);
    };

    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }, []);

  // Speak / toggle speech
  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;

    if (speaking) {
      // Stop speaking if already in progress
      speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Reset previous speech & create new utterance
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);

    if (voices.length > 0) {
      utterance.voice =
        voices.find(v => v.name.includes('Google UK English Female')) || voices[0];
    }

    utterance.rate = 1.3;
    utterance.pitch = 1.7;

    utterance.onend = () => setSpeaking(false);
    speechSynthesis.speak(utterance);
    setSpeaking(true);
  };

  // 🔴 Utility: Detect if a message is an error
  const isErrorMessage = (msg) => {
    if (msg.type !== 'ai') return false;
    const content = msg.content.toLowerCase();
    return (
      content.includes('error occurred') ||
      content.includes('connection lost') ||
      content.includes('authentication error')
    );
  };

  return (
    <div className="messages" aria-live="polite">
      {messages.map((m, index) => {
        const error = isErrorMessage(m);

        return (
          <div
            key={index}
            className={`msg msg-${m.type} ${error ? 'msg-error' : ''}`}
            role={error ? 'alert' : undefined} // screen readers will announce error
          >
            <div className="msg-role" aria-hidden="true">
              {m.type === 'user' ? 'You' : 'AI'}
            </div>

            {/* Bubble text */}
            <div className="msg-bubble">
              {error && (
                <span className="error-icon" aria-hidden="true">
                  ⚠️
                </span>
              )}
              {m.content}
            </div>

            {/* Hide actions if it's an error */}
            {!error && (
              <div
                className="msg-actions"
                role="group"
                aria-label="Message actions"
              >
                {/* Copy button */}
                <button
                  type="button"
                  aria-label="Copy message"
                  onClick={() => navigator.clipboard.writeText(m.content)}
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                </button>

                {/* AI-specific actions */}
                {m.type === 'ai' && (
                  <>
                    {/* Like */}
                    <button type="button" aria-label="Like response">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M7 10v11" />
                        <path d="M15 21H9a2 2 0 0 1-2-2v-9l5-7 1 1a2 2 0 0 1 .5 1.3V9h5a2 2 0 0 1 2 2l-2 8a2 2 0 0 1-2 2Z" />
                      </svg>
                    </button>

                    {/* Dislike */}
                    <button type="button" aria-label="Dislike response">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M17 14V3" />
                        <path d="M9 3h6a2 2 0 0 1 2 2v9l-5 7-1-1a2 2 0 0 1-.5-1.3V15H5a2 2 0 0 1-2-2l2-8a2 2 0 0 1 2-2Z" />
                      </svg>
                    </button>

                    {/* Speak / Stop button */}
                    <button
                      type="button"
                      aria-label="Speak message"
                      onClick={() => speakText(m.content)}
                      style={{ color: speaking ? 'orange' : 'currentColor' }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M5 8v8" />
                        <path d="M8 4v16" />
                        <path d="M12 2v20" />
                        <path d="M19 5c1.5 2 1.5 12 0 14" />
                        <path d="M16 8c.8 1 1 7 0 8" />
                      </svg>
                    </button>

                    {/* Regenerate */}
                    <button
                      type="button"
                      aria-label="Regenerate"
                      onClick={() => {
                        /* placeholder for regenerate logic */
                      }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M2 12A10 10 0 0 1 12 2c2.5 0 4.8 1 6.5 2.5L22 8" />
                        <path d="M22 2v6h-6" />
                        <path d="M22 12a10 10 0 0 1-10 10c-2.5 0-4.8-1-6.5-2.5L2 16" />
                        <path d="M2 22v-6h6" />
                      </svg>
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Pending AI typing indicator */}
      {isSending && (
        <div className="msg msg-ai pending">
          <div className="msg-role" aria-hidden="true">
            AI
          </div>
          <div className="msg-bubble typing-dots" aria-label="AI is typing">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
};

export default ChatMessages;
