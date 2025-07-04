import React, { useState, useRef } from 'react';
import { Camera, Upload, X, User, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../../config/firebase';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProfilePhotoUploadProps {
  onClose: () => void;
}

const ProfilePhotoUpload: React.FC<ProfilePhotoUploadProps> = ({ onClose }) => {
  const { currentUser, userProfile, updateUserProfile } = useAuth();
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image size should be less than 5MB');
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview || !currentUser) return;

    setUploading(true);
    try {
      // Convert preview to blob
      const response = await fetch(preview);
      const blob = await response.blob();

      // Upload to Firebase Storage
      const photoRef = ref(storage, `profile-photos/${currentUser.uid}/${Date.now()}.jpg`);
      const snapshot = await uploadBytes(photoRef, blob);
      const downloadURL = await getDownloadURL(snapshot.ref);

      // Update user profile
      await updateUserProfile({ photoURL: downloadURL });

      toast.success('Profile photo updated successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!currentUser || !userProfile?.photoURL) return;

    setUploading(true);
    try {
      // Remove from Firebase Storage if it's a Firebase URL
      if (userProfile.photoURL.includes('firebase')) {
        try {
          const photoRef = ref(storage, userProfile.photoURL);
          await deleteObject(photoRef);
        } catch (error) {
          console.log('Could not delete old photo from storage');
        }
      }

      // Update user profile
      await updateUserProfile({ photoURL: '' });

      toast.success('Profile photo removed successfully!');
      onClose();
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast.error('Failed to remove photo');
    } finally {
      setUploading(false);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Profile Photo</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        {/* Current/Preview Photo */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {preview || userProfile?.photoURL ? (
              <img
                src={preview || userProfile?.photoURL}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-gray-200"
              />
            ) : (
              <div className="w-32 h-32 bg-gray-200 rounded-full flex items-center justify-center border-4 border-gray-200">
                <User size={48} className="text-gray-400" />
              </div>
            )}
            
            {/* Camera overlay */}
            <button
              onClick={triggerFileInput}
              disabled={uploading}
              className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity disabled:opacity-50"
            >
              <Camera size={24} className="text-white" />
            </button>
          </div>
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Action Buttons */}
        <div className="space-y-3">
          {preview ? (
            /* Upload/Cancel buttons when preview is available */
            <div className="flex space-x-3">
              <button
                onClick={() => setPreview(null)}
                disabled={uploading}
                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-1 bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Uploading...</span>
                  </>
                ) : (
                  <>
                    <Upload size={16} />
                    <span>Upload Photo</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            /* Select/Remove buttons when no preview */
            <>
              <button
                onClick={triggerFileInput}
                disabled={uploading}
                className="w-full bg-green-500 text-white py-3 px-4 rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
              >
                <Camera size={16} />
                <span>Select Photo</span>
              </button>
              
              {userProfile?.photoURL && (
                <button
                  onClick={handleRemovePhoto}
                  disabled={uploading}
                  className="w-full bg-red-500 text-white py-3 px-4 rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Removing...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Remove Photo</span>
                    </>
                  )}
                </button>
              )}
            </>
          )}
        </div>

        {/* Tips */}
        <div className="mt-4 text-xs text-gray-500 text-center">
          <p>Supported formats: JPG, PNG, GIF</p>
          <p>Maximum size: 5MB</p>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePhotoUpload;