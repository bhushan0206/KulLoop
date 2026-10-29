import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RotateCcw, 
  X, 
  Maximize2, 
  Minimize2,
  Info,
  Loader2
} from 'lucide-react';
import { UserProfile } from '../services/firebase';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialPrompt?: string;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'model',
      text: `Namaskar ${currentUser.displayName.split(' ')[0]}! 🙏 I am your **KulLoop Heritage & Tithi Assistant** (संस्कार व कुलधर्म मार्गदर्शक).\n\nI can help you understand your family’s tithis, shraddha preparation checklists, the differences between Amanta and Purnimanta traditions, and how to preserve your family's sacred memories calmly. How may I assist your family today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-4-argon'>('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build conversation history for multi-turn chat
      const historyPayload = [...messages, userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: historyPayload,
          userInterests: currentUser.interests,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `Server responded with ${res.status}`);
      }

      const data = await res.json();
      const modelMsg: ChatMessage = {
        id: `model_${Date.now()}`,
        role: 'model',
        text: data.reply || 'I am here to guide your family tithi traditions.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: `Namaskar. I ran into an issue connecting to the Gemini engine: ${err.message}. If you are in development mode, please verify your GEMINI_API_KEY. In the meantime, I am happy to assist with standard panchang guidelines!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    "Why do tithi dates shift on the English calendar each year?",
    "What is the difference between Amanta and Purnimanta months?",
    "What items should be kept ready for an ancestor's shraddha?",
    "How does KulLoop calculate local sunrise for diaspora relatives?",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/70 backdrop-blur-sm">
      <div className="bg-white rounded-2xl border border-stone-200 shadow-2xl max-w-2xl w-full h-[620px] max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-stone-900 text-white px-5 py-3.5 flex items-center justify-between shrink-0 border-b border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-400 text-stone-950 flex items-center justify-center font-bold text-xs">
              <Sparkles className="w-4 h-4 text-stone-950" />
            </div>
            <div>
              <div className="font-bold text-sm font-serif-display text-amber-200">
                KulLoop Heritage Assistant
              </div>
              <div className="text-[10px] text-stone-400 flex items-center gap-2">
                <span>Multi-turn Gemini AI</span>
                <span aria-hidden="true">·</span>
                <span className="font-mono text-amber-300">{selectedModel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Selector */}
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as any)}
              className="text-[11px] bg-stone-800 text-stone-300 border border-stone-700 rounded-md px-2 py-1 focus:outline-none"
              title="Select Gemini Model"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (General)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast)</option>
              <option value="gemini-4-argon">gemini-4-argon (Complex)</option>
            </select>

            <button
              onClick={() => {
                setMessages([
                  {
                    id: 'welcome_1',
                    role: 'model',
                    text: `Conversation restarted. How may I assist your family with tithis, shraddhas, or heritage questions today?`,
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  },
                ]);
              }}
              className="p-1 text-stone-400 hover:text-white rounded cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={onClose}
              className="p-1 text-stone-400 hover:text-white rounded cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-stone-50/70 text-xs leading-relaxed">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}

              <div
                className={`p-3.5 rounded-2xl max-w-[85%] whitespace-pre-wrap ${
                  msg.role === 'user'
                    ? 'bg-stone-900 text-white rounded-tr-xs shadow-2xs'
                    : 'bg-white text-stone-800 rounded-tl-xs border border-stone-200 shadow-2xs'
                }`}
              >
                {msg.text}
                <div
                  className={`text-[9px] mt-1 text-right ${
                    msg.role === 'user' ? 'text-stone-400' : 'text-stone-400'
                  }`}
                >
                  {msg.timestamp}
                </div>
              </div>

              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-full bg-stone-200 text-stone-700 flex items-center justify-center shrink-0 mt-0.5 font-bold text-[11px]">
                  {currentUser.displayName.charAt(0)}
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-stone-500 text-xs bg-white p-3 rounded-2xl border border-stone-200 w-fit">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-600" />
              <span>Consulting KulLoop Heritage Knowledge...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick prompt chips */}
        <div className="p-2.5 bg-stone-100 border-t border-stone-200 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <span className="text-[10px] text-stone-500 shrink-0 font-medium">Ask:</span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="text-[11px] px-2.5 py-1 bg-white hover:bg-stone-50 border border-stone-200 rounded-full whitespace-nowrap text-stone-700 cursor-pointer disabled:opacity-50 shrink-0"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Ask about your family tithis, shraddhas, vrats, or traditions..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-amber-400 hover:bg-amber-300 text-stone-950 font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
