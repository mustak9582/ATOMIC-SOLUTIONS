import { dataService } from './firebaseService';
import { BookingMessage } from '../types';

const LOCAL_CHAT_PREFIX = 'atomic_booking_chat_';

export const bookingChatService = {
  // Subscribe to real-time messages for a booking
  subscribeToBookingMessages(
    bookingId: string, 
    callback: (messages: BookingMessage[]) => void
  ) {
    if (!bookingId) return () => {};

    // 1. Initial load from localStorage for instant responsiveness
    const cached = localStorage.getItem(LOCAL_CHAT_PREFIX + bookingId);
    if (cached) {
      try {
        const localList: BookingMessage[] = JSON.parse(cached);
        callback(localList);
      } catch (e) {}
    }

    // 2. Real-time subscription via Firestore
    const unsub = dataService.subscribe<BookingMessage>(
      'booking_messages',
      (messages) => {
        const filtered = messages
          .filter(m => m.bookingId === bookingId)
          .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        // Cache latest messages locally
        localStorage.setItem(LOCAL_CHAT_PREFIX + bookingId, JSON.stringify(filtered));
        callback(filtered);
      },
      [{ field: 'bookingId', operator: '==', value: bookingId }]
    );

    // 3. Listen to local custom event for instant cross-tab or same-window updates
    const handleLocalUpdate = (e: any) => {
      if (e.detail && e.detail.bookingId === bookingId) {
        const cachedNow = localStorage.getItem(LOCAL_CHAT_PREFIX + bookingId);
        if (cachedNow) {
          try {
            callback(JSON.parse(cachedNow));
          } catch (err) {}
        }
      }
    };
    window.addEventListener('atomic_booking_chat_updated', handleLocalUpdate);

    return () => {
      unsub();
      window.removeEventListener('atomic_booking_chat_updated', handleLocalUpdate);
    };
  },

  // Send a message between customer and technician
  async sendBookingMessage(
    bookingId: string,
    senderId: string,
    senderRole: 'customer' | 'technician' | 'admin',
    senderName: string,
    content: string,
    recipientId?: string,
    bookingServiceName?: string
  ): Promise<BookingMessage> {
    const newMessage: BookingMessage = {
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      bookingId,
      senderId,
      senderRole,
      senderName,
      content: content.trim(),
      timestamp: new Date().toISOString(),
      read: false
    };

    // 1. Instant local persistence
    try {
      const cached = localStorage.getItem(LOCAL_CHAT_PREFIX + bookingId);
      const list: BookingMessage[] = cached ? JSON.parse(cached) : [];
      list.push(newMessage);
      localStorage.setItem(LOCAL_CHAT_PREFIX + bookingId, JSON.stringify(list));
      window.dispatchEvent(new CustomEvent('atomic_booking_chat_updated', { detail: { bookingId } }));
    } catch (e) {
      console.warn('[bookingChatService] local cache save error:', e);
    }

    // 2. Firestore persistence
    try {
      await dataService.addDoc('booking_messages', newMessage);
    } catch (err) {
      console.warn('[bookingChatService] Firestore save error (using local cache):', err);
    }

    // 3. Notify recipient
    if (recipientId) {
      try {
        const roleLabel = senderRole === 'technician' ? 'Technician' : 'Customer';
        await dataService.addDoc('notifications', {
          userId: recipientId,
          title: `New Message from ${roleLabel} (${senderName})`,
          message: `${senderName}: "${content.length > 50 ? content.substring(0, 50) + '...' : content}"`,
          type: 'booking_update',
          read: false,
          timestamp: new Date().toISOString(),
          relatedId: bookingId,
          link: senderRole === 'customer' ? '/professional' : '/my-account/bookings'
        });
      } catch (e) {
        console.warn('[bookingChatService] Notification trigger error:', e);
      }
    }

    return newMessage;
  }
};
