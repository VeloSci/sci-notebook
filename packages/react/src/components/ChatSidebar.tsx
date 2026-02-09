/**
 * AI Chat Sidebar for sci-notebook.
 *
 * Provides a conversational interface for interacting with AI providers.
 * Supports sending messages, receiving streamed responses, and applying
 * suggestions to cells.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useSciNotebook } from "../hooks";

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  cellRefs?: string[];
}

export interface ChatSidebarProps {
  /** Function to send a message to the AI provider */
  onSend?: (message: string, history: ChatMessage[]) => Promise<string>;
  /** Initial system prompt */
  systemPrompt?: string;
  /** Callback when user wants to apply a suggestion to a cell */
  onApply?: (content: string, cellId?: string) => void;
  /** Close handler */
  onClose?: () => void;
}

export const ChatSidebar: React.FC<ChatSidebarProps> = ({
  onSend,
  systemPrompt,
  onApply,
  onClose,
}) => {
  const engine = useSciNotebook();
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    if (systemPrompt) {
      return [{ role: "system", content: systemPrompt, timestamp: Date.now() }];
    }
    return [];
  });
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = { role: "user", content: text, timestamp: Date.now() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      if (onSend) {
        const response = await onSend(text, newMessages);
        setMessages(prev => [
          ...prev,
          { role: "assistant", content: response, timestamp: Date.now() },
        ]);
      } else {
        // No provider — show placeholder
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            content: "No AI provider configured. Pass an `onSend` prop to enable AI chat.",
            timestamp: Date.now(),
          },
        ]);
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${e.message || "Failed to get response"}`,
          timestamp: Date.now(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, messages, loading, onSend]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const visibleMessages = messages.filter(m => m.role !== "system");

  return (
    <div className="sci-nb-chat-sidebar">
      <div className="sci-nb-chat-header">
        <span>AI Assistant</span>
        {onClose && (
          <button
            onClick={onClose}
            style={{ border: "none", background: "transparent", cursor: "pointer", fontSize: 16 }}
          >
            ✕
          </button>
        )}
      </div>

      <div className="sci-nb-chat-messages">
        {visibleMessages.length === 0 && (
          <div style={{ textAlign: "center", color: "#94a3b8", padding: 24 }}>
            Ask me anything about your notebook...
          </div>
        )}
        {visibleMessages.map((msg, i) => (
          <div key={i} className={`sci-nb-chat-msg sci-nb-chat-msg--${msg.role}`}>
            <div>{msg.content}</div>
            {msg.role === "assistant" && onApply && (
              <button
                onClick={() => onApply(msg.content)}
                style={{
                  marginTop: 4,
                  fontSize: 11,
                  padding: "2px 6px",
                  border: "1px solid #e2e8f0",
                  borderRadius: 4,
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                Apply to cell
              </button>
            )}
          </div>
        ))}
        {loading && (
          <div className="sci-nb-chat-msg sci-nb-chat-msg--assistant" style={{ opacity: 0.6 }}>
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="sci-nb-chat-input">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask something..."
          disabled={loading}
        />
        <button onClick={handleSend} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
};
