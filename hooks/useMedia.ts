'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  isActive: boolean;
  lastUpdated: Date;
}

interface MediaCategories {
  hero: MediaItem[];
  memorial: MediaItem[];
  gallery: MediaItem[];
  navbar: MediaItem[];
  events: MediaItem[];
  videos: MediaItem[];
}

const getDefaultMediaData = (): MediaCategories => ({
  hero: [],
  memorial: [],
  gallery: [],
  navbar: [],
  events: [],
  videos: []
});

export const useMedia = () => {
  const [mediaData, setMediaData] = useState<MediaCategories>(getDefaultMediaData());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up real-time listener for media data
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'media'),
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setMediaData({
            hero: data.hero || [],
            memorial: data.memorial || [],
            gallery: data.gallery || [],
            navbar: data.navbar || [],
            events: data.events || [],
            videos: data.videos || []
          });
        } else {
          setMediaData(getDefaultMediaData());
        }
        setLoading(false);
      },
      (error) => {
        console.error('Error loading media data:', error);
        setMediaData(getDefaultMediaData());
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Helper functions to get specific media items
  const getHeroImage = () => {
    const activeHero = mediaData.hero.find(item => item.isActive);
    return activeHero?.url || '';
  };

  const getMemorialImages = () => {
    return mediaData.memorial.filter(item => item.isActive);
  };

  const getGalleryImages = () => {
    const activeImages = mediaData.gallery.filter(item => item.isActive);
    return activeImages.map(item => item.url);
  };

  const getNavbarLogo = () => {
    const activeLogo = mediaData.navbar.find(item => item.isActive);
    return activeLogo?.url || '';
  };

  const getDefaultEventImage = () => {
    const activeDefault = mediaData.events.find(item => item.isActive);
    return activeDefault?.url || '';
  };

  const getVideoUrls = () => {
    return mediaData.videos.filter(item => item.isActive);
  };

  return {
    mediaData,
    loading,
    getHeroImage,
    getMemorialImages,
    getGalleryImages,
    getNavbarLogo,
    getDefaultEventImage,
    getVideoUrls
  };
};