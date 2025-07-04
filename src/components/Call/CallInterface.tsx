import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, User, Volume2, VolumeX, Minimize2, Maximize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCall } from '../../contexts/CallContext';

const CallInterface: React.FC = () => {
  const { currentCall, endCall, toggleMute } = useCall();
  const [volume, setVolume] = useState(1);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
  };

  const getStatusText = () => {
    switch (currentCall.status) {
      case 'connecting':
        return 'Connecting...';
      case 'ringing':
        return 'Ringing...';
      case 'connected':
        return formatTime(currentCall.duration);
      default:
        return 'Call in progress';
    }
  };

  const getStatusColor = () => {
    switch (currentCall.status) {
      case 'connecting':
        return 'text-yellow-400';
      case 'ringing':
        return 'text-blue-400';
      case 'connected':
        return 'text-green-400';
      default:
        return 'text-white';
    }
  };

  if (!currentCall) return null; // Still hide the component when there's no active or ringing call

  if (isMinimized) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="fixed top-4 right-4 bg-green-600 text-white rounded-lg shadow-lg p-3 z-50 min-w-[280px]"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {currentCall.peerPhoto ? (
              <img
                src={currentCall.peerPhoto}
                alt={currentCall.peerName}
                className="w-10 h-10 rounded-full object-cover border-2 border-white/20"
              />
            ) : (
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/20">
                <User size={20} />
              </div>
            )}
            
            <div className="flex-1 min-w-0">
              <h3 className="font-medium truncate text-sm">
                {currentCall.peerName}
              </h3>
              <p className={`text-xs ${getStatusColor()}`}>
                {getStatusText()}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={toggleMute}
              className={`p-2 rounded-full transition-colors ${
                currentCall.isMuted
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
            >
              {currentCall.isMuted ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <button
              onClick={() => setIsMinimized(false)}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
            >
              <Maximize2 size={16} />
            </button>

            <button
              onClick={endCall}
              className="p-2 bg-red-500 hover:bg-red-600 rounded-full transition-colors"
            >
              <PhoneOff size={16} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-gradient-to-b from-green-400 to-green-600 flex flex-col items-center justify-center text-white z-50"
    >
      {/* Minimize Button */}
      <button
        onClick={() => setIsMinimized(true)}
        className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors"
      >
        <Minimize2 size={20} />
      </button>

      {/* Call Status */}
      <div className="text-center mb-12">
        <motion.div 
          className="mb-6"
          animate={{ 
            scale: currentCall.status === 'ringing' ? [1, 1.05, 1] : 1 
          }}
          transition={{ 
            duration: 2, 
            repeat: currentCall.status === 'ringing' ? Infinity : 0 
          }}
        >
          {currentCall.peerPhoto ? (
            <img
              src={currentCall.peerPhoto}
              alt={currentCall.peerName}
              className="w-32 h-32 rounded-full mx-auto object-cover border-4 border-white/20 shadow-lg"
            />
          ) : (
            <div className="w-32 h-32 bg-white/20 rounded-full mx-auto flex items-center justify-center border-4 border-white/20 shadow-lg">
              <User size={48} />
            </div>
          )}
        </motion.div>
        
        <h2 className="text-2xl font-semibold mb-2">
          {currentCall.peerName}
        </h2>
        
        <p className={`text-lg ${getStatusColor()}`}>
          {getStatusText()}
        </p>
        
        {currentCall.status === 'connected' && (
          <p className="text-white/60 text-sm mt-1">
            Voice call in progress
          </p>
        )}
        
        {currentCall.status === 'ringing' && (
          <motion.p 
            className="text-white/60 text-sm mt-1"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            Calling...
          </motion.p>
        )}
        
        {currentCall.status === 'connecting' && (
          <motion.p 
            className="text-white/60 text-sm mt-1"
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            Establishing connection...
          </motion.p>
        )}
      </div>

      {/* Call Controls */}
      {/* Mute, Speaker, and End Call buttons are now always visible when in a call */}
      <div className="flex items-center space-x-8">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleMute}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            currentCall.isMuted
              ? 'bg-red-500 hover:bg-red-600'
              : 'bg-white/20 hover:bg-white/30'
          }`}
        >
          {currentCall.isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={toggleSpeaker}
          className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors ${
            isSpeakerOn
              ? 'bg-blue-500 hover:bg-blue-600'
              : 'bg-white/20 hover:bg-white/30'
          }`}
        >
          {isSpeakerOn ? <Volume2 size={24} /> : <VolumeX size={24} />}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={endCall}
          className="w-20 h-20 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center transition-colors shadow-lg"
        >
          <PhoneOff size={28} />
        </motion.button>
      </div>

      {/* Call Quality Indicator */}
      {currentCall.status === 'connected' && (
        <div className="absolute top-8 right-8">
          <div className="flex items-center space-x-1">
            {[1, 2, 3, 4].map((bar) => (
              <motion.div
                key={bar}
                className="w-1 bg-white/60 rounded-full"
                style={{ height: `${bar * 4 + 8}px` }}
                animate={{ opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 1, repeat: Infinity, delay: bar * 0.1 }}
              />
            ))}
          </div>
        </div>
      )}

      {/* Volume Control */}
      <div className="absolute bottom-8 left-8">
        <div className="flex items-center space-x-2 bg-white/10 rounded-full px-4 py-2">
          <VolumeX size={16} />
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-20 accent-white"
          />
          <Volume2 size={16} />
        </div>
      </div>
    </motion.div>
  );
};

export default CallInterface;
