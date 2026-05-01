"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
  memo,
  type KeyboardEvent,
  type FormEvent,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, ChevronRight, Loader2, Sparkles } from "lucide-react";
import type { ChatMessage } from "@/lib/chatbot";
import { processMessage, getWelcomeMessage } from "@/lib/chatbot";
import type { MenuItem } from "@/types/index";

// ─── Security: safe bold text renderer ────────────────────────────────────────
// Replaces dangerouslySetInnerHTML — parses **bold** without eval'ing HTML.
function BotText({ text }: { text: string }) {
  const segments = text.split(/(\*\*[^*\n]+\*\*)/);
  return (
    <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
      {segments.map((seg, i) =>
        seg.startsWith("**") && seg.endsWith("**") ? (
          <strong key={i} className="font-semibold text-slate-900">
            {seg.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{seg}</span>
        )
      )}
    </p>
  );
}

// ─── Quick-reply chips ────────────────────────────────────────────────────────

const QUICK_REPLIES = [
  "Today's menu",
  "Breakfast",
  "Lunch",
  "Dinner",
  "High protein",
  "Low calorie",
  "Veg only",
  "Mess timings",
];

// ─── Message bubble ───────────────────────────────────────────────────────────

const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const isBot = message.role === "bot";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22 }}
      className={`flex items-end gap-2 ${isBot ? "justify-start" : "justify-end"}`}
    >
      {/* Avatar — bot only */}
      {isBot && (
        <div className="w-7 h-7 rounded-xl bg-primary-100 flex items-center justify-center shrink-0 mb-0.5">
          <Bot size={14} className="text-primary-600" />
        </div>
      )}

      <div className={`flex flex-col gap-1.5 max-w-[80%] ${isBot ? "items-start" : "items-end"}`}>
        {/* Text bubble */}
        <div
          className={`px-4 py-2.5 rounded-2xl ${
            isBot
              ? "bg-white border border-slate-100 shadow-sm text-slate-700 rounded-bl-sm"
              : "bg-primary-500 text-white rounded-br-sm"
          }`}
        >
          {isBot ? (
            <BotText text={message.text} />
          ) : (
            <p className="text-sm leading-relaxed break-words">{message.text}</p>
          )}
        </div>

        {/* Dish chips */}
        {isBot && message.items && message.items.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-1">
            {message.items.slice(0, 6).map((item: MenuItem) => (
              <span
                key={item.id}
                className="text-[11px] font-medium px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full border border-slate-200"
              >
                {item.name}
                <span className="text-slate-400 ml-1">{item.calories} kcal</span>
              </span>
            ))}
            {message.items.length > 6 && (
              <span className="text-[11px] text-slate-400 self-center">
                +{message.items.length - 6} more
              </span>
            )}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-slate-300 px-1">
          {new Date(message.timestamp).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Avatar — user only */}
      {!isBot && (
        <div className="w-7 h-7 rounded-xl bg-slate-100 flex items-center justify-center shrink-0 mb-0.5">
          <User size={14} className="text-slate-500" />
        </div>
      )}
    </motion.div>
  );
});

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.2 }}
      className="flex items-end gap-2"
    >
      <div className="w-7 h-7 rounded-xl bg-primary-100 flex items-center justify-center shrink-0">
        <Bot size={14} className="text-primary-600" />
      </div>
      <div className="bg-white border border-slate-100 shadow-sm rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-slate-300"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const MAX_INPUT = 500;

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    getWelcomeMessage(),
  ]);
  const [input, setInput]       = useState("");
  const [isTyping, setTyping]   = useState(false);
  const bottomRef               = useRef<HTMLDivElement>(null);
  const textareaRef             = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // ── Send a message ─────────────────────────────────────────────────────────

  const send = useCallback(function send(text: string) {
    // Sanitize: trim and hard-cap length to prevent abuse
    const trimmed = text.trim().slice(0, MAX_INPUT);
    if (!trimmed) return;

    const userMsg: ChatMessage = {
      id:        Math.random().toString(36).slice(2),
      role:      "user",
      text:      trimmed,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);

    // Simulate a brief "thinking" delay (purely for UX)
    setTimeout(() => {
      const reply = processMessage(trimmed);
      setTyping(false);
      setMessages((prev) => [...prev, reply]);
    }, 350 + Math.random() * 200);
  }, []);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  // Auto-resize textarea
  function handleInput() {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-56px)] md:h-screen max-w-2xl mx-auto">
      {/* Header */}
      <div className="shrink-0 px-4 md:px-6 py-4 border-b border-slate-100 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center shadow-soft">
              <Bot size={18} className="text-white" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-900">MealBot</p>
            <p className="text-[11px] text-slate-400 flex items-center gap-1">
              <Sparkles size={9} className="text-primary-400" />
              Offline AI · no data leaves your device
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 space-y-4 bg-slate-50/50">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isTyping && <TypingIndicator key="typing" />}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Quick replies */}
      <div className="shrink-0 px-4 md:px-6 pt-2 pb-1 bg-white border-t border-slate-100 overflow-x-auto scrollbar-none">
        <div className="flex gap-2 w-max">
          {QUICK_REPLIES.map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={isTyping}
              className="flex items-center gap-1 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-primary-50 hover:text-primary-600 px-3 py-1.5 rounded-full transition-colors whitespace-nowrap disabled:opacity-50"
            >
              <ChevronRight size={11} />
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="shrink-0 px-4 md:px-6 py-3 bg-white border-t border-slate-100">
        <form onSubmit={handleSubmit} className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value.slice(0, MAX_INPUT))}
            onKeyDown={handleKeyDown}
            onInput={handleInput}
            placeholder="Ask about today's menu, nutrition…"
            rows={1}
            maxLength={MAX_INPUT}
            className="flex-1 resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-300 leading-relaxed"
            style={{ maxHeight: 120 }}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:bg-slate-200 text-white flex items-center justify-center transition-colors shrink-0"
            aria-label="Send message"
          >
            {isTyping ? (
              <Loader2 size={16} className="animate-spin text-slate-400" />
            ) : (
              <Send size={15} />
            )}
          </button>
        </form>
        <p className="text-[10px] text-slate-300 text-center mt-1.5">
          Fully offline · your messages never leave this device
        </p>
      </div>
    </div>
  );
}
