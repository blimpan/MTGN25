"use client"
import React, { useState } from 'react';

interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

interface ImageCropperProps {
  imageUrl: string;
  onCrop: (croppedBlob: Blob) => void;
  onCancel: () => void;
}

export default function ImageCropper({ imageUrl, onCrop, onCancel }: ImageCropperProps) {
  const [cropData, setCropData] = useState<CropData>({
    x: 0,
    y: 0,
    width: 200,
    height: 200,
    scale: 1
  });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState<string | false>(false);

  const cropAndConvertImage = (imageUrl: string, cropData: CropData): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        const displayedImg = document.getElementById('cropImage') as HTMLImageElement;
        if (!displayedImg || !displayedImg.parentElement) {
          reject(new Error('Could not find displayed image or its container'));
          return;
        }

        const imageDisplayWidth = displayedImg.clientWidth;
        const imageDisplayHeight = displayedImg.clientHeight;
        const containerWidth = displayedImg.parentElement.clientWidth;
        const containerHeight = displayedImg.parentElement.clientHeight;

        const scaleX = img.naturalWidth / imageDisplayWidth;
        const scaleY = img.naturalHeight / imageDisplayHeight;

        const cropX = cropData.x * scaleX;
        const cropY = cropData.y * scaleY;
        const cropWidth = cropData.width * scaleX;
        const cropHeight = cropData.height * scaleY;

        canvas.width = 200;
        canvas.height = 200;

        if (ctx) {
          ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, 0, 0, 200, 200);
        }

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = imageUrl;
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - cropData.x, y: e.clientY - cropData.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && !isResizing) {
      setCropData(prev => ({
        ...prev,
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCornerMouseDown = (e: React.MouseEvent, corner: string) => {
    e.stopPropagation();
    setIsResizing(corner);

    const handleGlobalMouseMove = (e: MouseEvent) => {
      if (corner === 'bottom-right') {
        const rect = document.getElementById('cropContainer')?.getBoundingClientRect();
        if (rect) {
          const newWidth = Math.max(50, e.clientX - rect.left - cropData.x);
          const newHeight = Math.max(50, e.clientY - rect.top - cropData.y);
          const size = Math.min(newWidth, newHeight);
          setCropData(prev => ({
            ...prev,
            width: size,
            height: size
          }));
        }
      }
    };

    const handleGlobalMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleGlobalMouseMove);
      document.removeEventListener('mouseup', handleGlobalMouseUp);
    };

    document.addEventListener('mousemove', handleGlobalMouseMove);
    document.addEventListener('mouseup', handleGlobalMouseUp);
  };

  const handleCrop = async () => {
    try {
      const croppedBlob = await cropAndConvertImage(imageUrl, cropData);
      onCrop(croppedBlob);
    } catch (error) {
      console.error('Error cropping image:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-2xl w-full mx-4">
        <h3 className="text-lg font-semibold mb-4">Crop Profile Picture</h3>
        
        <div 
          id="cropContainer"
          className="relative w-full h-96 border border-gray-300 overflow-hidden mb-4"
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <img
            id="cropImage"
            src={imageUrl}
            alt="Crop preview"
            className="w-full h-full object-contain"
            draggable={false}
          />
          
          {/* Crop overlay */}
          <div
            className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-20 cursor-move"
            style={{
              left: cropData.x,
              top: cropData.y,
              width: cropData.width,
              height: cropData.height,
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Resize handle */}
            <div
              className="absolute w-3 h-3 bg-blue-500 cursor-se-resize"
              style={{ bottom: -6, right: -6 }}
              onMouseDown={(e) => handleCornerMouseDown(e, 'bottom-right')}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleCrop}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Crop & Upload
          </button>
        </div>
      </div>
    </div>
  );
}
