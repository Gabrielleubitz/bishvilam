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
}

const getDefaultMediaData = (): MediaCategories => ({
  hero: [
    {
      id: 'hero-bg',
      name: 'רקע עמוד הבית',
      url: 'https://ik.imagekit.io/cjenfmnqf/Screenshot%202025-08-24%20at%2013.27.41.png',
      category: 'hero',
      description: 'תמונת הרקע הראשית של עמוד הבית',
      isActive: true,
      lastUpdated: new Date()
    }
  ],
  memorial: [
    {
      id: 'memorial-dotan',
      name: 'דותן שמעון ז"ל',
      url: 'https://ik.imagekit.io/cjenfmnqf/Screenshot%202025-08-24%20at%2014.18.44.png',
      category: 'memorial',
      description: 'תמונה של דותן שמעון ז"ל',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'memorial-neta',
      name: 'נטע כהנא ז"ל',
      url: 'https://ik.imagekit.io/cjenfmnqf/Screenshot%202025-08-24%20at%2014.25.04.png',
      category: 'memorial',
      description: 'תמונה של נטע כהנא ז"ל',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'memorial-nave',
      name: 'נווה לשם ז"ל',
      url: 'https://ik.imagekit.io/cjenfmnqf/Screenshot%202025-08-24%20at%2014.30.18.png',
      category: 'memorial',
      description: 'תמונה של נווה לשם ז"ל',
      isActive: true,
      lastUpdated: new Date()
    }
  ],
  gallery: [
    {
      id: 'gallery-1',
      name: 'אימון 1',
      url: 'https://ik.imagekit.io/cjenfmnqf/Screenshot%202025-08-24%20at%2013.27.41.png',
      category: 'gallery',
      description: 'תמונה מהאימונים',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'gallery-2',
      name: 'אימון 2',
      url: 'https://ik.imagekit.io/cjenfmnqf/WhatsApp%20Image%202025-08-24%20at%2013.26.14.jpeg',
      category: 'gallery',
      description: 'תמונה מהאימונים',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'gallery-3',
      name: 'אימון 3',
      url: 'https://ik.imagekit.io/cjenfmnqf/WhatsApp%20Image%202025-08-24%20at%2013.26.18.jpeg',
      category: 'gallery',
      description: 'תמונה מהאימונים',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'gallery-4',
      name: 'אימון 4',
      url: 'https://ik.imagekit.io/cjenfmnqf/WhatsApp%20Image%202025-08-24%20at%2013.26.27.jpeg',
      category: 'gallery',
      description: 'תמונה מהאימונים',
      isActive: true,
      lastUpdated: new Date()
    },
    {
      id: 'gallery-5',
      name: 'אימון 5',
      url: 'https://ik.imagekit.io/cjenfmnqf/WhatsApp%20Image%202025-08-24%20at%2013.26.01.jpeg',
      category: 'gallery',
      description: 'תמונה מהאימונים',
      isActive: true,
      lastUpdated: new Date()
    }
  ],
  navbar: [
    {
      id: 'navbar-logo',
      name: 'לוגו בשבילם',
      url: 'https://ik.imagekit.io/cjenfmnqf/Screenshot%202025-08-24%20at%201.14.27.png',
      category: 'navbar',
      description: 'הלוגו הראשי של האתר',
      isActive: true,
      lastUpdated: new Date()
    }
  ],
  events: [
    {
      id: 'event-default',
      name: 'תמונה ברירת מחדל לאירועים',
      url: 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
      category: 'events',
      description: 'תמונה ברירת מחדל עבור אירועים ללא תמונה',
      isActive: true,
      lastUpdated: new Date()
    }
  ]
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
            hero: data.hero || getDefaultMediaData().hero,
            memorial: data.memorial || getDefaultMediaData().memorial,
            gallery: data.gallery || getDefaultMediaData().gallery,
            navbar: data.navbar || getDefaultMediaData().navbar,
            events: data.events || getDefaultMediaData().events
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
    return activeHero?.url || getDefaultMediaData().hero[0].url;
  };

  const getMemorialImages = () => {
    const activeImages = mediaData.memorial.filter(item => item.isActive);
    const defaultImages = getDefaultMediaData().memorial;
    
    return activeImages.length > 0 ? activeImages : defaultImages;
  };

  const getGalleryImages = () => {
    const activeImages = mediaData.gallery.filter(item => item.isActive);
    return activeImages.map(item => item.url);
  };

  const getNavbarLogo = () => {
    const activeLogo = mediaData.navbar.find(item => item.isActive);
    return activeLogo?.url || getDefaultMediaData().navbar[0].url;
  };

  const getDefaultEventImage = () => {
    const activeDefault = mediaData.events.find(item => item.isActive);
    return activeDefault?.url || getDefaultMediaData().events[0].url;
  };

  return {
    mediaData,
    loading,
    getHeroImage,
    getMemorialImages,
    getGalleryImages,
    getNavbarLogo,
    getDefaultEventImage
  };
};