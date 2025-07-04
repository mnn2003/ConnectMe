import React, { useState, useEffect } from 'react';
import { Search, User, MessageCircle, Phone, Users, Blocks as Block, UserCheck } from 'lucide-react';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { useChat } from '../../contexts/ChatContext';
import { useCall } from '../../contexts/CallContext';
import { User as UserType } from '../../types';
import toast from 'react-hot-toast';

const ContactList: React.FC = () => {
  const { currentUser, userProfile } = useAuth();
  const { createChat, setActiveChat, chats, blockUser, unblockUser } = useChat();
  const { initiateCall, isInCall } = useCall();
  const [contacts, setContacts] = useState<UserType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showBlocked, setShowBlocked] = useState(false);

  useEffect(() => {
    fetchContacts();
  }, [currentUser]);

  const fetchContacts = async () => {
    if (!currentUser) return;

    try {
      const usersQuery = query(
        collection(db, 'users'),
        where('id', '!=', currentUser.uid),
        limit(50)
      );
      
      const snapshot = await getDocs(usersQuery);
      const usersData = snapshot.docs.map(doc => ({
        ...doc.data(),
        lastSeen: doc.data().lastSeen?.toDate() || new Date()
      })) as UserType[];

      setContacts(usersData);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         contact.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const isBlocked = userProfile?.blockedUsers?.includes(contact.id);
    
    if (showBlocked) {
      return matchesSearch && isBlocked;
    } else {
      return matchesSearch && !isBlocked;
    }
  });

  const handleStartChat = async (contact: UserType) => {
    try {
      const chatId = await createChat(contact.id);
      
      // Find the created/existing chat and set it as active
      const existingChat = chats.find(chat => 
        chat.participants.includes(contact.id) && 
        chat.participants.includes(currentUser!.uid) &&
        chat.participants.length === 2
      );
      
      if (existingChat) {
        setActiveChat(existingChat);
      }
      
      toast.success(`Started chat with ${contact.name}`);
    } catch (error) {
      console.error('Error starting chat:', error);
      toast.error('Failed to start chat');
    }
  };

  const handleCall = (contact: UserType) => {
    if (isInCall) {
      toast.error('Already in a call');
      return;
    }
    
    console.log('Initiating call to:', contact.name);
    initiateCall(contact.id, contact.name, contact.photoURL || '');
  };

  const handleBlockToggle = async (contact: UserType) => {
    const isBlocked = userProfile?.blockedUsers?.includes(contact.id);
    
    if (isBlocked) {
      await unblockUser(contact.id);
    } else {
      await blockUser(contact.id);
    }
  };

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
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
    <div className="flex flex-col h-full">
      {/* Header with toggle */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {showBlocked ? 'Blocked Contacts' : 'Contacts'}
          </h2>
          <button
            onClick={() => setShowBlocked(!showBlocked)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              showBlocked 
                ? 'bg-red-100 text-red-700 hover:bg-red-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showBlocked ? 'Show All' : 'Blocked'}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={`Search ${showBlocked ? 'blocked ' : ''}contacts...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Contacts List */}
      <div className="flex-1 overflow-y-auto">
        {filteredContacts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Users size={48} className="mx-auto mb-4 text-gray-300" />
            <p>
              {showBlocked 
                ? 'No blocked contacts' 
                : searchQuery 
                  ? 'No contacts found' 
                  : 'No contacts found'
              }
            </p>
            {searchQuery && (
              <p className="text-sm">Try adjusting your search</p>
            )}
          </div>
        ) : (
          filteredContacts.map((contact, index) => {
            const isBlocked = userProfile?.blockedUsers?.includes(contact.id);
            
            return (
              <motion.div
                key={contact.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="flex items-center p-4 hover:bg-gray-50 transition-colors border-b border-gray-100"
              >
                {/* Profile Picture */}
                <div className="relative">
                  {contact.photoURL ? (
                    <img
                      src={contact.photoURL}
                      alt={contact.name}
                      className={`w-12 h-12 rounded-full object-cover ${
                        isBlocked ? 'grayscale opacity-60' : ''
                      }`}
                    />
                  ) : (
                    <div className={`w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center ${
                      isBlocked ? 'grayscale opacity-60' : ''
                    }`}>
                      <User size={20} className="text-gray-600" />
                    </div>
                  )}
                  {contact.isOnline && !isBlocked && (
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                  )}
                </div>

                {/* Contact Info */}
                <div className="ml-3 flex-1 min-w-0">
                  <h3 className={`font-medium truncate ${
                    isBlocked ? 'text-gray-500' : 'text-gray-900'
                  }`}>
                    {contact.name}
                  </h3>
                  <p className={`text-sm truncate ${
                    isBlocked ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {isBlocked ? 'Blocked' : contact.status}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  {!showBlocked && !isBlocked && (
                    <>
                      <button
                        onClick={() => handleStartChat(contact)}
                        className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
                        title="Start Chat"
                      >
                        <MessageCircle size={18} />
                      </button>
                      <button
                        onClick={() => handleCall(contact)}
                        disabled={isInCall}
                        className={`p-2 rounded-full transition-colors ${
                          isInCall 
                            ? 'text-gray-400 cursor-not-allowed'
                            : 'text-blue-600 hover:bg-blue-100'
                        }`}
                        title={isInCall ? 'Already in call' : 'Voice Call'}
                      >
                        <Phone size={18} />
                      </button>
                    </>
                  )}
                  
                  <button
                    onClick={() => handleBlockToggle(contact)}
                    className={`p-2 rounded-full transition-colors ${
                      isBlocked
                        ? 'text-green-600 hover:bg-green-100'
                        : 'text-red-600 hover:bg-red-100'
                    }`}
                    title={isBlocked ? 'Unblock User' : 'Block User'}
                  >
                    {isBlocked ? <UserCheck size={18} /> : <Block size={18} />}
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default ContactList;