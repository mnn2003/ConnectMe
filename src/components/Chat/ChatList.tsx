import React, { useState } from 'react';
import { formatDistanceToNow, format, isToday, isYesterday } from 'date-fns';
import { User, Check, CheckCheck, MessageCircle, Pin, Archive, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { Chat } from '../../types';

interface ChatListProps {
  searchQuery?: string;
  onChatSelect?: () => void;
}

const ChatList: React.FC<ChatListProps> = ({ searchQuery = '', onChatSelect }) => {
  const { chats, activeChat, setActiveChat, loading, archiveChat, unarchiveChat } = useChat();
  const { currentUser } = useAuth();
  const [showArchived, setShowArchived] = useState(false);
  const [chatMenuId, setChatMenuId] = useState<string | null>(null);

  const handleChatSelect = (chat: Chat) => {
    setActiveChat(chat);
    onChatSelect?.();
  };

  const getOtherParticipant = (chat: Chat) => {
    return chat.participantDetails.find(p => p.id !== currentUser?.uid);
  };

  const getMessagePreview = (chat: Chat) => {
    if (!chat.lastMessage) return 'No messages yet';
    
    const content = chat.lastMessage.content;
    if (chat.lastMessage.type === 'image') return '📷 Photo';
    if (chat.lastMessage.type === 'file') return '📎 Document';
    return content.length > 50 ? `${content.substring(0, 50)}...` : content;
  };

  const getReadStatus = (chat: Chat) => {
    if (!chat.lastMessage || chat.lastMessage.senderId !== currentUser?.uid) {
      return null;
    }

    const readCount = chat.lastMessage.readBy?.length || 0;
    const participantCount = chat.participants.length;

    if (readCount === participantCount) {
      return <CheckCheck size={16} className="text-blue-500" />;
    } else if (readCount > 1) {
      return <Check size={16} className="text-gray-400" />;
    }
    return <Check size={16} className="text-gray-400" />;
  };

  const formatMessageTime = (date: Date) => {
    if (isToday(date)) {
      return format(date, 'HH:mm');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'dd/MM/yyyy');
    }
  };

  const handleArchiveChat = async (chatId: string, isArchived: boolean) => {
    try {
      if (isArchived) {
        await unarchiveChat(chatId);
      } else {
        await archiveChat(chatId);
      }
      setChatMenuId(null);
    } catch (error) {
      console.error('Error archiving/unarchiving chat:', error);
    }
  };

  const filteredChats = chats.filter(chat => {
    const matchesSearch = !searchQuery || (() => {
      const otherParticipant = getOtherParticipant(chat);
      return otherParticipant?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
             chat.lastMessage?.content.toLowerCase().includes(searchQuery.toLowerCase());
    })();

    const isArchived = chat.isArchived || false;
    return matchesSearch && (showArchived ? isArchived : !isArchived);
  });

  const archivedCount = chats.filter(chat => chat.isArchived).length;

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="animate-pulse flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full">
      {/* Archived Chats Toggle */}
      {!showArchived && archivedCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowArchived(true)}
          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
        >
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
            <Archive size={20} className="text-gray-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="font-medium text-gray-900">Archived</h3>
            <p className="text-sm text-gray-500">{archivedCount} chat{archivedCount !== 1 ? 's' : ''}</p>
          </div>
        </motion.div>
      )}

      {/* Back to Chats (when viewing archived) */}
      {showArchived && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setShowArchived(false)}
          className="flex items-center p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
        >
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
            <MessageCircle size={20} className="text-green-600" />
          </div>
          <div className="ml-3 flex-1">
            <h3 className="font-medium text-gray-900">← Back to Chats</h3>
            <p className="text-sm text-gray-500">View all conversations</p>
          </div>
        </motion.div>
      )}

      {filteredChats.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-lg font-medium mb-2">
            {showArchived 
              ? 'No archived chats'
              : searchQuery 
                ? 'No chats found' 
                : 'No chats yet'
            }
          </p>
          <p className="text-sm">
            {showArchived
              ? 'Archived chats will appear here'
              : searchQuery 
                ? 'Try adjusting your search terms'
                : 'Start a conversation from contacts'
            }
          </p>
        </div>
      ) : (
        filteredChats.map((chat, index) => {
          const otherParticipant = getOtherParticipant(chat);
          if (!otherParticipant) return null;

          const isActive = activeChat?.id === chat.id;
          const hasUnread = chat.unreadCount > 0;

          return (
            <motion.div
              key={chat.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`flex items-center p-3 hover:bg-gray-50 cursor-pointer transition-colors relative group ${
                isActive ? 'bg-green-50 border-r-4 border-green-500' : ''
              }`}
            >
              <div onClick={() => handleChatSelect(chat)} className="flex items-center flex-1 min-w-0">
                {/* Profile Picture */}
                <div className="relative flex-shrink-0">
                  {otherParticipant.photoURL ? (
                    <img
                      src={otherParticipant.photoURL}
                      alt={otherParticipant.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <User size={20} className="text-gray-600" />
                    </div>
                  )}
                  {otherParticipant.isOnline && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Chat Info */}
                <div className="ml-3 flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center space-x-2">
                      <h3 className={`font-medium truncate ${
                        hasUnread ? 'text-gray-900' : 'text-gray-800'
                      }`}>
                        {otherParticipant.name}
                      </h3>
                      {chat.isArchived && (
                        <Archive size={14} className="text-gray-400" />
                      )}
                      {!chat.isArchived && index < 3 && (
                        <Pin size={14} className="text-gray-400" />
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-1 flex-shrink-0">
                      {getReadStatus(chat)}
                      {chat.lastMessage && (
                        <span className={`text-xs ${
                          hasUnread ? 'text-green-600 font-medium' : 'text-gray-500'
                        }`}>
                          {formatMessageTime(chat.lastMessageTime)}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${
                      hasUnread ? 'text-gray-700 font-medium' : 'text-gray-500'
                    }`}>
                      {getMessagePreview(chat)}
                    </p>
                    {hasUnread && (
                      <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center ml-2 flex-shrink-0">
                        {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Chat Menu Button */}
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setChatMenuId(chatMenuId === chat.id ? null : chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-2 hover:bg-gray-200 rounded-full transition-all"
                >
                  <MoreVertical size={16} className="text-gray-600" />
                </button>

                {/* Chat Menu */}
                <AnimatePresence>
                  {chatMenuId === chat.id && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 top-full mt-1 w-48 bg-white rounded-lg shadow-lg border py-2 z-50"
                    >
                      <button
                        onClick={() => handleArchiveChat(chat.id, chat.isArchived || false)}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                      >
                        <Archive size={16} />
                        <span>{chat.isArchived ? 'Unarchive chat' : 'Archive chat'}</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default ChatList;