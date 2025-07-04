import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  serverTimestamp,
  onSnapshot,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';

export interface CallData {
  id: string;
  callerId: string;
  receiverId: string;
  callerName: string;
  receiverName: string;
  callerPhoto: string;
  receiverPhoto: string;
  status: 'ringing' | 'accepted' | 'declined' | 'ended';
  timestamp: Date;
  offer?: RTCSessionDescriptionInit;
  answer?: RTCSessionDescriptionInit;
  callerCandidates?: RTCIceCandidateInit[];
  receiverCandidates?: RTCIceCandidateInit[];
}

export class CallService {
  static async createCall(callData: Omit<CallData, 'id' | 'timestamp'>): Promise<string> {
    try {
      const callDoc = await addDoc(collection(db, 'calls'), {
        ...callData,
        timestamp: serverTimestamp(),
        callerCandidates: [],
        receiverCandidates: []
      });
      return callDoc.id;
    } catch (error) {
      console.error('Error creating call:', error);
      throw error;
    }
  }

  static async updateCallStatus(
    callId: string, 
    status: CallData['status'], 
    additionalData?: Partial<CallData>
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status,
        ...additionalData
      });
    } catch (error) {
      console.error('Error updating call status:', error);
      throw error;
    }
  }

  static async acceptCall(callId: string, answer: RTCSessionDescriptionInit): Promise<void> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'accepted',
        answer: {
          type: answer.type,
          sdp: answer.sdp
        }
      });
    } catch (error) {
      console.error('Error accepting call:', error);
      throw error;
    }
  }

  static async declineCall(callId: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'calls', callId), {
        status: 'declined'
      });
    } catch (error) {
      console.error('Error declining call:', error);
      throw error;
    }
  }

  static async endCall(callId: string, duration?: number): Promise<void> {
    try {
      const updateData: any = { status: 'ended' };
      if (duration !== undefined) {
        updateData.duration = duration;
      }
      
      await updateDoc(doc(db, 'calls', callId), updateData);
    } catch (error) {
      console.error('Error ending call:', error);
      throw error;
    }
  }

  static subscribeToCall(callId: string, callback: (callData: CallData | null) => void): () => void {
    return onSnapshot(doc(db, 'calls', callId), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        callback({
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate() || new Date()
        } as CallData);
      } else {
        callback(null);
      }
    });
  }

  static subscribeToIncomingCalls(
    userId: string, 
    callback: (calls: CallData[]) => void
  ): () => void {
    const callsQuery = query(
      collection(db, 'calls'),
      where('receiverId', '==', userId),
      where('status', '==', 'ringing'),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(callsQuery, (snapshot) => {
      const calls = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date()
      })) as CallData[];
      
      callback(calls);
    });
  }

  static subscribeToCallHistory(
    userId: string, 
    callback: (history: CallData[]) => void
  ): () => void {
    const historyQuery = query(
      collection(db, 'calls'),
      orderBy('timestamp', 'desc')
    );

    return onSnapshot(historyQuery, (snapshot) => {
      const history = snapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate() || new Date()
        }))
        .filter((call: any) => 
          call.callerId === userId || call.receiverId === userId
        ) as CallData[];

      callback(history);
    });
  }
}