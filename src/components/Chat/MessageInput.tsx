import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, Smile, Mic, Image, File, X, Play, Pause, Square } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChat } from '../../contexts/ChatContext';
import EmojiPicker from 'emoji-picker-react';

const MessageInput: React.FC = () => {
  const { activeChat, sendMessage, sendFileMessage, setTyping } = useChat();
  const [message, setMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

  // Check if device is mobile
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !activeChat) return;

    try {
      await sendMessage(activeChat.id, message.trim());
      setMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    
    if (!activeChat) return;

    // Handle typing indicator
    if (e.target.value.trim() && !isTyping) {
      setIsTyping(true);
      setTyping(activeChat.id, true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      setTyping(activeChat.id, false);
    }, 2000);
  };

  const handleEmojiClick = (emojiObject: any) => {
    setMessage(prev => prev + emojiObject.emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  };

  const handleEmojiButtonClick = () => {
    if (isMobile) {
      // On mobile, focus the input to trigger the native emoji keyboard
      inputRef.current?.focus();
      
      // Try to trigger the emoji keyboard on mobile devices
      if (inputRef.current) {
        // For iOS devices
        if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
          // iOS doesn't have a direct way to open emoji keyboard
          // But focusing the input and showing a hint helps
          setShowEmojiPicker(true);
          setTimeout(() => setShowEmojiPicker(false), 2000);
        }
        // For Android devices
        else if (/Android/.test(navigator.userAgent)) {
          // Android devices can sometimes trigger emoji keyboard with specific input events
          const event = new KeyboardEvent('keydown', {
            key: 'F1', // Some Android keyboards respond to F1 for emoji
            code: 'F1',
            which: 112,
            keyCode: 112
          });
          inputRef.current.dispatchEvent(event);
        }
      }
    } else {
      // On desktop, show the emoji picker
      setShowEmojiPicker(!showEmojiPicker);
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file' | 'audio') => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    try {
      if (type === 'audio') {
        // For audio files, we'll treat them as regular files but with audio icon
        await sendFileMessage(activeChat.id, file, 'file');
      } else {
        await sendFileMessage(activeChat.id, file, type);
      }
      setShowAttachmentMenu(false);
    } catch (error) {
      console.error('Error sending file:', error);
    }

    // Reset input
    e.target.value = '';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      const chunks: BlobPart[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
    }
  };

  const cancelRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setRecordingTime(0);
  };

  const sendAudioMessage = async () => {
    if (!audioBlob || !activeChat) return;

    try {
      // Convert blob to file
      const audioFile = new File([audioBlob], `voice_message_${Date.now()}.webm`, {
        type: 'audio/webm;codecs=opus'
      });
      
      await sendFileMessage(activeChat.id, audioFile, 'file');
      setAudioBlob(null);
      setRecordingTime(0);
    } catch (error) {
      console.error('Error sending audio message:', error);
    }
  };

  const playAudioPreview = () => {
    if (!audioBlob) return;

    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }

    const audio = new Audio(URL.createObjectURL(audioBlob));
    audioPreviewRef.current = audio;
    
    audio.onended = () => {
      setIsPlayingPreview(false);
    };
    
    audio.play();
    setIsPlayingPreview(true);
  };

  const stopAudioPreview = () => {
    if (audioPreviewRef.current) {
      audioPreviewRef.current.pause();
      audioPreviewRef.current = null;
    }
    setIsPlayingPreview(false);
  };

  const formatRecordingTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const adjustTextareaHeight = () => {
    const textarea = inputRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (audioPreviewRef.current) {
        audioPreviewRef.current.pause();
      }
    };
  }, []);

  if (!activeChat) return null;

  // Audio recording interface
  if (isRecording || audioBlob) {
    return (
      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex items-center space-x-3">
          {isRecording ? (
            <>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-3 h-3 bg-red-500 rounded-full"
              />
              <span className="text-red-600 font-medium">
                Recording... {formatRecordingTime(recordingTime)}
              </span>
              <div className="flex-1" />
              <button
                onClick={cancelRecording}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
              <button
                onClick={stopRecording}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <Square size={20} />
              </button>
            </>
          ) : (
            <>
              <div className="w-3 h-3 bg-green-500 rounded-full" />
              <span className="text-green-600 font-medium">
                Voice message ({formatRecordingTime(recordingTime)})
              </span>
              <div className="flex-1" />
              <button
                onClick={isPlayingPreview ? stopAudioPreview : playAudioPreview}
                className="p-2 text-blue-600 hover:bg-blue-100 rounded-full transition-colors"
              >
                {isPlayingPreview ? <Pause size={20} /> : <Play size={20} />}
              </button>
              <button
                onClick={cancelRecording}
                className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={20} />
              </button>
              <button
                onClick={sendAudioMessage}
                className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
              >
                <Send size={20} />
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border-t border-gray-200 p-4">
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.doc,.docx,.txt,.zip,.rar"
        onChange={(e) => handleFileSelect(e, 'file')}
        className="hidden"
      />
      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, 'image')}
        className="hidden"
      />
      <input
        ref={audioInputRef}
        type="file"
        accept="audio/*"
        onChange={(e) => handleFileSelect(e, 'audio')}
        className="hidden"
      />

      {/* Emoji Picker */}
      <AnimatePresence>
        {showEmojiPicker && !isMobile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute bottom-20 left-4 z-50"
          >
            <EmojiPicker onEmojiClick={handleEmojiClick} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile emoji hint */}
      <AnimatePresence>
        {showEmojiPicker && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-20 left-4 right-4 bg-blue-100 border border-blue-200 rounded-lg p-3 z-50"
          >
            <p className="text-blue-800 text-sm text-center">
              📱 Use your device's emoji keyboard to add emojis
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment Menu */}
      <AnimatePresence>
        {showAttachmentMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute bottom-20 left-4 bg-white rounded-lg shadow-lg border p-2 z-50"
          >
            <div className="flex flex-col space-y-2">
              <button
                onClick={() => imageInputRef.current?.click()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                  <Image size={20} className="text-purple-600" />
                </div>
                <span className="text-gray-700">Photo</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                  <File size={20} className="text-blue-600" />
                </div>
                <span className="text-gray-700">Document</span>
              </button>

              <button
                onClick={() => audioInputRef.current?.click()}
                className="flex items-center space-x-3 p-3 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Mic size={20} className="text-green-600" />
                </div>
                <span className="text-gray-700">Audio File</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="flex items-end space-x-2">
        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          {showAttachmentMenu ? <X size={20} /> : <Paperclip size={20} />}
        </button>

        {/* Message Input Container */}
        <div className="flex-1 relative">
          <div className="flex items-end bg-gray-100 rounded-2xl">
            {/* Emoji Button */}
            <button
              type="button"
              onClick={handleEmojiButtonClick}
              className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
              title={isMobile ? "Open emoji keyboard" : "Open emoji picker"}
            >
              <Smile size={20} />
            </button>

            {/* Text Input */}
            <textarea
              ref={inputRef}
              value={message}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder={isMobile ? "Type a message... (tap 😊 for emojis)" : "Type a message..."}
              className="flex-1 bg-transparent border-none outline-none resize-none py-2 px-1 text-gray-900 placeholder-gray-500 max-h-32"
              rows={1}
            />
          </div>
        </div>

        {/* Send/Voice Button */}
        {message.trim() ? (
          <motion.button
            type="submit"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
          >
            <Send size={20} />
          </motion.button>
        ) : (
          <motion.button
            type="button"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onMouseLeave={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors active:bg-green-700"
            title="Hold to record voice message"
          >
            <Mic size={20} />
          </motion.button>
        )}
      </form>
    </div>
  );
};

export default MessageInput;