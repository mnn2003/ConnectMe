import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { CallService, CallData } from '../services/callService';
import { useCallState } from './CallStateContext';

interface IncomingCallContextType {
  incomingCall: CallData | null;
  setIncomingCall: (call: CallData | null) => void;
}

const IncomingCallContext = createContext<IncomingCallContextType | null>(null);

export const useIncomingCall = () => {
  const context = useContext(IncomingCallContext);
  if (!context) {
    throw new Error('useIncomingCall must be used within an IncomingCallProvider');
  }
  return context;
};

export const IncomingCallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const { isInCall, currentCall } = useCallState();
  const [incomingCall, setIncomingCall] = useState<CallData | null>(null);

  // Listen for incoming calls
  useEffect(() => {
    if (!currentUser) return;

    console.log('Setting up incoming call listener for user:', currentUser.uid);

    const unsubscribe = CallService.subscribeToIncomingCalls(currentUser.uid, (calls) => {
      const latestCall = calls[0];
      
      if (latestCall && !isInCall && !currentCall) {
        console.log('Incoming call detected:', latestCall);
        setIncomingCall(latestCall);

        // Play notification
        if ('Notification' in window && Notification.permission === 'granted') {
          new Notification(`Incoming call from ${latestCall.callerName}`, {
            body: 'Voice call',
            icon: latestCall.callerPhoto || '/vite.svg',
            tag: 'incoming-call'
          });
        }

        // Auto-decline after 30 seconds
        setTimeout(() => {
          setIncomingCall(current => {
            if (current?.id === latestCall.id) {
              CallService.declineCall(latestCall.id);
              return null;
            }
            return current;
          });
        }, 30000);
      }
    });

    return unsubscribe;
  }, [currentUser, isInCall, currentCall]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const value = {
    incomingCall,
    setIncomingCall
  };

  return (
    <IncomingCallContext.Provider value={value}>
      {children}
    </IncomingCallContext.Provider>
  );
};