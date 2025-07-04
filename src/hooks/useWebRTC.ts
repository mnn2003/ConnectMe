import { useRef, useCallback } from 'react';
import { doc, updateDoc, getDocs, query, collection, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import toast from 'react-hot-toast';

export interface WebRTCHooks {
  peerConnectionRef: React.MutableRefObject<RTCPeerConnection | null>;
  localStreamRef: React.MutableRefObject<MediaStream | null>;
  remoteAudioRef: React.MutableRefObject<HTMLAudioElement | null>;
  createPeerConnection: (
    currentCallDocRef: string | null,
    isCallerRef: boolean,
    onTrack: (event: RTCTrackEvent) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
  ) => RTCPeerConnection;
  requestMicrophoneAccess: () => Promise<MediaStream | null>;
  addIceCandidate: (callId: string, candidate: RTCIceCandidateInit, isCallerCandidate: boolean) => Promise<void>;
  cleanup: () => void;
}

export const useWebRTC = (): WebRTCHooks => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  const checkMicrophonePermission = async (): Promise<boolean> => {
    try {
      if (!window.isSecureContext && window.location.protocol !== 'http:' && window.location.hostname !== 'localhost') {
        toast.error('Voice calls require a secure connection (HTTPS)');
        return false;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast.error('Your browser does not support voice calls');
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking microphone permission:', error);
      return true;
    }
  };

  const requestMicrophoneAccess = useCallback(async (): Promise<MediaStream | null> => {
    try {
      const hasPermission = await checkMicrophonePermission();
      if (!hasPermission) {
        return null;
      }

      console.log('Requesting microphone access...');
      
      const constraints = {
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: { ideal: 44100 },
          channelCount: { ideal: 1 }
        },
        video: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Microphone access granted:', stream);
      
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks found in stream');
      }

      return stream;
    } catch (error: any) {
      console.error('Microphone access error:', error);
      
      switch (error.name) {
        case 'NotAllowedError':
          toast.error('Microphone access denied. Please allow microphone access and try again.');
          break;
        case 'NotFoundError':
          toast.error('No microphone found. Please connect a microphone and try again.');
          break;
        case 'NotReadableError':
          toast.error('Microphone is being used by another application.');
          break;
        case 'OverconstrainedError':
          toast.error('Microphone does not meet the required specifications.');
          break;
        case 'SecurityError':
          toast.error('Microphone access blocked due to security restrictions.');
          break;
        case 'AbortError':
          toast.error('Microphone access was aborted.');
          break;
        default:
          toast.error(`Could not access microphone: ${error.message || 'Unknown error'}`);
      }
      
      return null;
    }
  }, []);

  const createPeerConnection = useCallback((
    currentCallDocRef: string | null,
    isCallerRef: boolean,
    onTrack: (event: RTCTrackEvent) => void,
    onConnectionStateChange: (state: RTCPeerConnectionState) => void
  ): RTCPeerConnection => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        { urls: 'stun:stun.services.mozilla.com' },
        { urls: 'stun:stun.stunprotocol.org:3478' }
      ],
      iceCandidatePoolSize: 10
    };

    const peerConnection = new RTCPeerConnection(configuration);

    peerConnection.onicecandidate = async (event) => {
      if (event.candidate && currentCallDocRef) {
        await addIceCandidate(currentCallDocRef, event.candidate.toJSON(), isCallerRef);
      }
    };

    peerConnection.ontrack = onTrack;
    peerConnection.onconnectionstatechange = () => onConnectionStateChange(peerConnection.connectionState);

    peerConnection.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', peerConnection.iceConnectionState);
      switch (peerConnection.iceConnectionState) {
        case 'connected':
        case 'completed':
          console.log('ICE connection established');
          break;
        case 'failed':
          console.log('ICE connection failed');
          toast.error('Connection failed - poor network connectivity');
          break;
        case 'disconnected':
          console.log('ICE connection disconnected');
          break;
      }
    };

    peerConnectionRef.current = peerConnection;
    return peerConnection;
  }, []);

  const addIceCandidate = useCallback(async (
    callId: string, 
    candidate: RTCIceCandidateInit, 
    isCallerCandidate: boolean
  ): Promise<void> => {
    try {
      console.log('Adding ICE candidate:', candidate);
      const candidateField = isCallerCandidate ? 'callerCandidates' : 'receiverCandidates';
      
      const callDoc = doc(db, 'calls', callId);
      const callSnapshot = await getDocs(query(collection(db, 'calls'), where('__name__', '==', callId)));
      
      if (!callSnapshot.empty) {
        const currentData = callSnapshot.docs[0].data();
        const existingCandidates = currentData[candidateField] || [];
        
        await updateDoc(callDoc, {
          [candidateField]: [...existingCandidates, candidate]
        });
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, []);

  const cleanup = useCallback(() => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
  }, []);

  return {
    peerConnectionRef,
    localStreamRef,
    remoteAudioRef,
    createPeerConnection,
    requestMicrophoneAccess,
    addIceCandidate,
    cleanup
  };
};