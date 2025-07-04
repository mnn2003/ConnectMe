import React, { useEffect, useRef } from 'react';
import { Phone, PhoneOff, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCall } from '../../contexts/CallContext';

const CallNotification: React.FC = () => {
  const { incomingCall, acceptCall, declineCall } = useCall();
  const notificationRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ringtoneIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Play ringtone sound effect
  useEffect(() => {
    if (incomingCall) {
      // Create a simple beep sound using Web Audio API
      try {
        const playRingtone = () => {
          const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          
          oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
          
          oscillator.start();
          setTimeout(() => {
            try {
              oscillator.stop();
              audioContext.close();
            } catch (e) {
              // Already stopped
            }
          }, 500);
        };

        // Play ringtone every 2 seconds
        playRingtone();
        ringtoneIntervalRef.current = setInterval(() => {
          if (incomingCall) {
            playRingtone();
          }
        }, 2000);
        
      } catch (error) {
        console.error('Error creating ringtone:', error);
      }

      return () => {
        if (ringtoneIntervalRef.current) {
          clearInterval(ringtoneIntervalRef.current);
          ringtoneIntervalRef.current = null;
        }
      };
    }
  }, [incomingCall]);

  if (!incomingCall) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        ref={notificationRef}
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        className="bg-white rounded-2xl p-8 mx-4 max-w-sm w-full text-center shadow-2xl"
      >
        {/* Caller Info */}
        <div className="mb-8">
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="mb-4"
          >
            {incomingCall.callerPhoto ? (
              <img
                src={incomingCall.callerPhoto}
                alt={incomingCall.callerName}
                className="w-24 h-24 rounded-full mx-auto object-cover border-4 border-green-200"
              />
            ) : (
              <div className="w-24 h-24 bg-gray-300 rounded-full mx-auto flex items-center justify-center border-4 border-green-200">
                <User size={32} className="text-gray-600" />
              </div>
            )}
          </motion.div>
          
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {incomingCall.callerName}
          </h2>
          <p className="text-gray-600">Incoming voice call...</p>
          
          <motion.div
            animate={{ opacity: [1, 0.5, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
            className="mt-4"
          >
            <div className="flex justify-center space-x-1">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 bg-green-500 rounded-full"
                  animate={{ scale: [1, 1.5, 1] }}
                  transition={{
                    duration: 1,
                    repeat: Infinity,
                    delay: i * 0.2,
                  }}
                />
              ))}
            </div>
          </motion.div>
        </div>

        {/* Call Actions */}
        <div className="flex justify-center space-x-8">
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={declineCall}
            className="w-16 h-16 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg"
          >
            <PhoneOff size={24} />
          </motion.button>
          
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={acceptCall}
            className="w-16 h-16 bg-green-500 hover:bg-green-600 rounded-full flex items-center justify-center text-white transition-colors shadow-lg pulse-green"
          >
            <Phone size={24} />
          </motion.button>
        </div>

        {/* Action hint */}
        <div className="mt-6 text-xs text-gray-500">
          <p>Tap to answer or decline</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CallNotification;