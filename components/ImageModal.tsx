'use client';

import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  imageUrl: string;
  altText: string;
  onClose: () => void;
  modalType?: 'team' | 'gallery';
  teamMemberPosition?: string;
  onPrevious?: () => void;
  onNext?: () => void;
  hasNavigation?: boolean;
}

export default function ImageModal({ 
  isOpen, 
  imageUrl, 
  altText, 
  onClose, 
  modalType = 'team',
  teamMemberPosition,
  onPrevious,
  onNext,
  hasNavigation = false
}: ImageModalProps) {
  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (hasNavigation && e.key === 'ArrowLeft' && onPrevious) {
        onPrevious();
      } else if (hasNavigation && e.key === 'ArrowRight' && onNext) {
        onNext();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeydown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, onPrevious, onNext, hasNavigation]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <div className="relative max-w-7xl max-h-[90vh] mx-4">
        {/* Close button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="absolute -top-12 right-0 text-white hover:text-brand-green transition-colors duration-200 z-10"
          aria-label="סגור"
        >
          <X size={32} />
        </button>

        {/* Navigation arrows for gallery */}
        {hasNavigation && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious && onPrevious();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-brand-green transition-colors duration-200 z-10 bg-black/50 rounded-full p-3 md:p-4"
              aria-label="תמונה קודמת"
            >
              <ChevronLeft size={24} />
            </button>
            
            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext && onNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-brand-green transition-colors duration-200 z-10 bg-black/50 rounded-full p-3 md:p-4"
              aria-label="תמונה הבאה"
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

        {/* Image */}
        <img
          src={imageUrl}
          alt={altText}
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        />

        {/* Military-style corners */}
        <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-brand-green opacity-70"></div>
        <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-brand-green opacity-70"></div>
        <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-brand-green opacity-70"></div>
        <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-brand-green opacity-70"></div>

        {/* Information display */}
        {(altText || teamMemberPosition) && (
          <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-sm border-l-2 border-brand-green px-4 py-2 rounded">
            {modalType === 'team' && teamMemberPosition ? (
              <>
                <div className="text-brand-green text-sm font-mono mb-1">[ צוות ]</div>
                <div className="text-white text-sm font-semibold">{altText}</div>
                <div className="text-brand-green text-sm">{teamMemberPosition}</div>
              </>
            ) : (
              <>
                <div className="text-brand-green text-sm font-mono mb-1">[ גלריית פעילות ]</div>
                <div className="text-white text-sm">{altText}</div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}