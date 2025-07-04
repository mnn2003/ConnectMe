import React, { createContext, useContext, useRef, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { useCallState } from './CallStateContext';
import { useIncomingCall } from './IncomingCallContext';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCallTimer } from '../hooks/useCallTimer';
import { CallService, CallData } from '../services/callService';
import { CallLog } from '../types';
import toast from 'react-hot-toast';

interface CallContextType {
  isInCall: boolean;
  incomingCall: CallData | null;
  callHistory: CallLog[];
  currentCall: {
    peerId: string;
    peerName: string;
    peerPhoto: string;
    duration: number;
    isMuted: boolean;
    status: 'connecting' | 'connected' | 'ringing';
  } | null;
  initiateCall: (peerId: string, peerName: string, peerPhoto: string) => void;
  acceptCall: () => void;
  declineCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
}

const CallContext = createContext<CallContextType | null>(null);

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, userProfile } = useAuth();
  const { 
    isInCall, 
    setIsInCall, 
    currentCall, 
    setCurrentCall, 
    callHistory, 
    setCallHistory, 
    addToCallHistory 
  } = useCallState();
  const { incomingCall, setIncomingCall } = useIncomingCall();
  const { 
    peerConnectionRef, 
    localStreamRef, 
    remoteAudioRef, 
    createPeerConnection, 
    requestMicrophoneAccess, 
    cleanup 
  } = useWebRTC();
  const { callDuration, startTimer, stopTimer, resetTimer } = useCallTimer();

  const currentCallDocRef = useRef<string | null>(null);
  const callTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isCallerRef = useRef<boolean>(false);
  const callListenerRef = useRef<(() => void) | null>(null);

  // Initialize audio element
  useEffect(() => {
    if (!remoteAudioRef.current) {
      remoteAudioRef.current = new Audio();
      remoteAudioRef.current.autoplay = true;
      remoteAudioRef.current.volume = 1.0;
    }
  }, [remoteAudioRef]);

  const handleTrackReceived = (event: RTCTrackEvent) => {
    console.log('Received remote track:', event);
    if (remoteAudioRef.current && event.streams[0]) {
      console.log('Setting remote stream to audio element');
      remoteAudioRef.current.srcObject = event.streams[0];
      remoteAudioRef.current.play().then(() => {
        console.log('Remote audio playing successfully');
        setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
        setIsInCall(true);
        toast.success('Call connected');
      }).catch(error => {
        console.error('Error playing remote audio:', error);
      });
    }
  };

  const handleConnectionStateChange = (state: RTCPeerConnectionState) => {
    console.log('Connection state:', state);
    switch (state) {
      case 'connected':
        console.log('Peer connection established');
        setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
        setIsInCall(true);
        break;
      case 'disconnected':
        console.log('Peer connection disconnected');
        break;
      case 'failed':
        console.log('Peer connection failed');
        toast.error('Call connection failed');
        endCall();
        break;
      case 'closed':
        console.log('Peer connection closed');
        break;
    }
  };

  const initiateCall = async (peerId: string, peerName: string, peerPhoto: string) => {
    if (!currentUser || !userProfile) {
      toast.error('Please log in to make calls');
      return;
    }

    if (isInCall || currentCall) {
      toast.error('Already in a call');
      return;
    }

    try {
      console.log('Initiating call to:', peerName);
      isCallerRef.current = true;
      
      // Set initial call state
      setCurrentCall({
        peerId,
        peerName,
        peerPhoto,
        duration: 0,
        isMuted: false,
        status: 'connecting'
      });

      // Request microphone access
      const stream = await requestMicrophoneAccess();
      if (!stream) {
        console.error('Failed to get microphone access');
        setCurrentCall(null);
        return;
      }

      localStreamRef.current = stream;

      // Create peer connection
      const peerConnection = createPeerConnection(
        currentCallDocRef.current,
        isCallerRef.current,
        handleTrackReceived,
        handleConnectionStateChange
      );

      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Create offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      
      await peerConnection.setLocalDescription(offer);

      // Create call document
      const callId = await CallService.createCall({
        callerId: currentUser.uid,
        receiverId: peerId,
        callerName: userProfile.name,
        receiverName: peerName,
        callerPhoto: userProfile.photoURL || '',
        receiverPhoto: peerPhoto,
        status: 'ringing',
        offer: {
          type: offer.type,
          sdp: offer.sdp
        }
      });

      currentCallDocRef.current = callId;
      setCurrentCall(prev => prev ? { ...prev, status: 'ringing' } : null);
      toast.success(`Calling ${peerName}...`);

      // Listen for call updates
      const unsubscribe = CallService.subscribeToCall(callId, async (callData) => {
        if (!callData) return;

        if (callData.status === 'declined') {
          toast.error('Call declined');
          endCall();
          unsubscribe();
        } else if (callData.status === 'accepted' && callData.answer) {
          try {
            const answer = new RTCSessionDescription(callData.answer);
            await peerConnection.setRemoteDescription(answer);
            startTimer();
            setCurrentCall(prev => prev ? { ...prev, status: 'connected' } : null);
          } catch (error) {
            console.error('Error setting remote description:', error);
            toast.error('Failed to establish connection');
            endCall();
          }
        } else if (callData.status === 'ended') {
          endCall();
          unsubscribe();
        }
      });

      callListenerRef.current = unsubscribe;

      // Auto-end call after 60 seconds if not answered
      callTimeoutRef.current = setTimeout(() => {
        if (currentCallDocRef.current === callId && currentCall?.status === 'ringing') {
          endCall();
          toast.error('Call timeout - no answer');
          unsubscribe();
        }
      }, 60000);

    } catch (error: any) {
      console.error('Error initiating call:', error);
      toast.error(`Failed to initiate call: ${error.message}`);
      endCall();
    }
  };

  const acceptCall = async () => {
    if (!incomingCall || !currentUser) return;

    try {
      console.log('Accepting call from:', incomingCall.callerName);
      isCallerRef.current = false;
      
      setCurrentCall({
        peerId: incomingCall.callerId,
        peerName: incomingCall.callerName,
        peerPhoto: incomingCall.callerPhoto,
        duration: 0,
        isMuted: false,
        status: 'connecting'
      });
      
      const stream = await requestMicrophoneAccess();
      if (!stream) {
        declineCall();
        return;
      }

      localStreamRef.current = stream;

      const peerConnection = createPeerConnection(
        incomingCall.id,
        isCallerRef.current,
        handleTrackReceived,
        handleConnectionStateChange
      );

      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Set remote description and create answer
      const offer = new RTCSessionDescription(incomingCall.offer!);
      await peerConnection.setRemoteDescription(offer);

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      await CallService.acceptCall(incomingCall.id, answer);

      currentCallDocRef.current = incomingCall.id;
      setIncomingCall(null);
      startTimer();
      toast.success('Call accepted');

    } catch (error: any) {
      console.error('Error accepting call:', error);
      toast.error(`Failed to accept call: ${error.message}`);
      declineCall();
    }
  };

  const declineCall = async () => {
    if (!incomingCall) return;

    try {
      await CallService.declineCall(incomingCall.id);
      setIncomingCall(null);
      toast.info('Call declined');
    } catch (error) {
      console.error('Error declining call:', error);
    }
  };

  const endCall = async () => {
    console.log('Ending call...');
    
    // Clear timeouts
    if (callTimeoutRef.current) {
      clearTimeout(callTimeoutRef.current);
      callTimeoutRef.current = null;
    }

    stopTimer();

    if (callListenerRef.current) {
      callListenerRef.current();
      callListenerRef.current = null;
    }

    cleanup();

    // Update call status in Firestore
    if (currentCallDocRef.current) {
      try {
        await CallService.endCall(currentCallDocRef.current, callDuration);
      } catch (error) {
        console.error('Error updating call status:', error);
      }
    }

    // Save to call history
    if (currentCall && currentUser && userProfile) {
      const callLog: CallLog = {
        id: Date.now().toString(),
        callerId: isCallerRef.current ? currentUser.uid : currentCall.peerId,
        receiverId: isCallerRef.current ? currentCall.peerId : currentUser.uid,
        callerName: isCallerRef.current ? userProfile.name : currentCall.peerName,
        receiverName: isCallerRef.current ? currentCall.peerName : userProfile.name,
        callerPhoto: isCallerRef.current ? (userProfile.photoURL || '') : currentCall.peerPhoto,
        receiverPhoto: isCallerRef.current ? currentCall.peerPhoto : (userProfile.photoURL || ''),
        timestamp: new Date(),
        duration: callDuration,
        status: 'completed',
        type: 'voice'
      };

      addToCallHistory(callLog);
    }

    // Reset state
    setIsInCall(false);
    setCurrentCall(null);
    resetTimer();
    currentCallDocRef.current = null;
    isCallerRef.current = false;

    toast.info('Call ended');
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });

      setCurrentCall(prev => prev ? {
        ...prev,
        isMuted: !prev.isMuted
      } : null);

      toast.info(currentCall?.isMuted ? 'Microphone unmuted' : 'Microphone muted');
    }
  };

  // Load call history
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = CallService.subscribeToCallHistory(currentUser.uid, (history) => {
      setCallHistory(history as CallLog[]);
    });

    return unsubscribe;
  }, [currentUser, setCallHistory]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callTimeoutRef.current) {
        clearTimeout(callTimeoutRef.current);
      }
      stopTimer();
      if (callListenerRef.current) {
        callListenerRef.current();
      }
      cleanup();
    };
  }, [stopTimer, cleanup]);

  const value = {
    isInCall,
    incomingCall,
    callHistory,
    currentCall: currentCall ? {
      ...currentCall,
      duration: callDuration
    } : null,
    initiateCall,
    acceptCall,
    declineCall,
    endCall,
    toggleMute
  };

  return (
    <CallContext.Provider value={value}>
      {children}
    </CallContext.Provider>
  );
};