import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Layout/Sidebar';
import ChatWindow from '../components/Chat/ChatWindow';
import CallNotification from '../components/Call/CallNotification';
import CallInterface from '../components/Call/CallInterface';
import { useCall } from '../contexts/CallContext';
import { useChat } from '../contexts/ChatContext';

const ChatPage: React.FC = () => {
  const { isInCall } = useCall();
  const { activeChat, setActiveChat } = useChat();
  const [isMobile, setIsMobile] = useState(false);
  const [showChat, setShowChat] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // On mobile, show chat when activeChat is selected
  useEffect(() => {
    if (isMobile && activeChat) {
      setShowChat(true);
    }
  }, [activeChat, isMobile]);

  const handleBackToSidebar = () => {
    setShowChat(false);
    setActiveChat(null);
  };

  // Desktop layout - always show both sidebar and chat
  if (!isMobile) {
    return (
      <div className="h-screen flex bg-gray-100 overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Chat Window */}
        <div className="flex-1">
          <ChatWindow />
        </div>

        {/* Call Components */}
        <CallNotification />
        {isInCall && <CallInterface />}
      </div>
    );
  }

  // Mobile layout - show sidebar or chat, not both
  return (
    <div className="h-screen bg-gray-100 overflow-hidden">
      {showChat && activeChat ? (
        /* Mobile Chat View */
        <ChatWindow 
          onBackClick={handleBackToSidebar}
          isMobile={true}
        />
      ) : (
        /* Mobile Sidebar View */
        <Sidebar 
          isMobile={true}
          onChatSelect={() => setShowChat(true)}
        />
      )}

      {/* Call Components */}
      <CallNotification />
      {isInCall && <CallInterface />}
    </div>
  );
};

export default ChatPage;