import React from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageViewerProps {
  imageUrl: string;
  isOpen: boolean;
  onClose: () => void;
  senderName?: string;
  timestamp?: Date;
}

const ImageViewer: React.FC<ImageViewerProps> = ({ 
  imageUrl, 
  isOpen, 
  onClose, 
  senderName, 
  timestamp 
}) => {
  const [zoom, setZoom] = React.useState(1);
  const [rotation, setRotation] = React.useState(0);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `image_${Date.now()}.jpg`;
    link.click();
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.25));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleReset = () => {
    setZoom(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && zoom > 1) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case '+':
      case '=':
        handleZoomIn();
        break;
      case '-':
        handleZoomOut();
        break;
      case 'r':
      case 'R':
        handleRotate();
        break;
      case '0':
        handleReset();
        break;
    }
  };

  React.useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  // Reset state when image changes
  React.useEffect(() => {
    if (isOpen) {
      handleReset();
    }
  }, [imageUrl, isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center"
        onClick={onClose}
      >
        {/* Header */}
        <div className="absolute top-0 left-0 right-0 bg-black/50 text-white p-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              {senderName && (
                <h3 className="font-medium">{senderName}</h3>
              )}
              {timestamp && (
                <p className="text-sm text-gray-300">
                  {timestamp.toLocaleDateString()} {timestamp.toLocaleTimeString()}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={handleDownload}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Download"
              >
                <Download size={20} />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 z-10">
          <div className="flex items-center justify-center space-x-4">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.25}
              className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom Out (-)"
            >
              <ZoomOut size={20} />
            </button>
            
            <span className="text-sm font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="p-2 hover:bg-white/20 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Zoom In (+)"
            >
              <ZoomIn size={20} />
            </button>
            
            <div className="w-px h-6 bg-white/30"></div>
            
            <button
              onClick={handleRotate}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
              title="Rotate (R)"
            >
              <RotateCw size={20} />
            </button>
            
            <button
              onClick={handleReset}
              className="px-3 py-1 text-sm hover:bg-white/20 rounded transition-colors"
              title="Reset (0)"
            >
              Reset
            </button>
          </div>
          
          <div className="text-center text-xs text-gray-400 mt-2">
            Use mouse wheel to zoom • Drag to pan • ESC to close
          </div>
        </div>

        {/* Image */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          className="relative max-w-full max-h-full overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <img
            src={imageUrl}
            alt="Full size"
            className={`max-w-none transition-transform duration-200 ${
              zoom > 1 ? 'cursor-grab' : 'cursor-zoom-in'
            } ${isDragging ? 'cursor-grabbing' : ''}`}
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
              maxWidth: zoom === 1 ? '90vw' : 'none',
              maxHeight: zoom === 1 ? '80vh' : 'none'
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onClick={zoom === 1 ? handleZoomIn : undefined}
            onWheel={(e) => {
              e.preventDefault();
              if (e.deltaY < 0) {
                handleZoomIn();
              } else {
                handleZoomOut();
              }
            }}
            draggable={false}
          />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ImageViewer;