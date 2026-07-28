import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, chatService, dataService } from '../services/firebaseService';
import { useAuth } from '../contexts/AuthContext';

export default function ChatWidget() {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user) {
      const unsubscribe = chatService.subscribeToMessages(user.uid, (msgs) => {
        setMessages(msgs);
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user) {
      chatService.markAsRead(user.uid, true);
    }
  }, [isOpen, messages, user]);

  if (!user || profile?.role === 'admin' || profile?.role === 'staff') return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;
    const content = inputMessage;
    setInputMessage('');
    try {
      await chatService.sendMessage(user.uid, user.uid, profile?.name || user.displayName || 'Customer', content);
    } catch (err: any) {
      console.error("Chat send error:", err);
      alert("Failed to send message. Please check Firebase rules: " + err.message);
    }
  };

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 h-96 mb-4 flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-[#075e54] text-white flex justify-between items-center rounded-t-2xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                    <User size={18} />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm">Atomic Support</h3>
                    <p className="text-[10px] text-white/70">Typically replies in minutes</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-[#efeae2] flex flex-col gap-3">
                {messages.length === 0 && (
                  <div className="text-center text-gray-400 text-xs mt-4 italic">
                    Send a message to start chatting with support.
                  </div>
                )}
                {messages.map((msg, idx) => {
                  const isMe = msg.senderId === user.uid;
                  return (
                    <div key={idx} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                      <div className={`px-4 py-2 max-w-[85%] text-sm shadow-sm ${isMe ? 'bg-[#dcf8c6] text-gray-800 rounded-lg rounded-tr-none' : 'bg-white text-gray-800 border border-gray-100 rounded-lg rounded-tl-none'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[9px] text-gray-500 mt-1 font-medium px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <form onSubmit={handleSend} className="p-3 bg-[#f0f0f0] flex gap-2 rounded-b-2xl">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 bg-white border-none rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-[#075e54] transition-colors text-gray-800 text-sm shadow-sm"
                />
                <button 
                  type="submit" 
                  disabled={!inputMessage.trim()}
                  className="bg-[#00a884] hover:bg-[#008f6f] text-white w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shadow-sm shrink-0"
                >
                  <Send size={18} className="ml-1" />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {!isOpen && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsOpen(true)}
            className="bg-navy hover:bg-navy/90 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center group relative overflow-hidden"
          >
            <MessageCircle size={28} className="relative z-10" />
          </motion.button>
        )}
      </div>
    </>
  );
}
