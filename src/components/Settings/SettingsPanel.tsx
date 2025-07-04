import React, { useState } from 'react';
import { User, Bell, Shield, Palette, Info, ChevronRight, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../contexts/AuthContext';

interface SettingsPanelProps {
  onBack: () => void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack }) => {
  const { userProfile, updateUserProfile } = useAuth();
  const [activeSection, setActiveSection] = useState<string | null>(null);

  const settingsSections = [
    {
      id: 'profile',
      title: 'Profile',
      icon: User,
      description: 'Update your profile information'
    },
    {
      id: 'notifications',
      title: 'Notifications',
      icon: Bell,
      description: 'Manage notification preferences'
    },
    {
      id: 'privacy',
      title: 'Privacy & Security',
      icon: Shield,
      description: 'Control your privacy settings'
    },
    {
      id: 'appearance',
      title: 'Appearance',
      icon: Palette,
      description: 'Customize app appearance'
    },
    {
      id: 'about',
      title: 'About',
      icon: Info,
      description: 'App information and help'
    }
  ];

  const ProfileSettings = () => {
    const [name, setName] = useState(userProfile?.name || '');
    const [status, setStatus] = useState(userProfile?.status || '');
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
      setSaving(true);
      try {
        await updateUserProfile({ name, status });
      } catch (error) {
        console.error('Error updating profile:', error);
      } finally {
        setSaving(false);
      }
    };

    return (
      <div className="p-6 space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Profile Settings</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status Message
            </label>
            <input
              type="text"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Hey there! I am using ConnectMe."
            />
          </div>
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-green-500 text-white py-2 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    );
  };

  const NotificationSettings = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Notification Settings</h2>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Message Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications for new messages</p>
          </div>
          <input type="checkbox" defaultChecked className="toggle" />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Call Notifications</h3>
            <p className="text-sm text-gray-500">Receive notifications for incoming calls</p>
          </div>
          <input type="checkbox" defaultChecked className="toggle" />
        </div>
        
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-medium text-gray-900">Sound</h3>
            <p className="text-sm text-gray-500">Play sound for notifications</p>
          </div>
          <input type="checkbox" defaultChecked className="toggle" />
        </div>
      </div>
    </div>
  );

  const PrivacySettings = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Last Seen</h3>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Everyone</option>
            <option>My Contacts</option>
            <option>Nobody</option>
          </select>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Profile Photo</h3>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Everyone</option>
            <option>My Contacts</option>
            <option>Nobody</option>
          </select>
        </div>
        
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Status</h3>
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500">
            <option>Everyone</option>
            <option>My Contacts</option>
            <option>Nobody</option>
          </select>
        </div>
      </div>
    </div>
  );

  const AppearanceSettings = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">Appearance</h2>
      
      <div className="space-y-4">
        <div>
          <h3 className="font-medium text-gray-900 mb-2">Theme</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-full h-8 bg-white border rounded mb-2"></div>
              <span className="text-sm">Light</span>
            </button>
            <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="w-full h-8 bg-gray-800 rounded mb-2"></div>
              <span className="text-sm">Dark</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const AboutSettings = () => (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold text-gray-900">About</h2>
      
      <div className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-2">ConnectMe Clone</h3>
          <p className="text-sm text-gray-600">Version 1.0.0</p>
          <p className="text-sm text-gray-600">Built with React, TypeScript, and Firebase</p>
        </div>
        
        <div className="space-y-2">
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-900">Help Center</span>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-900">Terms of Service</span>
          </button>
          <button className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors">
            <span className="text-gray-900">Privacy Policy</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'profile':
        return <ProfileSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'privacy':
        return <PrivacySettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'about':
        return <AboutSettings />;
      default:
        return null;
    }
  };

  if (activeSection) {
    return (
      <div className="h-full bg-white">
        <div className="border-b border-gray-200 p-4">
          <button
            onClick={() => setActiveSection(null)}
            className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
          >
            <ArrowLeft size={20} />
            <span>Back to Settings</span>
          </button>
        </div>
        {renderActiveSection()}
      </div>
    );
  }

  return (
    <div className="h-full bg-white">
      <div className="border-b border-gray-200 p-4">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium mb-3"
        >
          <ArrowLeft size={20} />
          <span>Back</span>
        </button>
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      </div>
      
      <div className="overflow-y-auto">
        {settingsSections.map((section, index) => (
          <motion.button
            key={section.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setActiveSection(section.id)}
            className="w-full p-4 flex items-center space-x-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <section.icon size={20} className="text-green-600" />
            </div>
            
            <div className="flex-1 text-left">
              <h3 className="font-medium text-gray-900">{section.title}</h3>
              <p className="text-sm text-gray-500">{section.description}</p>
            </div>
            
            <ChevronRight size={20} className="text-gray-400" />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SettingsPanel;