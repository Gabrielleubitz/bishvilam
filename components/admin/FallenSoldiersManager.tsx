'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, doc, setDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import ImageWithCacheBuster from '@/components/ImageWithCacheBuster';
import { useMedia } from '@/hooks/useMedia';
import { Plus, Edit, Trash2, Save, X, User, Heart } from 'lucide-react';

interface FallenSoldier {
  id: string;
  name: string;
  hebrewName: string;
  age?: number;
  unit?: string;
  rank?: string;
  dateOfFalling: string;
  imageUrl?: string;
  parentText: string;
  shortDescription: string;
  slug: string;
  order: number;
}

export default function FallenSoldiersManager() {
  const { getMemorialImages } = useMedia();
  const memorialImages = getMemorialImages();
  const [soldiers, setSoldiers] = useState<FallenSoldier[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSoldier, setEditingSoldier] = useState<FallenSoldier | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);

  const defaultSoldier: Omit<FallenSoldier, 'id'> = {
    name: '',
    hebrewName: '',
    age: undefined,
    unit: '',
    rank: '',
    dateOfFalling: '',
    imageUrl: '',
    parentText: '',
    shortDescription: '',
    slug: '',
    order: 0
  };

  useEffect(() => {
    loadSoldiers();
  }, []);

  // Helper function to get memorial image for a soldier
  const getMemorialImageForSoldier = (soldier: FallenSoldier): string => {
    // If soldier has a database imageUrl, use it
    if (soldier.imageUrl) {
      return soldier.imageUrl;
    }
    
    // Otherwise, try to find matching memorial image
    const memorialImageMap = {
      'dotan-shimon': 'memorial-dotan',
      'neta-kahana': 'memorial-neta', 
      'nave-leshem': 'memorial-nave'
    };
    
    const memorialId = memorialImageMap[soldier.id as keyof typeof memorialImageMap];
    if (memorialId) {
      const memorialImage = memorialImages.find(img => img.id === memorialId);
      if (memorialImage) {
        return memorialImage.url;
      }
    }
    
    return '';
  };


  const loadSoldiers = async () => {
    try {
      setLoading(true);
      const soldiersQuery = query(
        collection(db, 'fallenSoldiers'),
        orderBy('order', 'asc')
      );
      const snapshot = await getDocs(soldiersQuery);
      const soldiersData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          hebrewName: data.hebrewName || '',
          age: data.age,
          unit: data.unit || '',
          rank: data.rank || '',
          dateOfFalling: data.dateOfFalling || '',
          imageUrl: data.imageUrl || '',
          parentText: data.parentText || '',
          shortDescription: data.shortDescription || '',
          slug: data.slug || '',
          order: data.order || 0
        } as FallenSoldier;
      });

      // If no soldiers exist, create default ones
      if (soldiersData.length === 0) {
        const defaultSoldiers = [
          {
            id: 'dotan-shimon',
            name: 'Dotan Shimon',
            hebrewName: 'דותן שמעון ז״ל',
            age: 19,
            unit: 'גולני',
            rank: 'רב״ט',
            dateOfFalling: '7.10.2023',
            imageUrl: '',
            parentText: 'כאן יוכלו ההורים לכתוב על בנם הגיבור...\n\nזה הטקסט שהם יכתבו ואנחנו נעזור להם להעלות אותו למערכת.',
            shortDescription: 'לוחם אמיץ שנפל על הגנת המולדת',
            slug: 'dotan-shimon',
            order: 1
          },
          {
            id: 'neta-kahana',
            name: 'Neta Kahana',
            hebrewName: 'נטע כהנא ז״ל',
            age: 20,
            unit: 'צנחנים',
            rank: 'רב״ט',
            dateOfFalling: '7.10.2023',
            imageUrl: '',
            parentText: 'כאן יוכלו ההורים לכתוב על בנם הגיבור...\n\nזה הטקסט שהם יכתבו ואנחנו נעזור להם להעלות אותו למערכת.',
            shortDescription: 'לוחם אמיץ שנפל על הגנת המולדת',
            slug: 'neta-kahana',
            order: 2
          },
          {
            id: 'nave-leshem',
            name: 'Nave Leshem',
            hebrewName: 'נווה לשם ז״ל',
            age: 18,
            unit: 'נחל',
            rank: 'חובש',
            dateOfFalling: '7.10.2023',
            imageUrl: '',
            parentText: 'כאן יוכלו ההורים לכתוב על בנם הגיבור...\n\nזה הטקסט שהם יכתבו ואנחנו נעזור להם להעלות אותו למערכת.',
            shortDescription: 'לוחם אמיץ שנפל על הגנת המולדת',
            slug: 'nave-leshem',
            order: 3
          }
        ];

        // Create default soldiers
        for (const soldier of defaultSoldiers) {
          await setDoc(doc(db, 'fallenSoldiers', soldier.id), soldier);
        }
        setSoldiers(defaultSoldiers);
      } else {
        setSoldiers(soldiersData);
      }
    } catch (error) {
      console.error('Error loading soldiers:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (hebrewName: string) => {
    // Simple transliteration mapping for common Hebrew characters
    const hebrewToEnglish: { [key: string]: string } = {
      'א': 'a', 'ב': 'b', 'ג': 'g', 'ד': 'd', 'ה': 'h', 'ו': 'v', 'ז': 'z',
      'ח': 'ch', 'ט': 't', 'י': 'y', 'כ': 'k', 'ך': 'k', 'ל': 'l', 'מ': 'm',
      'ם': 'm', 'ן': 'n', 'נ': 'n', 'ס': 's', 'ע': 'a', 'פ': 'p', 'ף': 'f',
      'צ': 'tz', 'ץ': 'tz', 'ק': 'k', 'ר': 'r', 'ש': 'sh', 'ת': 't'
    };
    
    return hebrewName
      .replace(/ז״ל/g, '') // Remove z"l
      .trim()
      .split('')
      .map(char => hebrewToEnglish[char] || char)
      .join('')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
  };

  const handleSave = async (soldier: FallenSoldier) => {
    try {
      // Auto-generate slug if not provided
      if (!soldier.slug && soldier.hebrewName) {
        soldier.slug = generateSlug(soldier.hebrewName);
      }
      
      await setDoc(doc(db, 'fallenSoldiers', soldier.id), soldier);
      await loadSoldiers();
      setEditingSoldier(null);
      setIsAddingNew(false);
    } catch (error) {
      console.error('Error saving soldier:', error);
      alert('שגיאה בשמירה');
    }
  };

  const handleDelete = async (soldier: FallenSoldier) => {
    if (!confirm(`האם אתה בטוח שברצונך למחוק את ${soldier.hebrewName}?`)) return;

    try {
      await deleteDoc(doc(db, 'fallenSoldiers', soldier.id));
      await loadSoldiers();
    } catch (error) {
      console.error('Error deleting soldier:', error);
      alert('שגיאה במחיקה');
    }
  };


  const startAddNew = () => {
    const newSoldier: FallenSoldier = {
      ...defaultSoldier,
      id: `soldier-${Date.now()}`,
      order: soldiers.length + 1
    };
    setEditingSoldier(newSoldier);
    setIsAddingNew(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        <span className="ml-3">טוען חללים...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Heart className="text-red-500" size={24} fill="currentColor" />
          ניהול חללים
        </h2>
        <button onClick={startAddNew} className="btn-primary flex items-center gap-2">
          <Plus size={20} />
          הוסף חלל
        </button>
      </div>

      <div className="grid gap-6">
        {soldiers.map((soldier) => (
          <div key={soldier.id} className="card">
            {editingSoldier?.id === soldier.id ? (
              <EditSoldierForm
                soldier={editingSoldier}
                onChange={setEditingSoldier}
                onSave={() => handleSave(editingSoldier)}
                onCancel={() => {
                  setEditingSoldier(null);
                  setIsAddingNew(false);
                }}
                getMemorialImageForSoldier={getMemorialImageForSoldier}
              />
            ) : (
              <div className="flex items-start gap-4">
                {/* Soldier Image */}
                <div className="flex-shrink-0">
                  {getMemorialImageForSoldier(soldier) ? (
                    <ImageWithCacheBuster
                      key={getMemorialImageForSoldier(soldier)} // Force remount when URL changes
                      src={getMemorialImageForSoldier(soldier)}
                      alt={soldier.hebrewName}
                      className="w-20 h-20 object-cover rounded-lg"
                      cacheBustOnMount={true}
                    />
                  ) : (
                    <div className="w-20 h-20 bg-gray-700 rounded-lg flex items-center justify-center">
                      <User className="text-gray-400" size={24} />
                    </div>
                  )}
                </div>

                {/* Soldier Info */}
                <div className="flex-grow">
                  <h3 className="text-xl font-semibold text-white mb-1">{soldier.hebrewName}</h3>
                  <p className="text-brand-green text-sm mb-2">{soldier.shortDescription}</p>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-400">
                    <p><span className="text-gray-300">דרגה:</span> {soldier.rank || 'לא צוין'}</p>
                    <p><span className="text-gray-300">יחידה:</span> {soldier.unit || 'לא צוין'}</p>
                    <p><span className="text-gray-300">גיל:</span> {soldier.age || 'לא צוין'}</p>
                    <p><span className="text-gray-300">נפילה:</span> {soldier.dateOfFalling}</p>
                  </div>
                  <div className="mt-2 text-sm text-gray-400">
                    <p><span className="text-gray-300">Slug:</span> {soldier.slug}</p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingSoldier(soldier)}
                    className="text-blue-400 hover:text-blue-300 p-2"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(soldier)}
                    className="text-red-400 hover:text-red-300 p-2"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}

        {soldiers.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <Heart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p>לא נמצאו חללים</p>
            <button onClick={startAddNew} className="btn-primary mt-4">
              הוסף חלל ראשון
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface EditSoldierFormProps {
  soldier: FallenSoldier;
  onChange: (soldier: FallenSoldier) => void;
  onSave: () => void;
  onCancel: () => void;
  getMemorialImageForSoldier: (soldier: FallenSoldier) => string;
}

function EditSoldierForm({ 
  soldier, 
  onChange, 
  onSave, 
  onCancel,
  getMemorialImageForSoldier
}: EditSoldierFormProps) {
  const { getMemorialImages } = useMedia();
  const handleChange = (field: keyof FallenSoldier, value: string | number | undefined) => {
    onChange({ ...soldier, [field]: value });
  };


  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">שם בעברית</label>
          <input
            type="text"
            value={soldier.hebrewName}
            onChange={(e) => handleChange('hebrewName', e.target.value)}
            className="input w-full"
            placeholder="דותן שמעון ז״ל"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">שם באנגלית</label>
          <input
            type="text"
            value={soldier.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className="input w-full"
            placeholder="Dotan Shimon"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">דרגה</label>
          <input
            type="text"
            value={soldier.rank}
            onChange={(e) => handleChange('rank', e.target.value)}
            className="input w-full"
            placeholder="רב״ט"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">יחידה</label>
          <input
            type="text"
            value={soldier.unit}
            onChange={(e) => handleChange('unit', e.target.value)}
            className="input w-full"
            placeholder="גולני"
            dir="rtl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">גיל</label>
          <input
            type="number"
            value={soldier.age || ''}
            onChange={(e) => handleChange('age', e.target.value ? parseInt(e.target.value) : undefined)}
            className="input w-full"
            placeholder="19"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">תאריך נפילה</label>
          <input
            type="text"
            value={soldier.dateOfFalling}
            onChange={(e) => handleChange('dateOfFalling', e.target.value)}
            className="input w-full"
            placeholder="7.10.2023"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Slug (כתובת URL)</label>
          <input
            type="text"
            value={soldier.slug}
            onChange={(e) => handleChange('slug', e.target.value)}
            className="input w-full"
            placeholder="dotan-shimon"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">סדר הצגה</label>
          <input
            type="number"
            value={soldier.order}
            onChange={(e) => handleChange('order', parseInt(e.target.value) || 0)}
            className="input w-full"
            placeholder="1"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">תיאור קצר</label>
        <input
          type="text"
          value={soldier.shortDescription}
          onChange={(e) => handleChange('shortDescription', e.target.value)}
          className="input w-full"
          placeholder="לוחם אמיץ שנפל על הגנת המולדת"
          dir="rtl"
        />
      </div>

      {/* Image Selection from Media Gallery */}
      <div>
        <label className="block text-sm font-medium mb-1">תמונה</label>
        <div className="space-y-3">
          {soldier.imageUrl && (
            <div className="flex items-center gap-4">
              <ImageWithCacheBuster
                key={soldier.imageUrl} 
                src={soldier.imageUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-lg"
                cacheBustOnMount={true}
              />
              <div className="text-sm text-gray-400">תמונה נבחרת</div>
            </div>
          )}
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">בחר מגלריית הזיכרון</label>
            <select
              value={soldier.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              className="input text-sm"
            >
              <option value="">בחר תמונה מהגלריה</option>
              {getMemorialImages().map((image) => (
                <option key={image.id} value={image.url}>
                  {image.name} ({image.id})
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">או הזן URL ישירות</label>
            <input
              type="url"
              value={soldier.imageUrl || ''}
              onChange={(e) => handleChange('imageUrl', e.target.value)}
              className="input text-sm"
              placeholder="https://example.com/image.jpg"
            />
          </div>
        </div>
      </div>

      {/* Parent Text */}
      <div>
        <label className="block text-sm font-medium mb-1">מכתב מההורים</label>
        <textarea
          value={soldier.parentText}
          onChange={(e) => handleChange('parentText', e.target.value)}
          className="input w-full h-48 resize-none"
          placeholder="כאן יוכלו ההורים לכתוב על בנם הגיבור..."
          dir="rtl"
        />
        <p className="text-xs text-gray-400 mt-1">
          השתמש ב-Enter כדי לעבור לשורה חדשה. הטקסט יוצג בדיוק כפי שנכתב.
        </p>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button onClick={onSave} className="btn-primary flex items-center gap-2">
          <Save size={16} />
          שמור
        </button>
        <button onClick={onCancel} className="btn-secondary flex items-center gap-2">
          <X size={16} />
          ביטול
        </button>
      </div>
    </div>
  );
}