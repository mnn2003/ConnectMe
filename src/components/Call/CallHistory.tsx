import React from 'react';
import { Phone, PhoneIncoming, PhoneMissed, PhoneOutgoing, User } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useCall } from '../../contexts/CallContext';
import { useAuth } from '../../contexts/AuthContext';

const CallHistory: React.FC = () => {
  const { callHistory, initiateCall } = useCall();
  const { currentUser } = useAuth();

  const getCallIcon = (call: any) => {
    const isIncoming = call.receiverId === currentUser?.uid;
    const iconClass = "w-4 h-4";

    switch (call.status) {
      case 'completed':
        return isIncoming ? 
          <PhoneIncoming className={`${iconClass} text-green-600`} /> :
          <PhoneOutgoing className={`${iconClass} text-blue-600`} />;
      case 'missed':
        return <PhoneMissed className={`${iconClass} text-red-600`} />;
      case 'declined':
        return <PhoneMissed className={`${iconClass} text-orange-600`} />;
      default:
        return <Phone className={`${iconClass} text-gray-600`} />;
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleCallBack = (call: any) => {
    const isIncoming = call.receiverId === currentUser?.uid;
    const contactId = isIncoming ? call.callerId : call.receiverId;
    const contactName = isIncoming ? call.callerName : call.receiverName;
    const contactPhoto = isIncoming ? call.callerPhoto : call.receiverPhoto;

    initiateCall(contactId, contactName, contactPhoto);
  };

  if (callHistory.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        <Phone size={48} className="mx-auto mb-4 text-gray-300" />
        <p>No call history</p>
        <p className="text-sm">Make your first call to see history here</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto">
      {callHistory.map((call, index) => {
        const isIncoming = call.receiverId === currentUser?.uid;
        const contactName = isIncoming ? call.callerName : call.receiverName;
        const contactPhoto = isIncoming ? call.callerPhoto : call.receiverPhoto;

        return (
          <motion.div
            key={call.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="flex items-center p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-100 transition-colors"
            onClick={() => handleCallBack(call)}
          >
            {/* Profile Picture */}
            <div className="relative">
              {contactPhoto ? (
                <img
                  src={contactPhoto}
                  alt={contactName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                  <User size={20} className="text-gray-600" />
                </div>
              )}
            </div>

            {/* Call Info */}
            <div className="ml-3 flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                {getCallIcon(call)}
                <h3 className="font-medium text-gray-900 truncate">
                  {contactName}
                </h3>
              </div>
              
              <div className="flex items-center space-x-2 mt-1">
                <span className="text-sm text-gray-500">
                  {formatDistanceToNow(call.timestamp, { addSuffix: true })}
                </span>
                {call.duration && call.status === 'completed' && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm text-gray-500">
                      {formatDuration(call.duration)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Call Button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCallBack(call);
              }}
              className="p-2 text-green-600 hover:bg-green-100 rounded-full transition-colors"
            >
              <Phone size={18} />
            </button>
          </motion.div>
        );
      })}
    </div>
  );
};

export default CallHistory;