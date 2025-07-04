export interface User {
  id: string;
  name: string;
  email: string;
  photoURL?: string;
  status: string;
  lastSeen?: Date | null;
  isOnline: boolean;
  blockedUsers: string[];
  createdAt: Date;
}

export interface Chat {
  id: string;
  participants: string[];
  participantDetails: User[];
  lastMessage?: Message;
  lastMessageTime: Date;
  unreadCount: number;
  createdAt: Date;
  isArchived?: boolean;
}

export interface Message {
  id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderPhoto: string;
  content: string;
  type: 'text' | 'image' | 'file' | 'voice';
  timestamp: Date;
  readBy: string[];
  edited?: boolean;
  editedAt?: Date;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
}

export interface CallLog {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  receiverName: string;
  callerPhoto: string;
  receiverPhoto: string;
  timestamp: Date;
  duration?: number;
  status: 'completed' | 'missed' | 'declined' | 'failed';
  type: 'voice' | 'video';
}

export interface TypingIndicator {
  chatId: string;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface NotificationSettings {
  messageNotifications: boolean;
  callNotifications: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface UserSettings {
  theme: 'light' | 'dark';
  notifications: NotificationSettings;
  privacy: {
    lastSeenVisibility: 'everyone' | 'contacts' | 'nobody';
    profilePhotoVisibility: 'everyone' | 'contacts' | 'nobody';
    statusVisibility: 'everyone' | 'contacts' | 'nobody';
  };
}

export interface CallData {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  receiverName: string;
  callerPhoto: string;
  receiverPhoto: string;
  status: 'ringing' | 'accepted' | 'declined' | 'ended' 'connected';
  timestamp: Date;
  duration?: number;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  iceCandidates?: RTCIceCandidateInit[];
}