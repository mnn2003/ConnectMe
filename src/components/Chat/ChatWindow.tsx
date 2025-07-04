import React, { useEffect, useRef } from 'react';
import { Phone, Video, MoreVertical, User, MessageCircle, Search, Blocks as Block, UserX, ArrowLeft } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCall } from '../../contexts/CallContext';
import MessageInput from './MessageInput';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ChatWindowProps {
  onBackClick?: () => void;
  isMobile?: boolean;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ onBackClick, isMobile = false }) => {
  const { 
    activeChat, 
    filteredMessages, 
    markMessagesAsRead, 
    typingUsers, 
    searchQuery, 
    setSearchQuery,
    blockUser,
    unblockUser
  } = useChat();
  const { currentUser, userProfile } = useAuth();
  const { initiateCall, isInCall } = useCall();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showSearch, setShowSearch] = React.useState(false);
  const [showMenu, setShowMenu] = React.useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [filteredMessages]);

  useEffect(() => {
    if (activeChat) {
      markMessagesAsRead(activeChat.id);
    }
  }, [activeChat, filteredMessages, markMessagesAsRead]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  if (!activeChat) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500 max-w-md mx-auto p-8">
          <div className="w-64 h-64 mx-auto mb-8 opacity-20">
            <svg viewBox="0 0 303 172" className="w-full h-full">
              <defs>
                <linearGradient id="a" x1="50%" x2="50%" y1="100%" y2="0%">
                  <stop offset="0%" stopColor="#1fa2f3" stopOpacity=".08"></stop>
                  <stop offset="100%" stopColor="#1fa2f3" stopOpacity=".02"></stop>
                </linearGradient>
              </defs>
              <path fill="url(#a)" d="M229.221 12.739c11.031 0 19.97 8.939 19.97 19.97v106.562c0 11.031-8.939 19.97-19.97 19.97H73.779c-11.031 0-19.97-8.939-19.97-19.97V32.709c0-11.031 8.939-19.97 19.97-19.97h155.442z"></path>
            </svg>
          </div>
          <h3 className="text-2xl font-light mb-4 text-gray-800">ConnectMe Web</h3>
          <p className="text-gray-600 mb-2">Send and receive messages without keeping your phone online.</p>
          <p className="text-gray-600">Use ConnectMe on up to 4 linked devices and 1 phone at the same time.</p>
        </div>
      </div>
    );
  }

  const otherParticipant = activeChat.participantDetails.find(
    p => p.id !== currentUser?.uid
  );

  if (!otherParticipant) return null;

  const isBlocked = userProfile?.blockedUsers?.includes(otherParticipant.id);
  const isBlockedBy = otherParticipant.blockedUsers?.includes(currentUser?.uid || '');

  const handleVoiceCall = () => {
    if (isInCall) {
      toast.error('Already in a call');
      return;
    }
    
    console.log('Starting voice call with:', otherParticipant.name);
    initiateCall(otherParticipant.id, otherParticipant.name, otherParticipant.photoURL || '');
  };

  const handleBlock = async () => {
    if (isBlocked) {
      await unblockUser(otherParticipant.id);
    } else {
      await blockUser(otherParticipant.id);
    }
    setShowMenu(false);
  };

  const currentTypingUsers = typingUsers.filter(typing => 
    typing.chatId === activeChat.id && typing.userId !== currentUser?.uid
  );

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-green-600 text-white px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button
              onClick={onBackClick}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
          )}
          
          <div className="relative">
            {otherParticipant.photoURL ? (
              <img
                src={otherParticipant.photoURL}
                alt={otherParticipant.name}
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <User size={20} />
              </div>
            )}
            {otherParticipant.isOnline && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-green-600"></div>
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-medium truncate">{otherParticipant.name}</h2>
            <p className="text-sm text-white/80 truncate">
              {otherParticipant.isOnline ? (
                'online'
              ) : (
                `last seen ${formatDistanceToNow(otherParticipant.lastSeen || new Date(), { addSuffix: true })}`
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1">
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
          >
            <Search size={20} />
          </button>
          <button
            onClick={handleVoiceCall}
            disabled={isInCall}
            className={`p-2 rounded-full transition-colors ${
              isInCall 
                ? 'opacity-50 cursor-not-allowed'
                : 'hover:bg-white/10'
            }`}
            title={isInCall ? 'Already in call' : 'Voice Call'}
          >
            <Phone size={20} />
          </button>
          <button 
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title="Video Call (Coming Soon)"
          >
            <Video size={20} />
          </button>
          <div className="relative" ref={menuRef}>
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreVertical size={20} />
            </button>
            
            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2 z-50"
                >
                  <button
                    onClick={handleBlock}
                    className={`w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 transition-colors ${
                      isBlocked ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {isBlocked ? <UserX size={16} /> : <Block size={16} />}
                    <span>{isBlocked ? 'Unblock User' : 'Block User'}</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <AnimatePresence>
        {showSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="bg-yellow-50 border-b border-yellow-200 p-4"
          >
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocked Message */}
      {(isBlocked || isBlockedBy) && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4 text-center">
          <p className="text-yellow-800 text-sm">
            {isBlocked 
              ? 'You have blocked this contact. Unblock to send messages.'
              : 'This contact has blocked you. You cannot send messages.'
            }
          </p>
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-chat-pattern">
        {filteredMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center text-gray-500">
              <MessageCircle size={48} className="mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium mb-2">No messages yet</p>
              <p className="text-sm">Send a message to start the conversation</p>
            </div>
          </div>
        ) : (
          filteredMessages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <MessageBubble
                message={message}
                isOwn={message.senderId === currentUser?.uid}
                showAvatar={index === 0 || filteredMessages[index - 1].senderId !== message.senderId}
              />
            </motion.div>
          ))
        )}
        
        {/* Typing Indicator */}
        {currentTypingUsers.length > 0 && (
          <TypingIndicator users={currentTypingUsers} />
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {!isBlocked && !isBlockedBy && <MessageInput />}
    </div>
  );
};

export default ChatWindow;