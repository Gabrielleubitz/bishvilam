'use client';

import { useState, useEffect } from 'react';
import { addCacheBuster } from '@/lib/imageUtils';

interface ImageWithCacheBusterProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
  cacheBustOnMount?: boolean;
  [key: string]: any; // Allow other img attributes
}

/**
 * Image component that automatically adds cache busting to prevent showing old cached images
 */
export default function ImageWithCacheBuster({
  src,
  alt,
  className,
  onClick,
  onError,
  cacheBustOnMount = true,
  ...props
}: ImageWithCacheBusterProps) {
  const [imageSrc, setImageSrc] = useState<string>(() => {
    // Apply cache buster immediately during initialization to prevent flash
    if (src && cacheBustOnMount) {
      return addCacheBuster(src);
    }
    return src;
  });
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    if (src && cacheBustOnMount) {
      // Add cache buster when src changes to ensure fresh image
      const cacheBustedSrc = addCacheBuster(src);
      setImageSrc(cacheBustedSrc);
    } else {
      setImageSrc(src);
    }
    setImageError(false);
  }, [src, cacheBustOnMount]);

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    setImageError(true);
    if (onError) {
      onError(e);
    }
  };

  const handleLoad = () => {
    setImageError(false);
  };

  if (imageError || !imageSrc) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className || ''}`}
        onClick={onClick}
      >
        <span className="text-gray-500 text-sm">תמונה לא נמצאה</span>
      </div>
    );
  }

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onClick={onClick}
      onError={handleError}
      onLoad={handleLoad}
      {...props}
    />
  );
}