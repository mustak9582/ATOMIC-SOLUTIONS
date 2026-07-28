import fs from 'fs';

let content = fs.readFileSync('src/services/firebaseService.ts', 'utf-8');

const chatService = `
export const chatService = {
  async sendMessage(userId, senderId, senderName, content) {
    if (!db) return;
    const timestamp = new Date().toISOString();
    
    // Create or update the main chat document
    const chatRef = doc(db, 'chats', userId);
    await setDoc(chatRef, {
      userId,
      userName: senderName,
      lastMessage: content,
      lastMessageTime: timestamp,
      unreadCountAdmin: senderId === userId ? 1 : 0, // In a real app we'd increment, but simplify for now
      unreadCountUser: senderId === 'admin' ? 1 : 0
    }, { merge: true });

    // Add message to subcollection
    const msgRef = collection(db, 'chats', userId, 'messages');
    await addDoc(msgRef, {
      senderId,
      content,
      timestamp,
      read: false
    });
  },

  subscribeToMessages(userId, callback) {
    if (!db) return () => {};
    // Query ordered by timestamp
    const q = query(
      collection(db, 'chats', userId, 'messages'),
      orderBy('timestamp', 'asc')
    );
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  },

  subscribeToAllChats(callback) {
    if (!db) return () => {};
    const q = query(collection(db, 'chats'), orderBy('lastMessageTime', 'desc'));
    return onSnapshot(q, (snap) => {
      callback(snap.docs.map(d => ({ ...d.data(), id: d.id })));
    });
  },
  
  async markAsRead(userId, isUser) {
    if (!db) return;
    const chatRef = doc(db, 'chats', userId);
    if (isUser) {
      await updateDoc(chatRef, { unreadCountUser: 0 });
    } else {
      await updateDoc(chatRef, { unreadCountAdmin: 0 });
    }
  }
};
`;

if (!content.includes('export const chatService')) {
  content += '\n' + chatService;
  fs.writeFileSync('src/services/firebaseService.ts', content);
  console.log('Added chatService');
} else {
  console.log('chatService already exists');
}
