import React, { createContext, useContext, useState } from 'react';
import { CallLog } from '../types';

export interface CallState {
  peerId: string;
  peerName: string;
  peerPhoto: string;
  duration: number;
  isMuted: boolean;
  status: 'connecting' | 'connected' | 'ringing';
}

interface CallStateContextType {
  isInCall: boolean;
  setIsInCall: (inCall: boolean) => void;
  currentCall: CallState | null;
  setCurrentCall: (call: CallState | null) => void;
  callHistory: CallLog[];
  setCallHistory: (history: CallLog[]) => void;
  addToCallHistory: (call: CallLog) => void;
}

const CallStateContext = createContext<CallStateContextType | null>(null);

export const useCallState = () => {
  const context = useContext(CallStateContext);
  if (!context) {
    throw new Error('useCallState must be used within a CallStateProvider');
  }
  return context;
};

export const CallStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isInCall, setIsInCall] = useState(false);
  const [currentCall, setCurrentCall] = useState<CallState | null>(null);
  const [callHistory, setCallHistory] = useState<CallLog[]>([]);

  const addToCallHistory = (call: CallLog) => {
    setCallHistory(prev => [call, ...prev]);
  };

  const value = {
    isInCall,
    setIsInCall,
    currentCall,
    setCurrentCall,
    callHistory,
    setCallHistory,
    addToCallHistory
  };

  return (
    <CallStateContext.Provider value={value}>
      {children}
    </CallStateContext.Provider>
  );
};