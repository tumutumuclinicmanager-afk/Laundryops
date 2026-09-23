import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  X, 
  Maximize2, 
  Minimize2, 
  RotateCcw, 
  ChevronDown, 
  Zap, 
  Cpu, 
  Check, 
  Copy,
  MessageSquare
} from 'lucide-react';
import { getExpertLaundryResponse } from '../utils/laundryKnowledge';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface GeminiChatbotProps {
  initialOpen?: boolean;
  onClose?: () => void;
  floating?: boolean;
  systemRole?: string;
}

const QUICK_SUGGESTIONS = [
  "☕ How do I remove fresh coffee stains from white shirts?",
  "📍 What are your pickup hours in Tumutumu & Karatina?",
  "🧼 How should medical scrubs and lab coats be sanitized?",
  "🧥 Can dry-clean-only wool coats be washed at home?",
  "⏱️ How fast is your standard turnaround time?"
];

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  initialOpen = false,
  onClose,
  floating = true,
  systemRole
}) => {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isExpanded, setIsExpanded] = useState(false);
  const [model, setModel] = useState<'gemini-3.5-flash' | 'gemini-3.1-flash-lite'>('gemini-3.5-flash');
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-msg',
      role: 'assistant',
      content: "Hello! ✨ I'm **Sparkle AI**, your personal laundry care specialist. Ask me anything about fabric care, stain removal, our free pickup & delivery services in **Tumutumu Hospital** and **Karatina**, or order scheduling!",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      inputRef.current?.focus();
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query || isLoading) return;

    const userMessage: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInputMessage('');
    setIsLoading(true);

    try {
      // Prepare payload with multi-turn history
      const payloadMessages = newHistory.map(m => ({
        role: m.role,
        text: m.content
      }));

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: payloadMessages,
          model,
          systemInstruction: systemRole
        })
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'API response was not ok');
      }

      const data = await response.json();
      const assistantMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: data.reply || getExpertLaundryResponse(query),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages([...newHistory, assistantMessage]);
    } catch (err: any) {
      console.warn('[GeminiChatbot] Server chat note, activating built-in knowledge engine:', err);
      const fallbackText = getExpertLaundryResponse(query);
      const assistantMessage: ChatMessage = {
        id: 'msg_ai_' + Date.now(),
        role: 'assistant',
        content: fallbackText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages([...newHistory, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-reset-' + Date.now(),
        role: 'assistant',
        content: "Chat cleared! ✨ How can I help you today with your laundry, garment care, or pickup schedule?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Simple Markdown Formatter for clean formatting without heavy external libraries
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return (
      <div className="space-y-1.5 text-sm leading-relaxed">
        {lines.map((line, idx) => {
          if (!line.trim()) {
            return <div key={idx} className="h-1" />;
          }

          // Format bold text **word**
          const parts = line.split(/(\*\*.*?\*\*)/g);
          const formattedLine = parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <strong key={pIdx} className="font-semibold text-white">{part.slice(2, -2)}</strong>;
            }
            return part;
          });

          // Bullet points
          if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-indigo-400 mt-1">•</span>
                <span>{formattedLine}</span>
              </div>
            );
          }

          // Numbered list
          const numMatch = line.trim().match(/^(\d+)\.\s+(.*)/);
          if (numMatch) {
            return (
              <div key={idx} className="flex items-start gap-2 pl-2">
                <span className="text-indigo-400 font-semibold">{numMatch[1]}.</span>
                <span>{formattedLine}</span>
              </div>
            );
          }

          return <p key={idx}>{formattedLine}</p>;
        })}
      </div>
    );
  };

  // Floating trigger button when collapsed
  if (floating && !isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-sky-500 text-white rounded-full shadow-2xl shadow-indigo-600/40 hover:shadow-indigo-500/60 hover:scale-105 active:scale-95 transition-all duration-300 border border-indigo-400/30 group cursor-pointer"
        aria-label="Open Gemini Chatbot"
      >
        <div className="relative">
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
            <Sparkles className="w-4 h-4 text-amber-300 group-hover:rotate-12 transition-transform" />
          </div>
          <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-400 rounded-full ring-2 ring-slate-950 animate-pulse" />
        </div>
        <div className="text-left">
          <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
            Sparkle AI Chat
            <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-white/20 uppercase tracking-widest">
              Gemini
            </span>
          </div>
          <div className="text-[11px] text-indigo-100 opacity-90">Ask anything or book pickup</div>
        </div>
      </button>
    );
  }

  const containerClasses = floating
    ? `fixed z-50 transition-all duration-300 shadow-2xl shadow-black/60 rounded-3xl border border-indigo-500/30 bg-slate-900/95 backdrop-blur-2xl flex flex-col overflow-hidden ${
        isExpanded
          ? 'inset-4 sm:inset-10'
          : 'bottom-6 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[440px] h-[600px] max-h-[85vh]'
      }`
    : 'w-full h-[600px] rounded-3xl border border-indigo-500/30 bg-slate-900/95 backdrop-blur-2xl flex flex-col overflow-hidden shadow-2xl';

  return (
    <div className={containerClasses}>
      {/* Header */}
      <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-lg shadow-indigo-600/30 border border-indigo-400/30">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white tracking-tight">Sparkle AI Assistant</h3>
              <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Online
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Powered by Google Gemini</p>
          </div>
        </div>

        {/* Model Selector & Controls */}
        <div className="flex items-center gap-1.5">
          {/* Fast vs General toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-0.5 text-[11px]">
            <button
              onClick={() => setModel('gemini-3.5-flash')}
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                model === 'gemini-3.5-flash'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Gemini 3.5 Flash (General & Detailed)"
            >
              <Cpu className="w-3 h-3" />
              <span className="hidden sm:inline">3.5 Flash</span>
            </button>
            <button
              onClick={() => setModel('gemini-3.1-flash-lite')}
              className={`px-2 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1 ${
                model === 'gemini-3.1-flash-lite'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Gemini 3.1 Flash Lite (Fast)"
            >
              <Zap className="w-3 h-3 text-amber-300" />
              <span className="hidden sm:inline">Lite</span>
            </button>
          </div>

          <button
            onClick={handleResetChat}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Clear Chat History"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {floating && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer hidden sm:block"
                title={isExpanded ? 'Collapse view' : 'Expand view'}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  if (onClose) onClose();
                }}
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
        {messages.map((msg) => {
          const isAi = msg.role === 'assistant';
          return (
            <div
              key={msg.id}
              className={`flex items-start gap-3 group ${
                isAi ? 'justify-start' : 'justify-end'
              }`}
            >
              {isAi && (
                <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-4 h-4 text-indigo-400" />
                </div>
              )}

              <div
                className={`relative max-w-[85%] rounded-2xl p-3.5 shadow-md ${
                  isAi
                    ? 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-xs'
                    : 'bg-indigo-600 text-white rounded-tr-xs shadow-indigo-600/20'
                }`}
              >
                {isAi ? renderFormattedContent(msg.content) : (
                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                )}

                <div className={`flex items-center justify-between gap-4 mt-2 pt-1 text-[10px] ${isAi ? 'text-slate-400 border-t border-slate-700/40' : 'text-indigo-200'}`}>
                  <span>{msg.timestamp}</span>
                  {isAi && (
                    <button
                      onClick={() => copyToClipboard(msg.id, msg.content)}
                      className="opacity-0 group-hover:opacity-100 hover:text-white transition-opacity flex items-center gap-1 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedId === msg.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {!isAi && (
                <div className="w-7 h-7 rounded-xl bg-indigo-500 flex items-center justify-center shrink-0 mt-0.5">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          );
        })}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-xl bg-indigo-600/30 border border-indigo-500/30 flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-indigo-400 animate-spin" />
            </div>
            <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl rounded-tl-xs p-3.5 text-slate-300 text-sm flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-400 ml-1">Sparkle AI is typing...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Suggestions (if only welcome message exists or on idle) */}
      {messages.length <= 2 && !isLoading && (
        <div className="px-4 py-2 border-t border-slate-800/60 bg-slate-950/40">
          <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-indigo-400" />
            Suggested Questions:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_SUGGESTIONS.map((sug, i) => (
              <button
                key={i}
                onClick={() => handleSendMessage(sug)}
                className="text-xs text-left px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-indigo-600/30 text-slate-300 hover:text-white border border-slate-700/50 hover:border-indigo-500/50 transition-all cursor-pointer"
              >
                {sug}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input Box */}
      <div className="p-3 bg-slate-950 border-t border-slate-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2 bg-slate-900 border border-slate-700/80 rounded-2xl p-2 focus-within:border-indigo-500 transition-all"
        >
          <textarea
            ref={inputRef}
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about stains, fabric care, or scheduling..."
            className="flex-1 bg-transparent text-sm text-white placeholder:text-slate-500 resize-none px-2 py-1 focus:outline-none max-h-24 min-h-[36px]"
          />

          <button
            type="submit"
            disabled={!inputMessage.trim() || isLoading}
            className="p-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:hover:bg-indigo-600 text-white shadow-md shadow-indigo-600/30 transition-all cursor-pointer shrink-0"
            title="Send Message"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="flex items-center justify-between text-[10px] text-slate-500 px-1 mt-1.5">
          <span>Press Enter to send, Shift+Enter for new line</span>
          <span>Gemini AI • Sparkle Spins</span>
        </div>
      </div>
    </div>
  );
};
export default GeminiChatbot;
