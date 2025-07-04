import React, { useState } from 'react';
import { MessageCircle, Phone, Users, Search, Archive, Plus, MoreVertical, User, Settings, LogOut, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';
import ChatList from '../Chat/ChatList';
import ContactList from '../Contacts/ContactList';
import CallHistory from '../Call/CallHistory';
import SettingsPanel from '../Settings/SettingsPanel';
import ProfilePhotoUpload from '../Settings/ProfilePhotoUpload';

type SidebarTab = 'chats' | 'calls' | 'contacts';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
  onChatSelect?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen = true, 
  onClose, 
  isMobile = false,
  onChatSelect 
}) => {
  const { userProfile, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<SidebarTab>('chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileUpload, setShowProfileUpload] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  const tabs = [
    { id: 'chats', icon: MessageCircle, label: 'Chats' },
    { id: 'calls', icon: Phone, label: 'Calls' },
    { id: 'contacts', icon: Users, label: 'Contacts' }
  ];

  const chatFilters = [
    { id: 'all', label: 'All', active: true },
    { id: 'unread', label: 'Unread', active: false },
    { id: 'favourites', label: 'Favourites', active: false },
    { id: 'groups', label: 'Groups', active: false }
  ];

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleProfilePhotoClick = () => {
    setShowProfileUpload(true);
    setShowMenu(false);
  };

  const handleSettingsClick = () => {
    setShowSettings(true);
    setShowMenu(false);
  };

  // Close menu when clicking outside
  React.useEffect(() => {
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

  const renderContent = () => {
    if (showSettings) {
      return <SettingsPanel onBack={() => setShowSettings(false)} />;
    }

    switch (activeTab) {
      case 'chats':
        return <ChatList searchQuery={searchQuery} onChatSelect={onChatSelect} />;
      case 'calls':
        return <CallHistory />;
      case 'contacts':
        return <ContactList />;
      default:
        return <ChatList searchQuery={searchQuery} onChatSelect={onChatSelect} />;
    }
  };

  const sidebarContent = (
    <div className="bg-white flex flex-col h-full">
      {/* Mobile Header */}
      {isMobile && (
        <div className="bg-green-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.name}
                    className="w-10 h-10 rounded-full border-2 border-white/20 object-cover cursor-pointer"
                    onClick={handleProfilePhotoClick}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center cursor-pointer"
                    onClick={handleProfilePhotoClick}
                  >
                    <User size={20} />
                  </div>
                )}
                <button
                  onClick={handleProfilePhotoClick}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
                >
                  <Camera size={12} className="text-white" />
                </button>
              </div>
              <h1 className="text-xl font-medium">ConnectMe</h1>
            </div>
            
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
                    className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                  >
                    <button 
                      onClick={handleProfilePhotoClick}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <Camera size={16} />
                      <span>Change Photo</span>
                    </button>
                    <button 
                      onClick={handleSettingsClick}
                      className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                    >
                      <Settings size={16} />
                      <span>Settings</span>
                    </button>
                    <hr className="my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                    >
                      <LogOut size={16} />
                      <span>Logout</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Header */}
      {!isMobile && (
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="relative">
                {userProfile?.photoURL ? (
                  <img
                    src={userProfile.photoURL}
                    alt={userProfile.name}
                    className="w-10 h-10 rounded-full border-2 border-green-200 object-cover cursor-pointer"
                    onClick={handleProfilePhotoClick}
                  />
                ) : (
                  <div 
                    className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center cursor-pointer"
                    onClick={handleProfilePhotoClick}
                  >
                    <User size={20} className="text-gray-600" />
                  </div>
                )}
                <button
                  onClick={handleProfilePhotoClick}
                  className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center border-2 border-white"
                >
                  <Camera size={12} className="text-white" />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-gray-900">ConnectMe</h2>
            </div>
            
            <div className="flex items-center space-x-2">
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Plus size={20} className="text-gray-600" />
              </button>
              <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <Archive size={20} className="text-gray-600" />
              </button>
              
              <div className="relative" ref={menuRef}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                  <MoreVertical size={20} className="text-gray-600" />
                </button>
                
                <AnimatePresence>
                  {showMenu && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: -10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: -10 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                    >
                      <button 
                        onClick={handleProfilePhotoClick}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                      >
                        <Camera size={16} />
                        <span>Change Photo</span>
                      </button>
                      <button 
                        onClick={handleSettingsClick}
                        className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors"
                      >
                        <Settings size={16} />
                        <span>Settings</span>
                      </button>
                      <hr className="my-2" />
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2 transition-colors"
                      >
                        <LogOut size={16} />
                        <span>Logout</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          {!showSettings && (
            <div className="relative mb-4">
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search or start a new chat"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
              />
            </div>
          )}

          {/* Chat Filters - Only show for chats tab */}
          {activeTab === 'chats' && !showSettings && (
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide">
              {chatFilters.map((filter) => (
                <button
                  key={filter.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mobile Search Bar */}
      {isMobile && !showSettings && (
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search or start a new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:bg-white transition-colors"
            />
          </div>

          {/* Mobile Chat Filters - Only show for chats tab */}
          {activeTab === 'chats' && (
            <div className="flex space-x-2 overflow-x-auto scrollbar-hide mt-3">
              {chatFilters.map((filter) => (
                <button
                  key={filter.id}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filter.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation - Hide when showing settings */}
      {!showSettings && (
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SidebarTab)}
              className={`flex-1 p-3 flex items-center justify-center space-x-2 transition-colors relative ${
                activeTab === tab.id
                  ? 'text-green-600 bg-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <tab.icon size={18} />
              <span className={`text-sm font-medium ${isMobile ? 'hidden' : 'inline'}`}>
                {tab.label}
              </span>
              
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-green-600"
                />
              )}
            </button>
          ))}
        </div>
      )}

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        <motion.div
          key={showSettings ? 'settings' : activeTab}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          {renderContent()}
        </motion.div>
      </div>

      {/* Profile Photo Upload Modal */}
      <AnimatePresence>
        {showProfileUpload && (
          <ProfilePhotoUpload onClose={() => setShowProfileUpload(false)} />
        )}
      </AnimatePresence>
    </div>
  );

  if (isMobile) {
    return (
      <div className="h-full w-full">
        {sidebarContent}
      </div>
    );
  }

  return (
    <div className="w-80 border-r border-gray-200 flex flex-col h-full">
      {sidebarContent}
    </div>
  );
};

export default Sidebar;