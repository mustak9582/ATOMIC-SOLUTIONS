import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, User, Sparkles, Mic, MicOff, AlertCircle, Volume2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WHATSAPP_NUMBER } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  time: Date;
}

// Check for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function AtomicBotInner() {
  const { user, profile, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      text: "Hi there! 👋 I'm Atomic Bot, your AI assistant.",
      isBot: true,
      time: new Date()
    },
    {
      id: 'welcome-2',
      text: "How can I help you today? I can answer questions about our services, or search the world's knowledge on how to fix and maintain things!",
      isBot: true,
      time: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const isStoppedRef = useRef(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);


  useEffect(() => {
    if (SpeechRecognition) {
      try {
        const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-IN'; // Works well for Indian English and Hindi-English mix
      
      rec.onstart = () => {
        setIsListening(true);
      };
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        // Just put the text in the input box, wait for user to hit send
        setInputMessage((prev) => prev ? prev + ' ' + transcript : transcript);
      };
      
      rec.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };
      
      rec.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(rec);
      
      } catch (err) {
        console.error("Speech recognition initialization failed:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isTyping) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [isTyping]);

  const handleSpeak = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) {
        alert("Sorry, your browser doesn't support reading text aloud.");
        return;
      }
      
      isStoppedRef.current = false;
      window.speechSynthesis.cancel();
      
      const cleanText = text.replace(/[*#_`]/g, '');
      
      // Auto-detect Hindi (Devanagari) OR Hinglish (Romanized Hindi)
      const hasHindiScript = /[\u0900-\u097F]/.test(cleanText);
      const hinglishWords = /\b(hai|aur|ke|ki|kare|kaise|kya|liye|hota|hoti|hote|karna|karne|mein|me|aap|apko|hum|ye|wo|nahi|haan|kaam|ka)\b/i;
      const isHindi = hasHindiScript || hinglishWords.test(cleanText);
      const langCode = isHindi ? 'hi-IN' : 'en-IN';
      
      // Select the most professional voice available
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;
      if (voices.length > 0) {
        if (isHindi) {
          selectedVoice = voices.find(v => 
            v.name.includes('Swara') || 
            v.name.includes('Lekha') || 
            v.name.includes('Google हिन्दी') || 
            v.name.includes('Google Hindi')
          ) || voices.find(v => v.lang.includes('hi'));
        } else {
          selectedVoice = voices.find(v => 
            v.name.includes('Neerja') || 
            v.name.includes('Rishi') || 
            (v.name.includes('Google') && v.lang.includes('en-IN'))
          ) || voices.find(v => v.lang.includes('en-IN')) || voices.find(v => v.lang.startsWith('en'));
        }
      }
      
      // Split text by newlines or full stops to avoid 200-character limits in Chrome Android
      const chunks = cleanText.match(/[^.!?\n]+[.!?\n]+/g) || [cleanText];
      let currentChunkIndex = 0;
      
      const speakNextChunk = () => {
        if (isStoppedRef.current || currentChunkIndex >= chunks.length) return;
        
        let chunk = chunks[currentChunkIndex].trim();
        if (!chunk) {
          currentChunkIndex++;
          speakNextChunk();
          return;
        }
        
        const utterance = new SpeechSynthesisUtterance(chunk);
        utterance.lang = langCode;
        if (selectedVoice) {
          utterance.voice = selectedVoice;
        }
        // Slightly slower for Hindi for a more clear, professional feel
        utterance.rate = isHindi ? 0.95 : 1.0; 
        
        utterance.onend = () => {
          if (isStoppedRef.current) return;
          currentChunkIndex++;
          speakNextChunk();
        };
        
        utterance.onerror = (e) => {
          if (isStoppedRef.current || e.error === 'canceled' || e.error === 'interrupted') return;
          console.error("Chunk TTS Error: ", e);
          currentChunkIndex++;
          speakNextChunk();
        };
        
        (window as any)._currentUtterance = utterance;
        window.speechSynthesis.speak(utterance);
      };
      
      speakNextChunk();
      
    } catch (error) {
      console.error("Speech exception:", error);
    }
  };

  const handleStop = () => {
    isStoppedRef.current = true;
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const toggleListening = () => {
    if (isListening) {
      recognition?.stop();
    } else {
      recognition?.start();
    }
  };

  const fetchAIResponse = async (userText: string) => {
    try {
      // Artificial delay to feel like a real bot thinking
      await new Promise(resolve => setTimeout(resolve, 800));

      const text = userText.toLowerCase();

      if (text.includes('price') || text.includes('cost') || text.includes('how much') || text.includes('pricing') || text.includes('packages')) {
        return "Our pricing depends on the service and tier you choose (Basic, Premium, or Enterprise). For specific pricing, please check the Services tab or contact us on WhatsApp for a custom quote!";
      }
      
      if (text.includes('book') || text.includes('hire') || text.includes('appointment') || text.includes('schedule')) {
        return "You can easily book a service by clicking the 'Book Now' or 'Hire Us' buttons anywhere on the website! We will assign a professional right away.";
      }

      if (text.includes('location') || text.includes('where') || text.includes('address') || text.includes('city') || text.includes('office')) {
        return "We are based locally, but we provide services across the entire city. Feel free to contact us on WhatsApp to confirm your specific area!";
      }

      if (text.includes('contact') || text.includes('help') || text.includes('support') || text.includes('whatsapp') || text.includes('phone') || text.includes('call')) {
        return `You can reach us immediately via WhatsApp using the button on the bottom left, or call us directly!`;
      }

      if (text.includes('admin') || text.includes('login') || text.includes('dashboard') || text.includes('staff')) {
        return "If you are an admin or staff member, please use the login page to access your dashboard.";
      }

      if (text.includes('hi') || text.includes('hello') || text.includes('hey') || text.includes('namaste')) {
        return "Hello! How can I assist you with Atomic Solutions today? You can ask about our services, pricing, or how to book.";
      }

      if (text.includes('service') || text.includes('what do you do') || text.includes('features') || text.includes('about')) {
        return "Atomic Solutions is a premium home maintenance, construction, and HVAC company. We offer everything from AC servicing and plumbing to full home renovations. Check our Services page for the full list!";
      }

      // Default Fallback
      return "I am currently running in offline FAQ mode. I might not understand complex questions right now! For detailed answers, please check our Services page or contact us directly on WhatsApp!";
    } catch (error: any) {
      console.error("Bot Error:", error);
      return `⚠️ Sorry, my brain encountered an error: ${error.message}.`;
    }
  };

  const handleSendVoice = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg: Message = { id: Date.now().toString(), text: text.trim(), isBot: false, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const botReplyText = await fetchAIResponse(text.trim());
    
    const botMsg: Message = { id: (Date.now() + 1).toString(), text: botReplyText, isBot: true, time: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const currentText = inputMessage;
    const userMsg: Message = { id: Date.now().toString(), text: currentText.trim(), isBot: false, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    const botReplyText = await fetchAIResponse(currentText.trim());
    
    const botMsg: Message = { id: (Date.now() + 1).toString(), text: botReplyText, isBot: true, time: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  return (
    <>
      <div className="fixed bottom-[100px] sm:bottom-6 right-6 z-[9999] flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-[340px] sm:w-[380px] h-[550px] mb-4 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-navy text-white flex justify-between items-center rounded-t-[24px] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-teal/20 to-transparent pointer-events-none" />
                <div className="flex items-center gap-3 relative z-10">
                  <motion.div 
                    animate={{ rotateY: 360 }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg border-2 border-white/20 p-1"
                  >
                    <img src="/logo_small.png" alt="Atomic" className="w-full h-full object-contain" />
                  </motion.div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-extrabold text-sm tracking-wide">Atomic Bot</h3>
                      <span className="px-1.5 py-0.5 bg-teal/20 text-teal-100 text-[8px] font-black uppercase tracking-widest rounded-full border border-teal/30 flex items-center gap-1">
                        <Sparkles size={8} /> AI
                      </span>
                    </div>
                    <p className="text-[10px] text-teal-100 font-medium mt-0.5">Global AI Knowledge enabled</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="hover:bg-white/10 p-2 rounded-full transition-colors relative z-10"
                >
                  <X size={20} />
                </button>
              </div>



              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50 flex flex-col gap-4 scrollbar-hide">
                {messages.map((msg) => (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={msg.id} 
                    className={`flex flex-col ${msg.isBot ? 'items-start' : 'items-end'}`}
                  >
                    <div className={`max-w-[85%] text-sm shadow-sm relative ${
                      msg.isBot 
                        ? 'bg-white text-navy border border-gray-100 rounded-2xl rounded-tl-sm' 
                        : 'px-4 py-3 bg-teal text-white rounded-2xl rounded-tr-sm shadow-[0_4px_14px_0_rgba(15,118,110,0.39)]'
                    }`}>
                      {msg.isBot && (
                        <div className="flex justify-between items-center border-b border-gray-50 sticky top-0 bg-white/95 backdrop-blur-md z-10 px-4 py-2 shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)] rounded-t-[15px] rounded-tl-sm">
                          <span className="text-[10px] font-bold text-teal flex items-center gap-1">
                            <Bot size={12} /> Atomic Bot
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleSpeak(msg.text)} 
                              className="text-teal flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity active:scale-95 bg-teal/5 px-2 py-1 rounded-md"
                              title="Read Aloud"
                            >
                              <Volume2 size={12} />
                              <span className="text-[9px] font-bold tracking-wider uppercase">Listen</span>
                            </button>
                            <button 
                              onClick={handleStop} 
                              className="text-rose-500 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity active:scale-95 bg-rose-50 px-2 py-1 rounded-md"
                              title="Stop Reading"
                            >
                              <X size={12} />
                              <span className="text-[9px] font-bold tracking-wider uppercase">Stop</span>
                            </button>
                          </div>
                        </div>
                      )}
                      <p className={`leading-relaxed whitespace-pre-wrap ${msg.isBot ? 'px-4 pb-3 pt-2' : ''}`}>{msg.text}</p>
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1.5 font-bold uppercase tracking-widest px-1">
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-start"
                  >
                    <div className="px-4 py-3 bg-white text-navy border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center h-[44px]">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-teal rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-teal rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-teal rounded-full" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2 rounded-b-[24px]">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask anything..."}
                    disabled={isListening}
                    className={`flex-1 bg-slate-50 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:border-teal focus:ring-1 focus:ring-teal transition-all text-navy text-sm placeholder:text-gray-400 ${isListening ? 'bg-teal/5 border-teal/20' : ''}`}
                  />
                  
                  {SpeechRecognition && (
                    <button 
                      type="button" 
                      onClick={toggleListening}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 active:scale-[0.98] ${
                        isListening 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white animate-pulse' 
                          : 'bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-teal'
                      }`}
                      title="Speak your question"
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  )}

                  <button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-navy hover:bg-navy/90 text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 disabled:hover:bg-navy transition-colors shadow-md shrink-0 active:scale-[0.98]"
                  >
                    <Send size={18} className="ml-1" />
                  </button>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onClick={() => setIsOpen(true)}
            className="bg-navy hover:bg-navy/90 text-white h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex items-center gap-3 px-2 pr-6 group relative overflow-hidden ring-4 ring-white transition-colors"
          >
            {/* Shimmer effect inside button */}
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 z-0"
            />
            
            {/* Logo container with floating animation */}
            <motion.div 
              animate={{ y: [-3, 3, -3] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-10 h-10 bg-white rounded-full flex items-center justify-center p-1.5 relative z-10 shadow-[0_2px_10px_rgb(0,0,0,0.2)]"
            >
              <img src="/logo_small.png" alt="Atomic Logo" className="w-full h-full object-contain" />
            </motion.div>

            {/* Text beside the logo */}
            <div className="flex flex-col items-start relative z-10">
              <span className="font-extrabold text-sm tracking-wide leading-none flex items-center gap-1.5">
                Atomic Bot <Sparkles size={12} className="text-teal" />
              </span>
              <span className="text-[9px] text-teal-100 font-medium uppercase tracking-widest mt-0.5">Ask me anything</span>
            </div>

            {/* Little pulsing indicator dot */}
            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-3 right-3 w-1.5 h-1.5 bg-teal rounded-full z-10" 
            />
          </motion.button>
        )}
      </div>
    </>
  );
}

interface BotErrorBoundaryProps {
  children: React.ReactNode;
}

interface BotErrorBoundaryState {
  hasError: boolean;
}

class BotErrorBoundary extends React.Component<BotErrorBoundaryProps, BotErrorBoundaryState> {
  state: BotErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(_error: any): BotErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: React.ErrorInfo) {
    console.error("AtomicBot crashed:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div 
          onClick={() => (this as any).setState({ hasError: false })}
          className="fixed bottom-6 right-6 z-[9999] bg-red-50 p-4 rounded-2xl shadow-xl text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
          title="Click to restart AI Bot"
        >
          <AlertCircle size={16} /> AI Offline (Click to restart)
        </div>
      );
    }
    return (this as any).props.children;
  }
}

export default function AtomicBot() {
  return (
    <BotErrorBoundary>
      <AtomicBotInner />
    </BotErrorBoundary>
  );
}
