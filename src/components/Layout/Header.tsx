import React, { useRef, useEffect } from 'react';
import { Search, MoreVertical, User, Settings, LogOut, Bell, BellOff, Menu } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  onMenuToggle?: () => void;
  isMobile?: boolean;
}

const Header: React.FC<HeaderProps> = ({ 
  title = 'ConnectMe', 
  showSearch = false, 
  onSearch,
  onMenuToggle,
  isMobile = false
}) => {
  const { userProfile, logout } = useAuth();
  const [showMenu, setShowMenu] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [notificationsEnabled, setNotificationsEnabled] = React.useState(
    Notification.permission === 'granted'
  );
  const menuRef = useRef<HTMLDivElement>(null);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    onSearch?.(e.target.value);
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const toggleNotifications = async () => {
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(!notificationsEnabled);
    } else if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationsEnabled(permission === 'granted');
    }
  };

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

  return (
    <header className="bg-green-600 text-white shadow-sm">
      <div className="flex items-center justify-between p-3 md:p-4">
        <div className="flex items-center space-x-3">
          {isMobile && (
            <button
              onClick={onMenuToggle}
              className="p-2 hover:bg-white/10 rounded-full transition-colors md:hidden"
            >
              <Menu size={20} />
            </button>
          )}
          
          {userProfile?.photoURL ? (
            <img
              src={userProfile.photoURL}
              alt={userProfile.name}
              className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-white/20"
            />
          ) : (
            <div className="w-8 h-8 md:w-10 md:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <User size={16} className="md:w-5 md:h-5" />
            </div>
          )}
          <h1 className="text-lg md:text-xl font-medium">{title}</h1>
        </div>

        <div className="flex items-center space-x-2 md:space-x-4">
          {showSearch && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 'auto', opacity: 1 }}
              className="relative hidden md:block"
            >
              <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search chats..."
                value={searchQuery}
                onChange={handleSearch}
                className="pl-10 pr-4 py-2 bg-white/10 rounded-full text-white placeholder-white/60 focus:outline-none focus:bg-white/20 transition-colors w-48"
              />
            </motion.div>
          )}

          <button
            onClick={toggleNotifications}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            title={notificationsEnabled ? 'Disable notifications' : 'Enable notifications'}
          >
            {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-white/10 rounded-full transition-colors"
            >
              <MoreVertical size={18} />
            </button>

            <AnimatePresence>
              {showMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50"
                >
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors">
                    <User size={16} />
                    <span>Profile</span>
                  </button>
                  <button className="w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-100 flex items-center space-x-2 transition-colors">
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
    </header>
  );
};

export default Header;