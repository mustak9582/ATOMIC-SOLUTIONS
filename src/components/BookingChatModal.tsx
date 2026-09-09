import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Send, 
  Phone, 
  ShieldCheck, 
  CheckCheck,
  MessageSquare,
  Sparkles
} from 'lucide-react';
import { Dialog, DialogContent } from './ui/dialog';
import { Button } from './ui/button';
import { Booking, BookingMessage } from '../types';
import { bookingChatService } from '../services/bookingChatService';
import { toast } from 'sonner';

interface BookingChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking;
  currentUserId: string;
  currentUserName: string;
  currentUserRole: 'customer' | 'technician' | 'admin';
}

export const BookingChatModal: React.FC<BookingChatModalProps> = ({
  isOpen,
  onClose,
  booking,
  currentUserId,
  currentUserName,
  currentUserRole
}) => {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Recipient details
  const isCustomer = currentUserRole === 'customer';
  const recipientName = isCustomer ? (booking.staffName || 'Assigned Technician') : (booking.userName || 'Customer');
  const recipientPhone = isCustomer ? booking.staffPhone : (booking.whatsappNumber || booking.userPhone);
  const recipientId = isCustomer ? booking.staffId : booking.userId;

  // Real-time subscription to messages for this booking
  useEffect(() => {
    if (!isOpen || !booking.id) return;

    const unsubscribe = bookingChatService.subscribeToBookingMessages(booking.id, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    });

    return () => unsubscribe();
  }, [isOpen, booking.id]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || sending) return;

    setInputText('');
    setSending(true);

    try {
      await bookingChatService.sendBookingMessage(
        booking.id,
        currentUserId,
        currentUserRole,
        currentUserName,
        text,
        recipientId,
        booking.serviceName
      );
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  // Quick reply chips
  const customerQuickChips = [
    'Where have you reached? 📍',
    'Call me when you reach 📞',
    'I am waiting at the location',
    'Please ring the bell'
  ];

  const technicianQuickChips = [
    'I am on the way 🚗',
    'Reaching in 10-15 mins ⏱️',
    'I have arrived at your gate 📍',
    'Please open the door'
  ];

  const quickChips = isCustomer ? customerQuickChips : technicianQuickChips;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg w-[95vw] h-[85vh] max-h-[700px] p-0 flex flex-col rounded-[32px] overflow-hidden bg-slate-50 border-none shadow-2xl font-sans">
        {/* Header */}
        <div className="bg-navy text-white px-6 py-4 flex items-center justify-between border-b border-white/10 shrink-0">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-teal/20 border border-teal/40 flex items-center justify-center text-teal font-black text-base uppercase shrink-0">
                {recipientName[0]}
              </div>
              <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-navy" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-sm text-white truncate uppercase tracking-tight">
                  {recipientName}
                </h3>
                {isCustomer ? (
                  <span className="flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-teal/20 text-teal px-2 py-0.5 rounded-full border border-teal/30">
                    <ShieldCheck size={10} /> Pro
                  </span>
                ) : (
                  <span className="text-[8px] font-black uppercase tracking-widest bg-white/10 text-white/80 px-2 py-0.5 rounded-full">
                    Customer
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-300 truncate font-medium">
                {booking.serviceName} {booking.subCategory ? `• ${booking.subCategory}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recipientPhone && (
              <a
                href={`tel:${recipientPhone}`}
                className="w-9 h-9 rounded-xl bg-teal text-navy flex items-center justify-center hover:bg-white transition-all shadow-md active:scale-95"
                title={`Call ${recipientName}`}
              >
                <Phone size={16} />
              </a>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Messages Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 custom-scrollbar">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400">
              <div className="w-14 h-14 rounded-3xl bg-teal/10 flex items-center justify-center text-teal mb-3">
                <MessageSquare size={28} />
              </div>
              <p className="text-xs font-black uppercase tracking-wider text-navy mb-1">
                Direct Chat Connected
              </p>
              <p className="text-[11px] text-gray-500 max-w-xs leading-relaxed">
                Send updates, arrival coordinates, or questions about this booking.
              </p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderId === currentUserId;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 duration-200`}
                >
                  {!isMe && (
                    <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 mb-1 px-1">
                      {msg.senderName} ({msg.senderRole === 'technician' ? 'Technician' : 'Customer'})
                    </span>
                  )}
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-medium leading-relaxed break-words shadow-sm ${
                      isMe
                        ? 'bg-navy text-white rounded-br-sm'
                        : 'bg-white text-navy border border-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {msg.content}
                  </div>
                  <div className="flex items-center gap-1 mt-1 px-1">
                    <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && <CheckCheck size={11} className="text-teal" />}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Chips */}
        <div className="px-4 py-2 bg-white/70 border-t border-gray-100 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          <Sparkles size={12} className="text-teal shrink-0 ml-1" />
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(chip)}
              className="whitespace-nowrap px-3 py-1.5 bg-white hover:bg-teal/10 hover:border-teal/40 text-[10px] font-bold text-navy rounded-full border border-gray-200 transition-all shrink-0 active:scale-95 cursor-pointer shadow-2xs"
            >
              {chip}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 sm:p-4 bg-white border-t border-gray-100 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Message ${recipientName}...`}
            className="flex-1 bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-navy placeholder:text-gray-400 text-xs sm:text-sm px-4 py-3 rounded-2xl outline-none border border-transparent focus:border-teal transition-all"
          />
          <Button
            type="submit"
            disabled={!inputText.trim() || sending}
            className="w-11 h-11 rounded-2xl bg-teal text-navy hover:bg-navy hover:text-white transition-all shadow-md active:scale-95 disabled:opacity-50 p-0 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Send size={16} />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default BookingChatModal;
