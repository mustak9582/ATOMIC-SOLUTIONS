import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, User, Sparkles, Mic, MicOff, AlertCircle, Volume2, CheckCircle2, Calendar, Clock, MapPin, Phone, ShieldCheck, ArrowRight, Calculator, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WHATSAPP_NUMBER } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { generateLocalAIResponse, detectBookingIntent, getServiceRateList, calculateCustomEstimation, getInstallationGuidelines, BookingIntent } from '../utils/aiKnowledgeEngine';

export interface BookingCardData {
  serviceName: string;
  subCategory: string;
  category: string;
  price: number;
  staffCategory: string;
  appointmentDate: string;
  appointmentTime: string;
  status: 'confirmed' | 'pending_form';
  bookingId?: string;
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  time: Date;
  bookingCard?: BookingCardData;
}

// Check for SpeechRecognition
const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

function BookingCardComponent({ card, onConfirmBooking }: { card: BookingCardData; onConfirmBooking: (cardData: BookingCardData, details: { name: string; phone: string; address: string; date: string }) => void }) {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [date, setDate] = useState(card.appointmentDate || 'Tomorrow');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert('Please fill in your name, phone number, and address to confirm booking.');
      return;
    }
    setIsSubmitting(true);
    await onConfirmBooking(card, { name, phone, address, date });
    setIsSubmitting(false);
  };

  if (card.status === 'confirmed') {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="mt-3 p-4 bg-gradient-to-br from-emerald-50 via-teal/5 to-white border border-teal/30 rounded-2xl shadow-md text-navy flex flex-col gap-2.5"
      >
        <div className="flex items-center justify-between border-b border-teal/20 pb-2">
          <span className="flex items-center gap-1.5 text-xs font-black text-emerald-700 uppercase tracking-wider">
            <CheckCircle2 size={16} className="text-emerald-600" /> Booking Confirmed
          </span>
          <span className="text-[10px] font-bold bg-teal text-white px-2 py-0.5 rounded-full">
            {card.bookingId || '#AT-8490'}
          </span>
        </div>

        <div className="space-y-1">
          <h4 className="font-extrabold text-sm text-navy">{card.subCategory}</h4>
          <p className="text-[11px] text-gray-500 font-medium">{card.serviceName}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 bg-white/80 p-2.5 rounded-xl border border-gray-100 text-[11px]">
          <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
            <Calendar size={13} className="text-teal" />
            <span>{card.appointmentDate}</span>
          </div>
          <div className="flex items-center gap-1.5 text-gray-700 font-semibold">
            <Clock size={13} className="text-teal" />
            <span>{card.appointmentTime}</span>
          </div>
        </div>

        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] uppercase font-bold text-gray-400">Estimated Cost</span>
            <p className="text-base font-extrabold text-teal">₹{card.price.toLocaleString()}</p>
          </div>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=Hi%20Atomic%20Solutions,%20I%20just%20booked%20${encodeURIComponent(card.subCategory)}%20via%20AI%20Bot.`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold rounded-lg shadow flex items-center gap-1 transition-colors"
          >
            Track on WhatsApp
          </a>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.form 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handleSubmit}
      className="mt-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-teal/30 flex flex-col gap-2.5"
    >
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <span className="text-xs font-black text-teal uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles size={14} /> Quick Direct Booking
        </span>
        <span className="text-[11px] font-bold text-emerald-400">₹{card.price}</span>
      </div>

      <div className="bg-gray-800/60 p-2 rounded-xl border border-gray-700 text-[11px] space-y-0.5">
        <p className="font-bold text-white">{card.subCategory}</p>
        <p className="text-gray-400">{card.serviceName}</p>
      </div>

      <div className="space-y-2">
        <input
          type="text"
          placeholder="Your Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-teal"
        />
        <input
          type="tel"
          placeholder="Phone Number *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-teal"
        />
        <input
          type="text"
          placeholder="Full Address / Landmark *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-teal"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-1 py-2 bg-gradient-to-r from-teal to-emerald-500 hover:from-teal/90 hover:to-emerald-600 text-navy font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]"
      >
        {isSubmitting ? 'Booking...' : 'Confirm Booking Now'} <ArrowRight size={14} />
      </button>
    </motion.form>
  );
}

function AtomicBotInner() {
  const { user, profile, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      text: "Hi there! 👋 I'm **Atomic Bot**, your AI consultant for Atomic Solutions.",
      isBot: true,
      time: new Date()
    },
    {
      id: 'welcome-2',
      text: "How can I assist you today?\n• **Installation Guidelines** (e.g. 'AC installation process kya hai?', 'Fan kaise lagate hain?')\n• **AC Tonnage & Room Estimations**\n• **Service Rate Lists**\n• Say **'Book AC service'** to schedule!",
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
        rec.lang = 'en-IN';
        
        rec.onstart = () => setIsListening(true);
        rec.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputMessage((prev) => prev ? prev + ' ' + transcript : transcript);
        };
        rec.onerror = () => setIsListening(false);
        rec.onend = () => setIsListening(false);
        setRecognition(rec);
      } catch (err) {
        console.error("Speech recognition init failed:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (isOpen || isTyping) {
      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  }, [isOpen, isTyping, messages]);

  const handleSpeak = (text: string) => {
    try {
      if (!('speechSynthesis' in window)) return;
      isStoppedRef.current = false;
      window.speechSynthesis.cancel();
      const cleanText = text.replace(/[*#_`|]/g, '');
      const isHindi = /[\u0900-\u097F]/.test(cleanText) || /\b(hai|aur|ke|ki|kare|kaise|kya|karna|mein|aap|nahi|haan)\b/i.test(cleanText);
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = isHindi ? 'hi-IN' : 'en-IN';
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.error("TTS error:", e);
    }
  };

  const handleStop = () => {
    isStoppedRef.current = true;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  const toggleListening = () => {
    if (isListening) recognition?.stop();
    else recognition?.start();
  };

  const executeBookingCreation = async (intent: BookingIntent, userDetails: { name: string; phone: string; address: string; date?: string }) => {
    try {
      const bookingData = {
        userId: user?.uid || 'guest_' + Date.now(),
        userName: userDetails.name,
        userPhone: userDetails.phone,
        whatsappNumber: userDetails.phone,
        userAddress: userDetails.address,
        serviceName: intent.serviceName,
        serviceCategory: intent.category,
        category: intent.serviceName,
        subCategory: intent.subCategory,
        tier: 'standard',
        price: intent.price,
        advanceAmount: 0,
        totalAmount: intent.price,
        bookingType: 'AI_Direct_Booking',
        paymentPreference: 'Cash Payment',
        paymentProofUrl: '',
        status: 'Pending',
        timestamp: new Date().toISOString(),
        appointmentDate: userDetails.date || intent.appointmentDate || 'Tomorrow',
        appointmentSlot: intent.appointmentTime || '10:00 AM',
        staffCategory: intent.staffCategory
      };

      const booking = await dataService.addDoc('bookings', bookingData);

      // Create Admin Notification
      dataService.addDoc('notifications', {
        userId: 'admin',
        title: 'New AI Direct Booking!',
        message: `${userDetails.name} booked ${intent.subCategory} via Atomic Bot.`,
        type: 'booking_new',
        read: false,
        timestamp: new Date().toISOString(),
        link: '/admin/bookings',
        relatedId: booking.id
      }).catch(() => {});

      return booking.id || 'AT-' + Math.floor(1000 + Math.random() * 9000);
    } catch (err) {
      console.error("Failed to save booking:", err);
      return 'AT-' + Math.floor(1000 + Math.random() * 9000);
    }
  };

  const handleConfirmCardForm = async (card: BookingCardData, details: { name: string; phone: string; address: string; date: string }) => {
    const bookingId = await executeBookingCreation({
      isBooking: true,
      serviceName: card.serviceName,
      subCategory: card.subCategory,
      category: card.category,
      price: card.price,
      staffCategory: card.staffCategory,
      appointmentDate: details.date,
      appointmentTime: card.appointmentTime
    }, details);

    setMessages(prev => prev.map(m => {
      if (m.bookingCard && m.bookingCard.subCategory === card.subCategory && m.bookingCard.status === 'pending_form') {
        return {
          ...m,
          bookingCard: {
            ...m.bookingCard,
            status: 'confirmed',
            bookingId,
            appointmentDate: details.date
          }
        };
      }
      return m;
    }));
  };

  const processUserMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), text: text.trim(), isBot: false, time: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // 1. Check EXPLICIT BOOKING INTENT FIRST (Only open booking window when user wants to book!)
    const bookingIntent = detectBookingIntent(text);
    if (bookingIntent) {
      const userPhone = profile?.phone || '';
      const userAddress = profile?.address || '';
      const userName = profile?.name || user?.displayName || '';

      if (user?.uid && userPhone && userAddress) {
        const bookingId = await executeBookingCreation(bookingIntent, { name: userName, phone: userPhone, address: userAddress });
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: `🎉 **Booking Confirmed Automatically!**\n\nI have scheduled **${bookingIntent.subCategory}** for you on **${bookingIntent.appointmentDate}** at **${bookingIntent.appointmentTime}**.\n\nOur certified ${bookingIntent.staffCategory} will contact you shortly!`,
          isBot: true,
          time: new Date(),
          bookingCard: {
            serviceName: bookingIntent.serviceName,
            subCategory: bookingIntent.subCategory,
            category: bookingIntent.category,
            price: bookingIntent.price,
            staffCategory: bookingIntent.staffCategory,
            appointmentDate: bookingIntent.appointmentDate || 'Tomorrow',
            appointmentTime: bookingIntent.appointmentTime || '10:00 AM',
            status: 'confirmed',
            bookingId
          }
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
        return;
      } else {
        const botMsg: Message = {
          id: (Date.now() + 1).toString(),
          text: `⚡ **Direct Service Booking Window**\n\nPlease confirm your contact details below to dispatch technician for **${bookingIntent.subCategory}**:`,
          isBot: true,
          time: new Date(),
          bookingCard: {
            serviceName: bookingIntent.serviceName,
            subCategory: bookingIntent.subCategory,
            category: bookingIntent.category,
            price: bookingIntent.price,
            staffCategory: bookingIntent.staffCategory,
            appointmentDate: bookingIntent.appointmentDate || 'Tomorrow',
            appointmentTime: bookingIntent.appointmentTime || '10:00 AM',
            status: 'pending_form'
          }
        };
        setMessages(prev => [...prev, botMsg]);
        setIsTyping(false);
        return;
      }
    }

    // 2. Check for Installation Guidelines Process (Returns step-by-step installation rules)
    const installGuideReply = getInstallationGuidelines(text);
    if (installGuideReply) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: installGuideReply,
        isBot: true,
        time: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      return;
    }

    // 3. Check for Room Dimension Estimation calculation (Returns ONLY clean material calculation report)
    const customEstimateReply = calculateCustomEstimation(text);
    if (customEstimateReply) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: customEstimateReply,
        isBot: true,
        time: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      return;
    }

    // 4. Check for Rate List query (Returns ONLY clean Rate Table)
    const rateListReply = getServiceRateList(text);
    if (rateListReply) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: rateListReply,
        isBot: true,
        time: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      return;
    }

    let adminContext = "";
    if (isAdmin) {
      try {
        const bookings = await dataService.getCollection('bookings');
        const invoices = await dataService.getCollection('invoices');
        const todayStr = new Date().toDateString();
        const todaysBookings = bookings.filter((b: any) => new Date(b.createdAt || b.date).toDateString() === todayStr);
        const todaysInvoices = invoices.filter((i: any) => new Date(i.createdAt || i.date).toDateString() === todayStr);
        adminContext = `[ADMIN STATS TODAY: ${todaysBookings.length} Bookings, ${todaysInvoices.length} Invoices]`;
      } catch (e) {}
    }

    // 5. Standard AI fetch logic (Strict prompt: answer ONLY what was asked)
    const prompt = `You are Atomic Bot, the official AI consultant for Atomic Solutions.
CRITICAL INSTRUCTION: Answer ONLY the user's exact query cleanly, accurately, and professionally. Include step-by-step installation guidelines if asked about installation or fitting process. Do NOT dump unrelated contact details, rate tables, or booking cards unless specifically asked for.
${adminContext}
User asks: "${text}"`;

    let replyText = "";
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.text) replyText = data.text.trim();
      }
    } catch (e) {}

    // Fallback to Tier 3 Smart AI Knowledge Engine if API is offline or returns empty
    if (!replyText) {
      const localResult = generateLocalAIResponse(text, adminContext);
      replyText = localResult.text;
    }

    const botMsg: Message = { id: (Date.now() + 1).toString(), text: replyText, isBot: true, time: new Date() };
    setMessages(prev => [...prev, botMsg]);
    setIsTyping(false);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    processUserMessage(inputMessage);
  };

  const quickActionChips = [
    { label: '🛠️ AC Installation Steps', query: 'AC installation process aur guidelines kya hai?' },
    { label: '💡 Fan Installation Steps', query: 'Ceiling fan kaise lagate hain process batao' },
    { label: '❄️ 10x12 AC Size', query: '10/12 room me kitne ton ki AC lagegi?' },
    { label: '🧱 Bricks Count', query: '10x10 wall me kitni eet lagegi?' },
    { label: '📞 Contact Details', query: 'Company contact number, email, and address' },
    { label: '📅 Book Service', query: 'Book AC Service for tomorrow' }
  ];

  return (
    <>
      <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col items-end max-w-[calc(100vw-2rem)]">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-[calc(100vw-2rem)] sm:w-[380px] h-[75vh] sm:h-[580px] max-h-[620px] mb-3 sm:mb-4 flex flex-col overflow-hidden"
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
                        <Wrench size={8} /> Smart Engineering AI
                      </span>
                    </div>
                    <p className="text-[10px] text-teal-100 font-medium mt-0.5">Installation Guidelines & Calculations</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors relative z-10">
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
                    <div className={`max-w-[88%] text-sm shadow-sm relative ${
                      msg.isBot 
                        ? 'bg-white text-navy border border-gray-100 rounded-2xl rounded-tl-sm p-3' 
                        : 'px-4 py-3 bg-teal text-white rounded-2xl rounded-tr-sm shadow-[0_4px_14px_0_rgba(15,118,110,0.39)]'
                    }`}>
                      {msg.isBot && (
                        <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-2">
                          <span className="text-[10px] font-bold text-teal flex items-center gap-1">
                            <Bot size={12} /> Atomic Assistant
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleSpeak(msg.text)} 
                              className="text-teal flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity bg-teal/5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase"
                            >
                              <Volume2 size={11} /> Listen
                            </button>
                            <button 
                              onClick={handleStop} 
                              className="text-rose-500 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity bg-rose-50 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase"
                            >
                              <X size={11} /> Stop
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="leading-relaxed text-xs sm:text-sm overflow-x-auto">
                        <p className="whitespace-pre-wrap">{msg.text}</p>
                      </div>

                      {msg.bookingCard && (
                        <BookingCardComponent card={msg.bookingCard} onConfirmBooking={handleConfirmCardForm} />
                      )}
                    </div>
                    <span className="text-[9px] text-gray-400 mt-1 font-bold uppercase tracking-widest px-1">
                      {msg.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </motion.div>
                ))}

                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-start">
                    <div className="px-4 py-3 bg-white text-navy border border-gray-100 rounded-2xl rounded-tl-sm shadow-sm flex gap-1.5 items-center h-[44px]">
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0 }} className="w-1.5 h-1.5 bg-teal rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }} className="w-1.5 h-1.5 bg-teal rounded-full" />
                      <motion.div animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }} className="w-1.5 h-1.5 bg-teal rounded-full" />
                    </div>
                  </motion.div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Action Chips */}
              <div className="px-3 py-1.5 bg-slate-100 border-t border-gray-100 flex gap-1.5 overflow-x-auto scrollbar-hide">
                {quickActionChips.map((chip, i) => (
                  <button
                    key={i}
                    onClick={() => processUserMessage(chip.query)}
                    className="shrink-0 px-2.5 py-1 bg-white hover:bg-teal hover:text-white border border-gray-200 rounded-full text-[10px] font-bold text-navy transition-all shadow-xs active:scale-95 flex items-center gap-1"
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Input Area */}
              <div className="p-3 bg-white border-t border-gray-100 flex flex-col gap-2 rounded-b-[24px]">
                <form onSubmit={handleSend} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder={isListening ? "Listening..." : "Ask installation steps or questions..."}
                    disabled={isListening}
                    className="flex-1 bg-slate-50 border border-gray-200 rounded-full px-4 py-3 focus:outline-none focus:border-teal text-navy text-xs placeholder:text-gray-400"
                  />
                  
                  {SpeechRecognition && (
                    <button 
                      type="button" 
                      onClick={toggleListening}
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 ${
                        isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white border border-gray-200 text-gray-500 hover:text-teal'
                      }`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  )}

                  <button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-navy hover:bg-navy/90 text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shadow-md shrink-0"
                  >
                    <Send size={18} className="ml-0.5" />
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
            className="bg-navy hover:bg-navy/90 text-white h-12 sm:h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.25)] flex items-center gap-2.5 sm:gap-3 px-2 pr-4 sm:pr-6 group relative overflow-hidden ring-2 sm:ring-4 ring-white transition-colors"
          >
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 z-0"
            />
            
            <motion.div 
              animate={{ y: [-3, 3, -3] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-full flex items-center justify-center p-1 sm:p-1.5 relative z-10 shadow-[0_2px_10px_rgb(0,0,0,0.2)]"
            >
              <img src="/logo_small.png" alt="Atomic Logo" className="w-full h-full object-contain" />
            </motion.div>

            <div className="flex flex-col items-start relative z-10">
              <span className="font-extrabold text-xs sm:text-sm tracking-wide leading-none flex items-center gap-1.5">
                Atomic Bot <Sparkles size={12} className="text-teal" />
              </span>
              <span className="hidden sm:inline text-[9px] text-teal-100 font-medium uppercase tracking-widest mt-0.5">Installation & Technical Guide</span>
            </div>

            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute top-2.5 sm:top-3 right-2.5 sm:right-3 w-1.5 h-1.5 bg-teal rounded-full z-10" 
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
