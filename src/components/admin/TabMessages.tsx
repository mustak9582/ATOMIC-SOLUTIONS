import React, { useState, useEffect, useRef } from 'react';
import { Card } from '../ui/card';
import { MessageCircle, Send, User } from 'lucide-react';
import { chatService } from '../../services/firebaseService';
import { TabsContent } from '../ui/tabs';
import { UserProfile } from '../../types';

export function TabMessages({ users }: { users: UserProfile[] }) {
  const [chats, setChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubscribe = chatService.subscribeToAllChats(setChats);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedChat) {
      const unsubscribe = chatService.subscribeToMessages(selectedChat.userId, (msgs) => {
        setMessages(msgs);
        chatService.markAsRead(selectedChat.userId, false); // Admin marks as read
        setTimeout(() => {
          messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      });
      return () => unsubscribe();
    }
  }, [selectedChat]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedChat) return;
    const content = inputMessage;
    setInputMessage('');
    try {
      await chatService.sendMessage(selectedChat.userId, 'admin', 'Support', content);
    } catch (err: any) {
      console.error("Admin chat send error:", err);
      alert("Failed to send message: " + err.message);
    }
  };

  return (
    <TabsContent value="messages" id="messages">
      <div className="h-[calc(100vh-140px)] flex gap-6">
        {/* Chats List */}
        <Card className="w-1/3 bg-white shadow-xl shadow-navy/5 border-none rounded-[32px] overflow-hidden flex flex-col">
          <div className="p-6 bg-navy text-white">
            <h2 className="text-xl font-black flex items-center gap-2">
              <MessageCircle /> Conversations
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {chats.length === 0 && (
              <div className="text-center text-gray-400 font-medium py-10">No active chats</div>
            )}
            {chats.map((chat) => (
              <div 
                key={chat.id} 
                onClick={() => setSelectedChat(chat)}
                className={`p-4 rounded-2xl cursor-pointer transition-colors border ${selectedChat?.id === chat.id ? 'bg-blue-50 border-blue-100' : 'bg-white border-gray-100 hover:bg-gray-50'}`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-bold text-navy truncate flex-1">{chat.userName || 'Customer'}</span>
                  <span className="text-[10px] text-gray-400 shrink-0 ml-2">
                    {new Date(chat.lastMessageTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500 truncate flex-1">{chat.lastMessage}</span>
                  {chat.unreadCountAdmin > 0 && (
                    <span className="w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ml-2">
                      {chat.unreadCountAdmin}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="flex-1 bg-white shadow-xl shadow-navy/5 border-none rounded-[32px] overflow-hidden flex flex-col">
          {selectedChat ? (
            <>
              {(() => {
                const chatUser = users.find(u => u.uid === selectedChat.userId);
                return (
                  <div className="p-6 border-b border-gray-100 flex items-center gap-4">
                    <div className="w-12 h-12 bg-teal/10 text-teal rounded-full flex items-center justify-center font-bold text-lg">
                      <User size={24} />
                    </div>
                    <div>
                      <h3 className="font-black text-navy text-lg">{chatUser?.name || selectedChat.userName || 'Customer'}</h3>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{chatUser?.phone || 'No Phone'}</p>
                        <p className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{chatUser?.email || 'No Email'}</p>
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50 flex flex-col gap-4">
                {messages.map((msg, idx) => {
                  const isAdmin = msg.senderId === 'admin';
                  return (
                    <div key={idx} className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}>
                      <div className={`px-5 py-3 rounded-2xl max-w-[70%] text-sm ${isAdmin ? 'bg-navy text-white rounded-tr-sm' : 'bg-white text-navy border border-gray-100 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                      <span className="text-[10px] text-gray-400 mt-1 font-medium">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSend} className="p-4 border-t border-gray-100 bg-white flex gap-3">
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 focus:outline-none focus:border-teal transition-colors text-navy font-medium"
                />
                <button 
                  type="submit" 
                  disabled={!inputMessage.trim()}
                  className="bg-navy hover:bg-navy/90 text-white w-14 rounded-2xl flex items-center justify-center disabled:opacity-50 transition-colors"
                >
                  <Send size={20} />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <MessageCircle size={64} className="mb-4 text-gray-200" />
              <p className="text-lg font-bold">Select a conversation</p>
            </div>
          )}
        </Card>
      </div>
    </TabsContent>
  );
}
