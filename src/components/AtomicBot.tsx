import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, User, Sparkles, Mic, MicOff, AlertCircle, Volume2, CheckCircle2, Calendar, Clock, MapPin, Phone, ShieldCheck, ArrowRight, Calculator, Wrench } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WHATSAPP_NUMBER, CORE_SERVICES } from '../constants';
import { useAuth } from '../contexts/AuthContext';
import { dataService } from '../services/firebaseService';
import { generateLocalAIResponse, generateSmartAIResponse, detectBookingIntent, getServiceRateList, calculateCustomEstimation, getInstallationGuidelines, searchWebKnowledge, BookingIntent } from '../utils/aiKnowledgeEngine';

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

function BookingCardComponent({ 
  card, 
  onConfirmBooking 
}: { 
  card: BookingCardData; 
  onConfirmBooking: (cardData: BookingCardData, details: { name: string; phone: string; address: string; date: string }) => void 
}) {
  const { user, profile } = useAuth();
  const [name, setName] = useState(profile?.name || user?.displayName || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [address, setAddress] = useState(profile?.address || '');
  const [date, setDate] = useState(card.appointmentDate || 'Tomorrow');
  const [timeSlot, setTimeSlot] = useState(card.appointmentTime || '10:00 AM');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Active Service Selection state (supports sliding & switching)
  const [selectedServiceId, setSelectedServiceId] = useState<string>(() => {
    const found = CORE_SERVICES.find(s => 
      s.name.toLowerCase() === card.serviceName.toLowerCase() || 
      s.id.toLowerCase() === card.serviceName.toLowerCase() ||
      s.subCategories.some(sub => sub.name.toLowerCase() === card.subCategory.toLowerCase())
    );
    return found ? found.id : CORE_SERVICES[0].id;
  });

  const activeService = CORE_SERVICES.find(s => s.id === selectedServiceId) || CORE_SERVICES[0];

  const [selectedSubCategory, setSelectedSubCategory] = useState<string>(() => {
    const exists = activeService.subCategories.some(sub => sub.name === card.subCategory);
    return exists ? card.subCategory : activeService.subCategories[0].name;
  });

  const handleServiceChange = (serviceId: string) => {
    setSelectedServiceId(serviceId);
    const newService = CORE_SERVICES.find(s => s.id === serviceId) || CORE_SERVICES[0];
    setSelectedSubCategory(newService.subCategories[0].name);
  };

  const currentSub = activeService.subCategories.find(sub => sub.name === selectedSubCategory) || activeService.subCategories[0];
  const currentPrice = currentSub.minPrice;

  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'hvac': return '❄️';
      case 'electrical': return '⚡';
      case 'construction': return '🧱';
      case 'plumbing': return '🔧';
      case 'false-ceiling': return '✨';
      case 'tiles-marble': return '🏛️';
      case 'painting': return '🎨';
      case 'doors-windows': return '🚪';
      case 'carpentry': return '🪵';
      case 'deep-cleaning': return '🧹';
      case 'home-planning': return '📐';
      default: return '🛠️';
    }
  };

  const getServiceShortName = (s: any) => {
    switch (s.id) {
      case 'hvac': return 'AC & HVAC';
      case 'electrical': return 'Electrical';
      case 'construction': return 'Civil Work';
      case 'plumbing': return 'Plumbing';
      case 'false-ceiling': return 'False Ceiling';
      case 'tiles-marble': return 'Tiles/Marble';
      case 'painting': return 'Painting';
      case 'doors-windows': return 'Doors/Windows';
      case 'carpentry': return 'Carpentry';
      case 'deep-cleaning': return 'Cleaning';
      case 'home-planning': return 'Home Planning';
      default: return s.name.split(' ')[0];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      alert('कृपया अपना नाम, मोबाइल नंबर और पता भरें।');
      return;
    }
    setIsSubmitting(true);
    await onConfirmBooking({
      ...card,
      serviceName: activeService.name,
      subCategory: currentSub.name,
      category: activeService.category,
      price: currentPrice,
      staffCategory: activeService.staffCategory,
      appointmentDate: date,
      appointmentTime: timeSlot
    }, { name, phone, address, date });
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
          <p className="text-[11px] text-gray-500 font-medium">{card.serviceName} ({card.staffCategory})</p>
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
      className="mt-3 p-3.5 bg-slate-900 text-white rounded-2xl shadow-xl border border-teal/40 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between border-b border-gray-800 pb-2">
        <span className="text-xs font-black text-teal uppercase tracking-widest flex items-center gap-1.5">
          <Sparkles size={14} /> Quick Direct Booking
        </span>
        <span className="text-[10px] bg-teal/20 text-teal border border-teal/30 px-2 py-0.5 rounded-full font-bold">
          11 Services Available
        </span>
      </div>

      {/* 1. Horizontal Scrollable / Sliding Category Carousel */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] text-gray-400 font-bold uppercase tracking-wider">
          <span>Choose Service (स्लाइड करके बदलें 👉)</span>
          <span className="text-teal font-extrabold">{getServiceShortName(activeService)}</span>
        </div>
        
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar touch-pan-x scroll-smooth">
          {CORE_SERVICES.map(s => {
            const isSelected = s.id === selectedServiceId;
            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleServiceChange(s.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shrink-0 ${
                  isSelected 
                    ? 'bg-gradient-to-r from-teal to-emerald-600 text-white border-teal shadow-md shadow-teal/30 scale-[1.02]' 
                    : 'bg-slate-800/90 hover:bg-slate-800 text-slate-300 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                <span>{getServiceIcon(s.id)}</span>
                <span>{getServiceShortName(s)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Sub-Category Picker */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-gray-300 uppercase tracking-wider flex items-center justify-between">
          <span>Select Sub-Service:</span>
          <span className="text-emerald-400 font-bold">₹{currentPrice.toLocaleString()} {currentSub.unit ? `/${currentSub.unit}` : ''}</span>
        </label>
        <select
          value={selectedSubCategory}
          onChange={(e) => setSelectedSubCategory(e.target.value)}
          className="w-full bg-slate-800 border border-teal/40 rounded-xl px-3 py-2 text-xs text-white font-medium focus:outline-none focus:border-teal"
        >
          {activeService.subCategories.map(sub => (
            <option key={sub.id} value={sub.name} className="bg-slate-900 text-white py-1">
              {sub.name} — Starting ₹{sub.minPrice.toLocaleString()} {sub.unit ? `/${sub.unit}` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* 3. Appointment Date & Slot Picker */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Appointment Date</label>
          <select
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal"
          >
            <option value="Today">Today (आज)</option>
            <option value="Tomorrow">Tomorrow (कल)</option>
            <option value="Day After Tomorrow">Day After (परसों)</option>
            <option value="This Weekend">This Weekend</option>
          </select>
        </div>
        <div>
          <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider block mb-1">Preferred Time Slot</label>
          <select
            value={timeSlot}
            onChange={(e) => setTimeSlot(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-teal"
          >
            <option value="09:00 AM">09:00 AM (Morning)</option>
            <option value="11:00 AM">11:00 AM</option>
            <option value="02:00 PM">02:00 PM (Afternoon)</option>
            <option value="05:00 PM">05:00 PM (Evening)</option>
            <option value="07:00 PM">07:00 PM (Night)</option>
          </select>
        </div>
      </div>

      {/* 4. Contact Inputs */}
      <div className="space-y-2">
        <input
          type="text"
          placeholder="Your Full Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-teal"
        />
        <input
          type="tel"
          placeholder="Phone Number (10 Digits) *"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-teal"
        />
        <input
          type="text"
          placeholder="Service Address / Area in Deoghar *"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          required
          className="w-full bg-slate-800 border border-gray-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-gray-400 focus:outline-none focus:border-teal"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full mt-1 py-2.5 bg-gradient-to-r from-teal to-emerald-500 hover:from-teal/90 hover:to-emerald-600 text-navy font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
      >
        {isSubmitting ? 'Booking Technician...' : `Confirm ${getServiceShortName(activeService)} Booking`} <ArrowRight size={14} />
      </button>
    </motion.form>
  );
}

function AtomicBotInner() {
  const { user, profile, isAdmin } = useAuth();

  const [isOpen, setIsOpen] = useState(false);
  const constraintsRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome-1',
      text: "Hi there! 👋 I'm **Atomic AI**, your AI consultant for Atomic Solutions.",
      isBot: true,
      time: new Date()
    },
    {
      id: 'welcome-2',
      text: "How can I assist you today?\n• **Installation Guidelines** (e.g. 'AC installation process kya hai?', 'Fan kaise lagate hain?')\n• **Estimations & Rate Lists** (AC, Electrical, Plumbing, Civil, Painting)\n• **Book Any Service**: Type **'Service book kar do'** to open our interactive service booking slider!",
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
        message: `${userDetails.name} booked ${intent.subCategory} via Atomic AI.`,
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
      if (m.bookingCard && m.bookingCard.status === 'pending_form') {
        return {
          ...m,
          bookingCard: {
            ...card,
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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputMessage('');
    setIsTyping(true);

    // 1. Check EXPLICIT BOOKING INTENT FIRST (Opens interactive booking window with service carousel)
    const bookingIntent = detectBookingIntent(text);
    if (bookingIntent) {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: `⚡ **सर्विस बुकिंग विंडो (Direct Service Booking)**\n\nआप नीचे दिए गए स्लाइडर से कोई भी सर्विस (जैसे AC, इलेक्ट्रिकल, प्लंबिंग, पेंटिंग, सिविल वर्क, सफ़ाई) चुन सकते हैं और तारीख/समय सेट करके बुक कर सकते हैं:`,
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

    // 2. CHECK SPECIFIC LOCAL KNOWLEDGE FIRST (0ms Instant, 100% Accurate Expert Answer)
    const localResult = generateLocalAIResponse(text, adminContext);

    if (localResult.isSpecificMatch && localResult.text) {
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: localResult.text, isBot: true, time: new Date() };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
      return;
    }

    // 3. FOR GENERAL / RANDOM QUERIES: Query the Server AI Proxy (/api/chat) which queries the live AI!
    let replyText = "";

    // Prepare multi-turn chat history
    const chatHistory = updatedMessages.slice(-8).map(m => ({
      role: m.isBot ? 'assistant' : 'user',
      content: m.text
    }));

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: text, messages: chatHistory })
      });
      if (response.ok) {
        const data = await response.json();
        if (data.text && !data.text.includes("Namaste! Main Atomic AI") && !data.text.includes("Namaste! Main Atomic Bot")) {
          replyText = data.text.trim();
        }
      }
    } catch (e) {}

    // 4. Backup 1: Direct Browser Pollinations AI (POST)
    if (!replyText) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const freeRes = await fetch('https://text.pollinations.ai/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              { role: 'system', content: `You are Atomic AI, the AI consultant for Atomic Solutions in Deoghar. Answer naturally in Hindi or Hinglish.` },
              ...chatHistory
            ]
          }),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (freeRes.ok) {
          const freeTxt = await freeRes.text();
          if (freeTxt && freeTxt.trim() && !freeTxt.includes('{"error":') && freeTxt !== '{}') {
            replyText = freeTxt.trim();
          }
        }
      } catch (e) {}
    }

    // 5. Backup 2: Direct Pollinations GET
    if (!replyText) {
      try {
        const getRes = await fetch(`https://text.pollinations.ai/${encodeURIComponent(text + ' (Respond concisely in Hindi or Hinglish)')}`);
        if (getRes.ok) {
          const getTxt = await getRes.text();
          if (getTxt && getTxt.trim() && !getTxt.includes('{"error":') && getTxt !== '{}') {
            replyText = getTxt.trim();
          }
        }
      } catch (e) {}
    }

    // 6. Backup 3: Live Web Knowledge (DuckDuckGo / Wikipedia)
    if (!replyText) {
      try {
        const webRes = await searchWebKnowledge(text);
        if (webRes && webRes.text) {
          replyText = `💡 **जानकारी (${webRes.source})**:\n\n${webRes.text}`;
        }
      } catch (e) {}
    }

    // 7. Final Fallback: Local Assistant Intro
    if (!replyText) {
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
    { label: '📅 Book Any Service', query: 'service book kar do' }
  ];

  return (
    <>
      {/* Floating Chat Modal */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-[9999] flex flex-col items-end max-w-[calc(100vw-2rem)]">
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white rounded-[24px] shadow-2xl border border-gray-100 w-[calc(100vw-2rem)] sm:w-[380px] h-[75vh] sm:h-[580px] max-h-[620px] flex flex-col overflow-hidden"
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
                      <h3 className="font-extrabold text-sm tracking-wide">Atomic AI</h3>
                      <span className="px-1.5 py-0.5 bg-teal/20 text-teal-100 text-[8px] font-black uppercase tracking-widest rounded-full border border-teal/30 flex items-center gap-1">
                        <Wrench size={8} /> Smart Engineering AI
                      </span>
                    </div>
                    <p className="text-[10px] text-teal-100 font-medium mt-0.5">Installation Guidelines & Calculations</p>
                  </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="hover:bg-white/10 p-2 rounded-full transition-colors relative z-10 cursor-pointer">
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
                            <Bot size={12} /> Atomic AI Assistant
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button 
                              onClick={() => handleSpeak(msg.text)} 
                              className="text-teal flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity bg-teal/5 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase cursor-pointer"
                            >
                              <Volume2 size={11} /> Listen
                            </button>
                            <button 
                              onClick={handleStop} 
                              className="text-rose-500 flex items-center gap-1 opacity-80 hover:opacity-100 transition-opacity bg-rose-50 px-2 py-0.5 rounded-md text-[9px] font-bold uppercase cursor-pointer"
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
                    className="shrink-0 px-2.5 py-1 bg-white hover:bg-teal hover:text-white border border-gray-200 rounded-full text-[10px] font-bold text-navy transition-all shadow-xs active:scale-95 flex items-center gap-1 cursor-pointer"
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
                      className={`w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-md shrink-0 cursor-pointer ${
                        isListening ? 'bg-rose-500 text-white animate-pulse' : 'bg-white border border-gray-200 text-gray-500 hover:text-teal'
                      }`}
                    >
                      {isListening ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  )}

                  <button 
                    type="submit" 
                    disabled={!inputMessage.trim() || isTyping}
                    className="bg-navy hover:bg-navy/90 text-white w-11 h-11 rounded-full flex items-center justify-center disabled:opacity-50 transition-colors shadow-md shrink-0 cursor-pointer"
                  >
                    <Send size={18} className="ml-0.5" />
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Draggable Viewport Boundary for Floating Launcher Button */}
      <div 
        ref={constraintsRef} 
        className={`fixed inset-2 sm:inset-4 pointer-events-none z-[9998] overflow-hidden transition-opacity duration-200 ${
          isOpen ? 'opacity-0 invisible pointer-events-none' : 'opacity-100 visible'
        }`}
      >
        <motion.div
          drag
          dragConstraints={constraintsRef}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={() => {
            isDraggingRef.current = true;
          }}
          onDragEnd={() => {
            setTimeout(() => {
              isDraggingRef.current = false;
            }, 120);
          }}
          className="absolute bottom-20 md:bottom-6 right-2 sm:right-4 pointer-events-auto touch-none select-none cursor-grab active:cursor-grabbing"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
              if (isDraggingRef.current) {
                e.preventDefault();
                e.stopPropagation();
                return;
              }
              setIsOpen(true);
            }}
            className="bg-navy hover:bg-navy/90 text-white h-10 sm:h-11 rounded-full shadow-[0_6px_20px_rgb(0,0,0,0.25)] flex items-center gap-2 pl-1.5 pr-3.5 sm:pl-2 sm:pr-4 group relative overflow-hidden ring-2 ring-white transition-all cursor-grab active:cursor-grabbing border border-teal/40"
            title="Atomic AI • कहीं भी ड्रैग करें (Drag anywhere)"
          >
            <motion.div 
              animate={{ x: ['-100%', '200%'] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'linear' }}
              className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12 z-0"
            />
            
            <motion.div 
              animate={{ y: [-2, 2, -2] }} 
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="w-7 h-7 sm:w-8 sm:h-8 bg-white rounded-full flex items-center justify-center p-1 relative z-10 shadow-sm shrink-0"
            >
              <img src="/logo_small.png" alt="Atomic Logo" className="w-full h-full object-contain pointer-events-none" />
            </motion.div>

            <div className="flex items-center gap-1.5 relative z-10">
              <span className="font-extrabold text-xs tracking-wide">
                Atomic AI
              </span>
              <Sparkles size={11} className="text-teal" />
            </div>

            <motion.div 
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }} 
              transition={{ repeat: Infinity, duration: 2 }}
              className="w-1.5 h-1.5 bg-emerald-400 rounded-full z-10 shadow-[0_0_6px_#34d399] ml-0.5" 
            />
          </motion.button>
        </motion.div>
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
    console.error("Atomic AI crashed:", error, errorInfo);
  }

  render() {
    if ((this as any).state.hasError) {
      return (
        <div 
          onClick={() => (this as any).setState({ hasError: false })}
          className="fixed bottom-6 right-6 z-[9999] bg-red-50 p-4 rounded-2xl shadow-xl text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 border border-red-100 cursor-pointer hover:bg-red-100 transition-colors"
          title="Click to restart Atomic AI"
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
