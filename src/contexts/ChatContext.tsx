import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  arrayUnion,
  getDocs,
  deleteDoc,
  arrayRemove
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useAuth } from './AuthContext';
import { Chat, Message, TypingIndicator } from '../types';
import toast from 'react-hot-toast';

interface ChatContextType {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Message[];
  typingUsers: TypingIndicator[];
  loading: boolean;
  searchQuery: string;
  filteredMessages: Message[];
  setActiveChat: (chat: Chat | null) => void;
  sendMessage: (chatId: string, content: string, type?: 'text' | 'image' | 'file') => Promise<void>;
  sendFileMessage: (chatId: string, file: File, type: 'image' | 'file') => Promise<void>;
  createChat: (participantId: string) => Promise<string>;
  markMessagesAsRead: (chatId: string) => Promise<void>;
  setTyping: (chatId: string, isTyping: boolean) => void;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  deleteMessage: (messageId: string) => Promise<void>;
  archiveChat: (chatId: string) => Promise<void>;
  unarchiveChat: (chatId: string) => Promise<void>;
}

const ChatContext = createContext<ChatContextType | null>(null);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);

  // Filter messages based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMessages(messages);
    } else {
      const filtered = messages.filter(message =>
        message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.senderName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMessages(filtered);
    }
  }, [messages, searchQuery]);

  const sendMessage = async (chatId: string, content: string, type: 'text' | 'image' | 'file' = 'text') => {
    if (!currentUser || !userProfile) return;

    try {
      const messageData = {
        chatId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderPhoto: userProfile.photoURL || '',
        content,
        type,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid]
      };

      await addDoc(collection(db, 'messages'), messageData);

      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          content: type === 'text' ? content : `📎 ${type === 'image' ? 'Image' : 'File'}`,
          senderId: currentUser.uid,
          senderName: userProfile.name,
          timestamp: serverTimestamp(),
          readBy: [currentUser.uid]
        },
        lastMessageTime: serverTimestamp()
      });

      // Clear typing indicator
      setTyping(chatId, false);
    } catch (error: any) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  const sendFileMessage = async (chatId: string, file: File, type: 'image' | 'file') => {
    if (!currentUser || !userProfile) return;

    try {
      // Upload file to Firebase Storage
      const fileRef = ref(storage, `chat-media/${chatId}/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);

      const messageData = {
        chatId,
        senderId: currentUser.uid,
        senderName: userProfile.name,
        senderPhoto: userProfile.photoURL || '',
        content: type === 'image' ? 'Image' : file.name,
        type,
        timestamp: serverTimestamp(),
        readBy: [currentUser.uid],
        fileUrl: downloadURL,
        fileName: file.name,
        fileSize: file.size
      };

      await addDoc(collection(db, 'messages'), messageData);

      // Update chat's last message
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: {
          content: `📎 ${type === 'image' ? 'Image' : file.name}`,
          senderId: currentUser.uid,
          senderName: userProfile.name,
          timestamp: serverTimestamp(),
          readBy: [currentUser.uid]
        },
        lastMessageTime: serverTimestamp()
      });

      toast.success(`${type === 'image' ? 'Image' : 'File'} sent successfully`);
    } catch (error: any) {
      toast.error(`Failed to send ${type}`);
      console.error('Error sending file:', error);
    }
  };

  const createChat = async (participantId: string): Promise<string> => {
    if (!currentUser) throw new Error('User not authenticated');

    try {
      // Check if chat already exists
      const existingChatsQuery = query(
        collection(db, 'chats'),
        where('participants', 'array-contains', currentUser.uid)
      );
      
      const existingChatsSnapshot = await getDocs(existingChatsQuery);
      const existingChat = existingChatsSnapshot.docs.find(doc => {
        const data = doc.data();
        return data.participants.includes(participantId) && data.participants.length === 2;
      });

      if (existingChat) {
        return existingChat.id;
      }

      // Create new chat
      const chatData = {
        participants: [currentUser.uid, participantId],
        createdAt: serverTimestamp(),
        lastMessageTime: serverTimestamp(),
        unreadCount: 0,
        isArchived: false
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      return chatRef.id;
    } catch (error: any) {
      toast.error('Failed to create chat');
      throw error;
    }
  };

  const markMessagesAsRead = async (chatId: string) => {
    if (!currentUser) return;

    try {
      const unreadMessagesQuery = query(
        collection(db, 'messages'),
        where('chatId', '==', chatId),
        where('senderId', '!=', currentUser.uid)
      );

      const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);
      
      const batch = unreadMessagesSnapshot.docs.map(messageDoc => {
        const messageData = messageDoc.data();
        if (!messageData.readBy?.includes(currentUser.uid)) {
          return updateDoc(doc(db, 'messages', messageDoc.id), {
            readBy: arrayUnion(currentUser.uid)
          });
        }
        return Promise.resolve();
      });

      await Promise.all(batch);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const setTyping = async (chatId: string, isTyping: boolean) => {
    if (!currentUser || !userProfile) return;

    try {
      if (isTyping) {
        const typingData = {
          chatId,
          userId: currentUser.uid,
          userName: userProfile.name,
          timestamp: serverTimestamp()
        };
        await addDoc(collection(db, 'typing'), typingData);
      } else {
        // Remove typing indicator
        const typingQuery = query(
          collection(db, 'typing'),
          where('chatId', '==', chatId),
          where('userId', '==', currentUser.uid)
        );
        const typingSnapshot = await getDocs(typingQuery);
        typingSnapshot.docs.forEach(doc => deleteDoc(doc.ref));
      }
    } catch (error) {
      console.error('Error updating typing status:', error);
    }
  };

  const blockUser = async (userId: string) => {
    if (!currentUser || !userProfile) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        blockedUsers: arrayUnion(userId)
      });
      toast.success('User blocked successfully');
    } catch (error) {
      toast.error('Failed to block user');
      console.error('Error blocking user:', error);
    }
  };

  const unblockUser = async (userId: string) => {
    if (!currentUser || !userProfile) return;

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        blockedUsers: arrayRemove(userId)
      });
      toast.success('User unblocked successfully');
    } catch (error) {
      toast.error('Failed to unblock user');
      console.error('Error unblocking user:', error);
    }
  };

  const deleteMessage = async (messageId: string) => {
    try {
      await deleteDoc(doc(db, 'messages', messageId));
      toast.success('Message deleted');
    } catch (error) {
      toast.error('Failed to delete message');
      console.error('Error deleting message:', error);
    }
  };

  const archiveChat = async (chatId: string) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        isArchived: true
      });
      toast.success('Chat archived');
    } catch (error) {
      toast.error('Failed to archive chat');
      console.error('Error archiving chat:', error);
    }
  };

  const unarchiveChat = async (chatId: string) => {
    try {
      await updateDoc(doc(db, 'chats', chatId), {
        isArchived: false
      });
      toast.success('Chat unarchived');
    } catch (error) {
      toast.error('Failed to unarchive chat');
      console.error('Error unarchiving chat:', error);
    }
  };

  // Subscribe to user's chats
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const chatsQuery = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', currentUser.uid)
    );

    const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
      const chatsData: Chat[] = [];
      
      for (const doc of snapshot.docs) {
        const data = doc.data();
        
        // Get participant details
        const participantDetails = await Promise.all(
          data.participants.map(async (participantId: string) => {
            const userQuery = query(
              collection(db, 'users'),
              where('id', '==', participantId)
            );
            const userDoc = await getDocs(userQuery);
            if (userDoc.docs.length > 0) {
              const userData = userDoc.docs[0].data();
              return {
                ...userData,
                lastSeen: userData.lastSeen?.toDate() || new Date()
              };
            }
            return null;
          })
        );

        chatsData.push({
          id: doc.id,
          participants: data.participants,
          participantDetails: participantDetails.filter(Boolean),
          lastMessage: data.lastMessage,
          lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
          unreadCount: data.unreadCount || 0,
          createdAt: data.createdAt?.toDate() || new Date(),
          isArchived: data.isArchived || false
        });
      }
      
      chatsData.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      setChats(chatsData);
      setLoading(false);
    });

    return unsubscribe;
  }, [currentUser]);

  // Subscribe to messages for active chat
  useEffect(() => {
    if (!activeChat) {
      setMessages([]);
      return;
    }

    const messagesQuery = query(
      collection(db, 'messages'),
      where('chatId', '==', activeChat.id),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as Message[];

      setMessages(messagesData);

      // Show browser notification for new messages
      if (messagesData.length > 0) {
        const lastMessage = messagesData[messagesData.length - 1];
        if (lastMessage.senderId !== currentUser?.uid && 
            document.hidden && 
            Notification.permission === 'granted') {
          new Notification(`New message from ${lastMessage.senderName}`, {
            body: lastMessage.content,
            icon: lastMessage.senderPhoto || '/vite.svg'
          });
        }
      }
    });

    return unsubscribe;
  }, [activeChat, currentUser]);

  // Subscribe to typing indicators
  useEffect(() => {
    if (!activeChat) {
      setTypingUsers([]);
      return;
    }

    const typingQuery = query(
      collection(db, 'typing'),
      where('chatId', '==', activeChat.id)
    );

    const unsubscribe = onSnapshot(typingQuery, (snapshot) => {
      const typingData = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as TypingIndicator[];

      // Filter out current user and expired typing indicators
      const validTyping = typingData.filter(typing => 
        typing.userId !== currentUser?.uid &&
        Date.now() - typing.timestamp.getTime() < 5000 // 5 seconds
      );

      setTypingUsers(validTyping);
    });

    return unsubscribe;
  }, [activeChat, currentUser]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    chats,
    activeChat,
    messages,
    typingUsers,
    loading,
    searchQuery,
    filteredMessages,
    setActiveChat,
    sendMessage,
    sendFileMessage,
    createChat,
    markMessagesAsRead,
    setTyping,
    blockUser,
    unblockUser,
    setSearchQuery,
    deleteMessage,
    archiveChat,
    unarchiveChat
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};