'use client';

import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Image, Save, Eye, RefreshCw, Upload, AlertCircle } from 'lucide-react';

interface MediaUrls {
  // Hero section images
  heroBackground: string;
  heroLogo: string;
  
  // About section images
  aboutMainImage: string;
  aboutGallery: string[];
  
  // Events section
  defaultEventImage: string;
  eventsBackground: string;
  
  // Footer and branding
  footerLogo: string;
  favicon: string;
  
  // Social media and marketing
  ogImage: string; // Open Graph image for social sharing
  
  // Profile and user related
  defaultProfileImage: string;
  
  // Misc/Additional
  notFoundImage: string;
  loadingPlaceholder: string;
}

const defaultMediaUrls: MediaUrls = {
  heroBackground: '',
  heroLogo: '',
  aboutMainImage: '',
  aboutGallery: [],
  defaultEventImage: '',
  eventsBackground: '',
  footerLogo: '',
  favicon: '',
  ogImage: '',
  defaultProfileImage: '',
  notFoundImage: '',
  loadingPlaceholder: ''
};

export default function MediaManager() {
  const [mediaUrls, setMediaUrls] = useState<MediaUrls>(defaultMediaUrls);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    fetchMediaUrls();
  }, []);

  const fetchMediaUrls = async () => {
    try {
      setLoading(true);
      const docRef = doc(db, 'settings', 'media');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as Partial<MediaUrls>;
        setMediaUrls({ ...defaultMediaUrls, ...data });
      }
    } catch (error) {
      console.error('Error fetching media URLs:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateImageUrl = (url: string): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!url.trim()) {
        resolve(true); // Empty URL is valid (will use default)
        return;
      }
      
      const img = new Image();
      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  const handleUrlChange = (field: keyof MediaUrls, value: string | string[]) => {
    setMediaUrls(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleGalleryChange = (index: number, value: string) => {
    const newGallery = [...mediaUrls.aboutGallery];
    newGallery[index] = value;
    handleUrlChange('aboutGallery', newGallery);
  };

  const addGalleryImage = () => {
    handleUrlChange('aboutGallery', [...mediaUrls.aboutGallery, '']);
  };

  const removeGalleryImage = (index: number) => {
    const newGallery = mediaUrls.aboutGallery.filter((_, i) => i !== index);
    handleUrlChange('aboutGallery', newGallery);
  };

  const previewImageHandler = (url: string) => {
    if (url.trim()) {
      setPreviewImage(url);
    }
  };

  const saveMediaUrls = async () => {
    try {
      setSaving(true);
      setErrors({});
      setSuccessMessage('');
      
      // Validate all URLs
      const validationErrors: {[key: string]: string} = {};
      
      for (const [key, value] of Object.entries(mediaUrls)) {
        if (key === 'aboutGallery' && Array.isArray(value)) {
          // Validate gallery images
          for (let i = 0; i < value.length; i++) {
            const url = value[i];
            if (url.trim() && !(await validateImageUrl(url))) {
              validationErrors[`aboutGallery_${i}`] = 'כתובת תמונה לא תקינה';
            }
          }
        } else if (typeof value === 'string' && value.trim()) {
          const isValid = await validateImageUrl(value);
          if (!isValid) {
            validationErrors[key] = 'כתובת תמונה לא תקינה';
          }
        }
      }
      
      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        return;
      }

      // Save to Firestore
      const docRef = doc(db, 'settings', 'media');
      await setDoc(docRef, mediaUrls, { merge: true });
      
      setSuccessMessage('כתובות התמונות נשמרו בהצלחה!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error saving media URLs:', error);
      setErrors({ general: 'שגיאה בשמירת הנתונים. נסה שוב.' });
    } finally {
      setSaving(false);
    }
  };

  const mediaCategories = [
    {
      title: 'עמוד הבית',
      fields: [
        { key: 'heroBackground', label: 'תמונת רקע ראשית', placeholder: 'הכנס כתובת URL לתמונת הרקע' },
        { key: 'heroLogo', label: 'לוגו ראשי', placeholder: 'הכנס כתובת URL ללוגו' }
      ]
    },
    {
      title: 'אודות',
      fields: [
        { key: 'aboutMainImage', label: 'תמונה ראשית', placeholder: 'הכנס כתובת URL לתמונת האודות' }
      ]
    },
    {
      title: 'אירועים',
      fields: [
        { key: 'defaultEventImage', label: 'תמונת ברירת מחדל לאירועים', placeholder: 'הכנס כתובת URL לתמונת ברירת מחדל' },
        { key: 'eventsBackground', label: 'תמונת רקע לעמוד אירועים', placeholder: 'הכנס כתובת URL לתמונת רקע' }
      ]
    },
    {
      title: 'מיתוג ועיצוב',
      fields: [
        { key: 'footerLogo', label: 'לוגו בכותרת התחתונה', placeholder: 'הכנס כתובת URL ללוגו' },
        { key: 'favicon', label: 'Favicon', placeholder: 'הכנס כתובת URL ל-favicon' },
        { key: 'ogImage', label: 'תמונה לשיתוף ברשתות חברתיות', placeholder: 'הכנס כתובת URL לתמונת Open Graph' }
      ]
    },
    {
      title: 'משתמשים',
      fields: [
        { key: 'defaultProfileImage', label: 'תמונת פרופיל ברירת מחדל', placeholder: 'הכנס כתובת URL לתמונת פרופיל' }
      ]
    },
    {
      title: 'כלליות',
      fields: [
        { key: 'notFoundImage', label: 'תמונה לעמוד 404', placeholder: 'הכנס כתובת URL לתמונת שגיאה' },
        { key: 'loadingPlaceholder', label: 'תמונת טעינה', placeholder: 'הכנס כתובת URL לתמונת טעינה' }
      ]
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">ניהול מדיה</h2>
          <p className="text-gray-400">נהל את כל התמונות באתר דרך כתובות URL</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={fetchMediaUrls}
            disabled={loading}
            className="btn-outline flex items-center gap-2"
          >
            <RefreshCw size={16} />
            רענון
          </button>
          
          <button
            onClick={saveMediaUrls}
            disabled={saving}
            className="btn flex items-center gap-2"
          >
            {saving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
            ) : (
              <Save size={16} />
            )}
            {saving ? 'שומר...' : 'שמור שינויים'}
          </button>
        </div>
      </div>

      {/* Success/Error Messages */}
      {successMessage && (
        <div className="bg-green-900/20 border border-green-500/30 text-green-400 px-4 py-3 rounded-lg">
          {successMessage}
        </div>
      )}

      {errors.general && (
        <div className="bg-red-900/20 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg flex items-center gap-2">
          <AlertCircle size={16} />
          {errors.general}
        </div>
      )}

      {/* Media Categories */}
      <div className="space-y-6">
        {mediaCategories.map((category, categoryIndex) => (
          <div key={categoryIndex} className="card">
            <h3 className="text-lg font-semibold mb-4 text-brand-green">
              {category.title}
            </h3>
            
            <div className="grid md:grid-cols-1 gap-4">
              {category.fields.map((field) => (
                <div key={field.key} className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    {field.label}
                  </label>
                  
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <input
                        type="url"
                        value={mediaUrls[field.key as keyof MediaUrls] as string}
                        onChange={(e) => handleUrlChange(field.key as keyof MediaUrls, e.target.value)}
                        placeholder={field.placeholder}
                        className={`input w-full ${errors[field.key] ? 'border-red-500' : ''}`}
                        dir="ltr"
                      />
                      {errors[field.key] && (
                        <p className="text-red-400 text-xs mt-1">{errors[field.key]}</p>
                      )}
                    </div>
                    
                    {(mediaUrls[field.key as keyof MediaUrls] as string)?.trim() && (
                      <button
                        onClick={() => previewImageHandler(mediaUrls[field.key as keyof MediaUrls] as string)}
                        className="btn-outline px-3"
                        title="תצוגה מקדימה"
                      >
                        <Eye size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Gallery Section */}
        <div className="card">
          <h3 className="text-lg font-semibold mb-4 text-brand-green">
            גלריית תמונות - אודות
          </h3>
          
          <div className="space-y-4">
            {mediaUrls.aboutGallery.map((url, index) => (
              <div key={index} className="flex gap-2 items-start">
                <div className="flex-1">
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => handleGalleryChange(index, e.target.value)}
                    placeholder={`תמונה ${index + 1} בגלריה`}
                    className={`input w-full ${errors[`aboutGallery_${index}`] ? 'border-red-500' : ''}`}
                    dir="ltr"
                  />
                  {errors[`aboutGallery_${index}`] && (
                    <p className="text-red-400 text-xs mt-1">{errors[`aboutGallery_${index}`]}</p>
                  )}
                </div>
                
                {url.trim() && (
                  <button
                    onClick={() => previewImageHandler(url)}
                    className="btn-outline px-3"
                    title="תצוגה מקדימה"
                  >
                    <Eye size={16} />
                  </button>
                )}
                
                <button
                  onClick={() => removeGalleryImage(index)}
                  className="btn-outline px-3 text-red-400 hover:bg-red-900/20"
                  title="הסר תמונה"
                >
                  ×
                </button>
              </div>
            ))}
            
            <button
              onClick={addGalleryImage}
              className="btn-outline flex items-center gap-2"
            >
              <Upload size={16} />
              הוסף תמונה לגלריה
            </button>
          </div>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-4xl max-h-full overflow-hidden rounded-lg bg-gray-900 p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">תצוגה מקדימה</h3>
              <button
                onClick={() => setPreviewImage(null)}
                className="text-gray-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            <img
              src={previewImage}
              alt="תצוגה מקדימה"
              className="max-w-full max-h-[70vh] object-contain mx-auto"
              onError={() => {
                setPreviewImage(null);
                setErrors(prev => ({ ...prev, preview: 'שגיאה בטעינת התמונה' }));
              }}
            />
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-900/10 border-blue-500/20">
        <h4 className="font-medium text-blue-400 mb-2">הוראות שימוש:</h4>
        <ul className="text-sm text-gray-300 space-y-1">
          <li>• הכנס כתובות URL תקינות של תמונות (jpg, png, gif, webp)</li>
          <li>• השתמש בשרתי תמונות אמינים כמו Cloudinary, Firebase Storage, או S3</li>
          <li>• לחץ על כפתור העין לתצוגה מקדימה של התמונה</li>
          <li>• שדות ריקים ישתמשו בתמונות ברירת המחדל של המערכת</li>
          <li>• שמור את השינויים כדי שייכנסו לתוקף באתר</li>
        </ul>
      </div>
    </div>
  );
}