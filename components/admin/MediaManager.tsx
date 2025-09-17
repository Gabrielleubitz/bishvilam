'use client';

import { useState, useEffect } from 'react';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Image, Save, RefreshCw, Eye, EyeOff, Edit3, Trash2, Plus, Video } from 'lucide-react';

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

export default function MediaManager() {
  const [mediaData, setMediaData] = useState<MediaCategories>({
    hero: [],
    memorial: [],
    gallery: [],
    navbar: [],
    events: [],
    videos: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState<keyof MediaCategories>('hero');
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const categories = [
    { id: 'hero' as const, name: 'רקע עמוד הבית', icon: Image },
    { id: 'memorial' as const, name: 'לזכרם - תמונות החללים', icon: Image },
    { id: 'gallery' as const, name: 'גלריית תמונות', icon: Image },
    { id: 'navbar' as const, name: 'לוגו וניווט', icon: Image },
    { id: 'events' as const, name: 'תמונות אירועים', icon: Image },
    { id: 'videos' as const, name: 'סרטונים', icon: Video }
  ];

  useEffect(() => {
    loadMediaData();
  }, []);

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
    ],
    videos: [
      {
        id: 'about-intro',
        name: 'סרטון היכרות',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        category: 'videos',
        description: 'סרטון היכרות עם הפעילות',
        isActive: true,
        lastUpdated: new Date()
      },
      {
        id: 'training-highlights',
        name: 'תקציר אימונים',
        url: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
        category: 'videos',
        description: 'תקציר מהאימונים שלנו',
        isActive: true,
        lastUpdated: new Date()
      }
    ]
  });

  const loadMediaData = async () => {
    try {
      setLoading(true);
      const mediaDoc = await getDoc(doc(db, 'settings', 'media'));
      
      if (mediaDoc.exists()) {
        const data = mediaDoc.data();
        setMediaData({
          hero: data.hero || getDefaultMediaData().hero,
          memorial: data.memorial || getDefaultMediaData().memorial,
          gallery: data.gallery || getDefaultMediaData().gallery,
          navbar: data.navbar || getDefaultMediaData().navbar,
          events: data.events || getDefaultMediaData().events,
          videos: data.videos || getDefaultMediaData().videos
        });
      } else {
        // Initialize with default data
        const defaultData = getDefaultMediaData();
        setMediaData(defaultData);
        await saveMediaData(defaultData);
      }
    } catch (error) {
      console.error('Error loading media data:', error);
      setMediaData(getDefaultMediaData());
    } finally {
      setLoading(false);
    }
  };

  const saveMediaData = async (data: MediaCategories = mediaData) => {
    try {
      setSaving(true);
      await setDoc(doc(db, 'settings', 'media'), {
        ...data,
        lastUpdated: new Date()
      });
    } catch (error) {
      console.error('Error saving media data:', error);
      alert('שגיאה בשמירת הנתונים');
    } finally {
      setSaving(false);
    }
  };

  const updateMediaItem = (categoryId: keyof MediaCategories, itemId: string, updates: Partial<MediaItem>) => {
    setMediaData(prev => ({
      ...prev,
      [categoryId]: prev[categoryId].map(item =>
        item.id === itemId
          ? { ...item, ...updates, lastUpdated: new Date() }
          : item
      )
    }));
  };

  const addMediaItem = (categoryId: keyof MediaCategories) => {
    const newItem: MediaItem = {
      id: `${categoryId}-${Date.now()}`,
      name: categoryId === 'videos' ? 'סרטון חדש' : 'תמונה חדשה',
      url: '',
      category: categoryId,
      description: '',
      isActive: true,
      lastUpdated: new Date()
    };

    setMediaData(prev => ({
      ...prev,
      [categoryId]: [...prev[categoryId], newItem]
    }));
    setEditingItem(newItem.id);
  };

  const deleteMediaItem = (categoryId: keyof MediaCategories, itemId: string) => {
    const itemType = categoryId === 'videos' ? 'סרטון זה' : 'תמונה זו';
    if (confirm(`האם אתה בטוח שברצונך למחוק ${itemType}?`)) {
      setMediaData(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].filter(item => item.id !== itemId)
      }));
    }
  };

  const toggleItemStatus = (categoryId: keyof MediaCategories, itemId: string) => {
    updateMediaItem(categoryId, itemId, {
      isActive: !mediaData[categoryId].find(item => item.id === itemId)?.isActive
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        <span className="ml-3">טוען נתוני מדיה...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">ניהול מדיה</h2>
          <p className="text-gray-400">נהל את כל התמונות והמדיה באתר</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => loadMediaData()}
            disabled={loading}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            רענון
          </button>
          <button
            onClick={() => saveMediaData()}
            disabled={saving}
            className="btn flex items-center gap-2"
          >
            <Save size={16} />
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-700">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setActiveCategory(category.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-colors ${
              activeCategory === category.id
                ? 'bg-brand-green text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-800'
            }`}
          >
            <category.icon size={16} />
            {category.name}
            <span className="bg-gray-600 text-xs px-2 py-1 rounded-full">
              {mediaData[category.id].length}
            </span>
          </button>
        ))}
      </div>

      {/* Media Items */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold">
            {categories.find(c => c.id === activeCategory)?.name}
          </h3>
          <button
            onClick={() => addMediaItem(activeCategory)}
            className="btn-outline flex items-center gap-2"
          >
            <Plus size={16} />
            {activeCategory === 'videos' ? 'הוסף סרטון' : 'הוסף תמונה'}
          </button>
        </div>

        <div className="grid gap-4">
          {mediaData[activeCategory].map((item) => (
            <div key={item.id} className="card border border-gray-700">
              <div className="flex gap-4">
                {/* Media Preview */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 bg-gray-800 rounded-lg overflow-hidden">
                    {item.url ? (
                      activeCategory === 'videos' ? (
                        <div className="w-full h-full flex items-center justify-center text-gray-500 relative">
                          <Video size={20} />
                          <div className="absolute inset-0 bg-black/20"></div>
                          {item.url.includes('youtube.com') || item.url.includes('youtu.be') ? (
                            <div className="absolute inset-0 text-red-500 flex items-center justify-center">
                              <Video size={16} />
                            </div>
                          ) : null}
                        </div>
                      ) : (
                        <img
                          key={item.url} // Force remount when URL changes
                          src={item.url}
                          alt={item.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjI0IiBoZWlnaHQ9IjI0IiBmaWxsPSIjMzc0MTUxIi8+CjxwYXRoIGQ9Ik0xMiAxNkM4IDEyIDggOCA4IDhIMTZDMTYgOCAxNiAxMiAxMiAxNloiIGZpbGw9IiM2QjcyODAiLz4KPC9zdmc+';
                          }}
                        />
                      )
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-500">
                        {activeCategory === 'videos' ? <Video size={20} /> : <Image size={20} />}
                      </div>
                    )}
                  </div>
                </div>

                {/* Item Details */}
                <div className="flex-1 min-w-0">
                  {editingItem === item.id ? (
                    <div className="space-y-3">
                      <input
                        type="text"
                        value={item.name}
                        onChange={(e) => updateMediaItem(activeCategory, item.id, { name: e.target.value })}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                        placeholder={activeCategory === 'videos' ? 'שם הסרטון' : 'שם התמונה'}
                      />
                      <input
                        type="url"
                        value={item.url}
                        onChange={(e) => updateMediaItem(activeCategory, item.id, { url: e.target.value })}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                        placeholder={
                          activeCategory === 'videos' 
                            ? 'https://www.youtube.com/embed/VIDEO_ID' 
                            : 'https://example.com/image.jpg'
                        }
                      />
                      <textarea
                        value={item.description}
                        onChange={(e) => updateMediaItem(activeCategory, item.id, { description: e.target.value })}
                        className="w-full p-2 bg-gray-800 border border-gray-600 rounded text-white"
                        placeholder={activeCategory === 'videos' ? 'תיאור הסרטון' : 'תיאור התמונה'}
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditingItem(null)}
                          className="btn"
                        >
                          סיום עריכה
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{item.name}</h4>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          item.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                        }`}>
                          {item.isActive ? 'פעיל' : 'לא פעיל'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-400 mb-2">{item.description}</p>
                      <p className="text-xs text-gray-500 truncate">{item.url}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        עודכן: {new Date(item.lastUpdated).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setEditingItem(editingItem === item.id ? null : item.id)}
                    className="p-2 text-blue-400 hover:bg-blue-400/10 rounded"
                    title="עריכה"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => toggleItemStatus(activeCategory, item.id)}
                    className={`p-2 rounded ${
                      item.isActive
                        ? 'text-yellow-400 hover:bg-yellow-400/10'
                        : 'text-gray-400 hover:bg-gray-400/10'
                    }`}
                    title={item.isActive ? 'השבת' : 'הפעל'}
                  >
                    {item.isActive ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button
                    onClick={() => deleteMediaItem(activeCategory, item.id)}
                    className="p-2 text-red-400 hover:bg-red-400/10 rounded"
                    title="מחק"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="card bg-blue-900/20 border-blue-500/30">
        <h4 className="font-semibold mb-2 text-blue-400">הוראות שימוש</h4>
        <div className="text-sm text-gray-300 space-y-1">
          <p>• <strong>רקע עמוד הבית:</strong> תמונת הרקע הראשית בעמוד הבית</p>
          <p>• <strong>לזכרם:</strong> תמונות של שלושת החללים בעמוד הזכרון</p>
          <p>• <strong>גלריית תמונות:</strong> תמונות המוצגות בגלריה בעמוד &quot;עלינו&quot;</p>
          <p>• <strong>לוגו וניווט:</strong> הלוגו הראשי של האתר</p>
          <p>• <strong>תמונות אירועים:</strong> תמונות ברירת מחדל עבור אירועים</p>
          <p>• <strong>סרטונים:</strong> סרטוני YouTube המוצגים בעמוד &quot;עלינו&quot; (השתמש בקישור embed)</p>
        </div>
      </div>
    </div>
  );
}