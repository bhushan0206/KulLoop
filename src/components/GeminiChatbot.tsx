import React, { useState, useRef, useEffect } from 'react';
import { apiUrl } from '../utils/apiBase';
import { 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  RotateCcw, 
  X, 
  Loader2,
  Volume2,
  VolumeX
} from 'lucide-react';
import { UserProfile } from '../services/firebase';
import { VoiceAssistant } from './VoiceAssistant';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
  modelUsed?: string;
  isFallback?: boolean;
  isError?: boolean;
  failedQuery?: string;
}

interface GeminiChatbotProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  initialPrompt?: string;
  simpleUi?: boolean;
  familyContext?: string;
}

export const GeminiChatbot: React.FC<GeminiChatbotProps> = ({
  isOpen,
  onClose,
  currentUser,
  initialPrompt,
  simpleUi,
  familyContext,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome_1',
      role: 'model',
      text: `Namaskar ${currentUser.displayName.split(' ')[0]}! 🙏 I am your KulLoop Heritage Assistant — calm guidance on tithis and family rituals.\n\nFor step-by-step prep guides, we point you to our partner MyDharohar (mydharohar.org). I explain timing and tradition; I do not predict astrology or sell fear.\n\nWhat would you like to ask?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: 'gemini-3.8-flash',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<'gemini-3.8-flash' | 'gemini-3.1-flash-lite'>('gemini-3.8-flash');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const playBotResponseTTS = async (text: string, msgId: string) => {
    setIsPlaying(msgId);
    try {
      const response = await fetch(apiUrl('/api/gemini/tts'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (data.audioBase64) {
        const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
        audio.onended = () => setIsPlaying(null);
        audio.play();
      }
    } catch (err) {
      console.error('TTS error:', err);
      setIsPlaying(null);
    }
  };

  useEffect(() => {
    if (initialPrompt && isOpen) {
      setInput(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string, overrideModel?: 'gemini-3.8-flash' | 'gemini-3.1-flash-lite') => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const activeModel = overrideModel || selectedModel;

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
      const validHistory = [...messages.filter(m => !m.isError), userMsg].map((m) => ({
        role: m.role,
        text: m.text,
      }));

      const res = await fetch(apiUrl('/api/gemini/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: validHistory,
          userInterests: currentUser.interests,
          model: activeModel,
          familyContext,
          simpleUi: !!simpleUi,
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
        modelUsed: data.modelUsed || activeModel,
        isFallback: !!data.isFallback,
      };

      setMessages((prev) => [...prev, modelMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const rawError = err?.message || 'Connection error';
      const isHighDemand = rawError.includes('503') || rawError.includes('UNAVAILABLE') || rawError.includes('high demand');

      const friendlyText = isHighDemand
        ? `Namaskar. The standard Gemini model is currently experiencing peak demand. Our resilient engine can switch to **Gemini 3.1 Flash Lite** or deliver answers via the built-in **KulLoop Vedic Reference Guide** without interruption.`
        : `Namaskar. We experienced a momentary connection issue: ${rawError}. Please try again or switch to our high-availability model.`;

      const errMsg: ChatMessage = {
        id: `err_${Date.now()}`,
        role: 'model',
        text: friendlyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isError: true,
        failedQuery: text.trim(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = simpleUi
    ? [
        'What should we prepare before the next shraddha on our calendar?',
        'One calm WhatsApp message to remind elders about tithi birthdays',
      ]
    : [
        'What should we prepare before shraddha? (and when to open MyDharohar guide)',
        'Amanta vs Purnimanta — which does our Maharashtra family use?',
        'How do I explain tithi birthdays to elders on WhatsApp?',
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
              <div className="text-[10px] text-stone-400">
                {simpleUi ? 'Short answers · no fear astrology' : `Heritage AI · ${selectedModel}`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {!simpleUi && (
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value as 'gemini-3.8-flash' | 'gemini-3.1-flash-lite')}
              className="text-[11px] bg-stone-800 text-stone-300 border border-stone-700 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
              title="Select Gemini Model"
            >
              <option value="gemini-3.8-flash">gemini-3.8-flash (Standard)</option>
              <option value="gemini-3.1-flash-lite">gemini-3.1-flash-lite (Fast & Resilient)</option>
            </select>
            )}

            <button
              onClick={() => {
                setMessages([{
                  id: 'welcome_1',
                  role: 'model',
                  text: `Conversation restarted. How may I assist your family with tithis, shraddhas, or heritage questions today?`,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                  modelUsed: selectedModel,
                }]);
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
          <div className="flex flex-wrap gap-2 pb-2">
            {samplePrompts.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => handleSendMessage(prompt)}
                className="text-left px-2.5 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-[11px] text-amber-950 hover:bg-amber-100 min-h-[36px]"
              >
                {prompt}
              </button>
            ))}
          </div>
          {messages.map((msg) => (
            <div key={msg.id} className={`flex items-start gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'model' && (
                <div className="w-7 h-7 rounded-full border bg-amber-100 text-amber-900 border-amber-300 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
              )}
              <div className={`p-3.5 rounded-2xl max-w-[85%] ${msg.role === 'user' ? 'bg-stone-900 text-white rounded-tr-xs' : 'bg-white text-stone-800 rounded-tl-xs border border-stone-200'}`}>
                <div className="whitespace-pre-wrap">{msg.text}</div>
                {msg.role === 'model' && (
                  <button onClick={() => playBotResponseTTS(msg.text, msg.id)} className="mt-2 text-stone-400 hover:text-amber-600 transition-colors">
                    {isPlaying === msg.id ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                  </button>
                )}
                {msg.isError && msg.failedQuery && (
                   <div className="mt-3 pt-2.5 border-t border-amber-200/80 flex gap-2">
                     <button onClick={() => { setSelectedModel('gemini-3.1-flash-lite'); handleSendMessage(msg.failedQuery, 'gemini-3.1-flash-lite'); }} className="px-2.5 py-1 text-[11px] font-semibold bg-amber-400 rounded-lg">Retry (Flash-Lite)</button>
                   </div>
                )}
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

        {/* Input Bar */}
        <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="p-3 bg-white border-t border-stone-200 flex items-center gap-2 shrink-0">
          <VoiceAssistant onTranscript={(text) => setInput(text)} />
          <input
            type="text"
            placeholder="Ask about your family tithis..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-3.5 py-2 text-xs bg-stone-50 border border-stone-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-amber-500 text-stone-900"
          />
          <button type="submit" disabled={!input.trim() || isLoading} className="p-2.5 bg-amber-400 rounded-xl">
            <Send className="w-4 h-4 text-stone-950" />
          </button>
        </form>
      </div>
    </div>
  );
};
