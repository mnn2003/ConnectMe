import React, { useState } from 'react';
import { format } from 'date-fns';
import { Check, CheckCheck, User, Download, MoreVertical, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Message } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import ImageViewer from './ImageViewer';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, showAvatar }) => {
  const { currentUser } = useAuth();
  const { deleteMessage } = useChat();
  const [showMenu, setShowMenu] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);

  const getReadStatus = () => {
    if (!isOwn) return null;

    const readCount = message.readBy?.length || 0;
    
    if (readCount > 1) {
      return <CheckCheck size={14} className="text-blue-500" />;
    } else if (readCount === 1) {
      return <Check size={14} className="text-gray-400" />;
    }
    return <Check size={14} className="text-gray-400" />;
  };

  const handleDownload = () => {
    if (message.fileUrl) {
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName || 'download';
      link.click();
    }
  };

  const handleDelete = async () => {
    if (message.senderId === currentUser?.uid) {
      await deleteMessage(message.id);
      setShowMenu(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleImageClick = () => {
    if (message.type === 'image' && message.fileUrl) {
      setShowImageViewer(true);
    }
  };

  const renderMessageContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="max-w-xs">
            <div 
              className="relative cursor-pointer group"
              onClick={handleImageClick}
            >
              <img
                src={message.fileUrl}
                alt="Shared image"
                className="rounded-lg max-w-full h-auto transition-transform group-hover:scale-[1.02]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded-full p-2">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                  </svg>
                </div>
              </div>
            </div>
            {message.content !== 'Image' && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg max-w-xs">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Download size={20} className="text-blue-600" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {message.fileName}
              </p>
              {message.fileSize && (
                <p className="text-xs text-gray-500">
                  {formatFileSize(message.fileSize)}
                </p>
              )}
            </div>
            <button
              onClick={handleDownload}
              className="p-1 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
            >
              <Download size={16} />
            </button>
          </div>
        );
      
      default:
        return (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        );
    }
  };

  return (
    <>
      <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-4 group`}>
        <div className={`flex ${isOwn ? 'flex-row-reverse' : 'flex-row'} items-end space-x-2 max-w-xs lg:max-w-md relative`}>
          {/* Avatar */}
          {!isOwn && showAvatar && (
            <div className="flex-shrink-0">
              {message.senderPhoto ? (
                <img
                  src={message.senderPhoto}
                  alt={message.senderName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                  <User size={16} className="text-gray-600" />
                </div>
              )}
            </div>
          )}
          {!isOwn && !showAvatar && <div className="w-8" />}

          {/* Message Bubble */}
          <div
            className={`px-4 py-2 rounded-2xl shadow-sm relative ${
              isOwn
                ? 'bg-green-500 text-white rounded-br-md'
                : 'bg-white text-gray-900 rounded-bl-md border border-gray-200'
            }`}
          >
            {/* Message Content */}
            {renderMessageContent()}
            
            {/* Message Info */}
            <div className={`flex items-center justify-end mt-1 space-x-1 ${
              isOwn ? 'text-white/70' : 'text-gray-500'
            }`}>
              <span className="text-xs">
                {format(message.timestamp, 'HH:mm')}
              </span>
              {getReadStatus()}
            </div>

            {/* Edited Indicator */}
            {message.edited && (
              <div className={`text-xs mt-1 ${
                isOwn ? 'text-white/50' : 'text-gray-400'
              }`}>
                edited
              </div>
            )}

            {/* Message Menu Button */}
            {isOwn && (
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 p-1 bg-gray-200 rounded-full hover:bg-gray-300 transition-all"
              >
                <MoreVertical size={12} className="text-gray-600" />
              </button>
            )}
          </div>

          {/* Message Menu */}
          <AnimatePresence>
            {showMenu && isOwn && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="absolute top-0 right-0 bg-white rounded-lg shadow-lg border p-1 z-50"
              >
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 p-2 hover:bg-red-50 rounded text-red-600 text-sm"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={message.fileUrl || ''}
        isOpen={showImageViewer}
        onClose={() => setShowImageViewer(false)}
        senderName={message.senderName}
        timestamp={message.timestamp}
      />
    </>
  );
};

export default MessageBubble;