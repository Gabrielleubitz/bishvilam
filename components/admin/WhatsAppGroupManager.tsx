'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Plus, Edit, Trash2, MessageCircle, ExternalLink, Save, X } from 'lucide-react';
import { HEBREW_LETTERS, ALL_GROUPS } from '@/utils/groups';

interface WhatsAppGroupLink {
  id: string;
  group: string;
  groupName: string;
  whatsappUrl: string;
  isActive: boolean;
  createdAt: any;
  updatedAt: any;
}

export default function WhatsAppGroupManager() {
  const [groupLinks, setGroupLinks] = useState<WhatsAppGroupLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLink, setEditingLink] = useState<WhatsAppGroupLink | null>(null);

  useEffect(() => {
    loadGroupLinks();
  }, []);

  const loadGroupLinks = async () => {
    try {
      console.log('Loading WhatsApp group links...');
      const snapshot = await getDocs(collection(db, 'whatsappGroups'));
      const links = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WhatsAppGroupLink[];
      
      setGroupLinks(links.sort((a, b) => a.group.localeCompare(b.group)));
    } catch (error) {
      console.error('Error loading WhatsApp group links:', error);
      alert('שגיאה בטעינת קישורי הווטסאפ: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteGroupLink = async (linkId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את קישור הווטסאפ?')) return;
    
    try {
      console.log('Deleting WhatsApp group link:', linkId);
      await deleteDoc(doc(db, 'whatsappGroups', linkId));
      loadGroupLinks();
      alert('✅ קישור הווטסאפ נמחק בהצלחה!');
    } catch (error) {
      console.error('Error deleting WhatsApp group link:', error);
      alert('שגיאה במחיקת קישור הווטסאפ: ' + (error as any).message);
    }
  };

  const toggleActive = async (linkId: string, currentStatus: boolean) => {
    try {
      console.log('Toggling WhatsApp group link status:', linkId, 'from', currentStatus, 'to', !currentStatus);
      await updateDoc(doc(db, 'whatsappGroups', linkId), {
        isActive: !currentStatus,
        updatedAt: new Date()
      });
      
      loadGroupLinks();
      alert(!currentStatus ? '✅ קישור הווטסאפ הופעל!' : '❌ קישור הווטסאפ הושבת!');
    } catch (error) {
      console.error('Error updating WhatsApp group link:', error);
      alert('שגיאה בעדכון קישור הווטסאפ: ' + (error as any).message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div>טוען קישורי ווטסאפ...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך קישורים</p>
              <p className="text-2xl font-bold">{groupLinks.length}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">קישורים פעילים</p>
              <p className="text-2xl font-bold">{groupLinks.filter(link => link.isActive).length}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">קבוצות ללא קישור</p>
              <p className="text-2xl font-bold">{HEBREW_LETTERS.length - groupLinks.length}</p>
            </div>
            <MessageCircle className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול קישורי ווטסאפ</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn flex items-center gap-2"
        >
          <Plus size={20} />
          הוספת קישור חדש
        </button>
      </div>

      {showCreateForm && (
        <GroupLinkForm
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadGroupLinks();
          }}
          existingGroups={groupLinks.map(link => link.group)}
        />
      )}

      {editingLink && (
        <GroupLinkForm
          link={editingLink}
          onCancel={() => setEditingLink(null)}
          onSuccess={() => {
            setEditingLink(null);
            loadGroupLinks();
          }}
          existingGroups={groupLinks.map(link => link.group).filter(g => g !== editingLink.group)}
        />
      )}

      <div className="grid gap-4">
        {groupLinks.length === 0 ? (
          <div className="card text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין קישורי ווטסאפ</h3>
            <p className="text-gray-400 mb-4">הוסף את הקישור הראשון</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn"
            >
              הוספת קישור חדש
            </button>
          </div>
        ) : (
          groupLinks.map((link) => (
            <div key={link.id} className="card">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-brand-green text-black px-3 py-1 rounded font-bold text-lg">
                      {link.group}
                    </div>
                    <h3 className="text-xl font-semibold">{link.groupName}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      link.isActive 
                        ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {link.isActive ? '✅ פעיל' : '❌ לא פעיל'}
                    </span>
                  </div>
                  
                  <div className="text-gray-300 mb-2">
                    <span className="text-gray-400">קישור: </span>
                    <a 
                      href={link.whatsappUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-400 hover:text-blue-300 underline break-all"
                    >
                      {link.whatsappUrl}
                    </a>
                  </div>

                  <div className="text-sm text-gray-400">
                    נוצר: {new Date(link.createdAt?.toDate?.() || link.createdAt).toLocaleDateString('he-IL')}
                    {link.updatedAt && (
                      <span className="mr-4">
                        עודכן: {new Date(link.updatedAt?.toDate?.() || link.updatedAt).toLocaleDateString('he-IL')}
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <a
                    href={link.whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-700 rounded text-green-400"
                    title="פתח את הקישור"
                  >
                    <ExternalLink size={18} />
                  </a>

                  <button
                    onClick={() => toggleActive(link.id, link.isActive)}
                    className={`p-2 rounded transition-colors ${
                      link.isActive 
                        ? 'hover:bg-red-900/50 text-red-400' 
                        : 'hover:bg-green-900/50 text-green-400'
                    }`}
                    title={link.isActive ? 'השבת קישור' : 'הפעל קישור'}
                  >
                    {link.isActive ? <X size={18} /> : <MessageCircle size={18} />}
                  </button>
                  
                  <button
                    onClick={() => setEditingLink(link)}
                    className="p-2 hover:bg-gray-700 rounded text-blue-400"
                    title="עריכת קישור"
                  >
                    <Edit size={18} />
                  </button>
                  
                  <button
                    onClick={() => deleteGroupLink(link.id)}
                    className="p-2 hover:bg-gray-700 rounded text-red-400"
                    title="מחיקת קישור"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Show missing groups */}
      {groupLinks.length < HEBREW_LETTERS.length && (
        <div className="card bg-yellow-900/20 border border-yellow-500/30">
          <h3 className="text-lg font-semibold mb-3 text-yellow-300">קבוצות ללא קישור ווטסאפ:</h3>
          <div className="flex flex-wrap gap-2">
            {HEBREW_LETTERS.filter(letter => !groupLinks.some(link => link.group === letter)).map(letter => (
              <span key={letter} className="bg-gray-700 text-gray-300 px-2 py-1 rounded">
                {letter}
              </span>
            ))}
          </div>
          <p className="text-sm text-yellow-400 mt-3">
            💡 הוסף קישורי ווטסאפ עבור הקבוצות הללו כדי שסטודנטים יקבלו אותם בעת הרשמה
          </p>
        </div>
      )}
    </div>
  );
}

function GroupLinkForm({ link, onCancel, onSuccess, existingGroups = [] }: {
  link?: WhatsAppGroupLink;
  onCancel: () => void;
  onSuccess: () => void;
  existingGroups: string[];
}) {
  const [formData, setFormData] = useState({
    group: link?.group || '',
    groupName: link?.groupName || '',
    whatsappUrl: link?.whatsappUrl || '',
    isActive: link?.isActive ?? true
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    
    if (type === 'checkbox') {
      const checkboxTarget = e.target as HTMLInputElement;
      setFormData(prev => ({
        ...prev,
        [name]: checkboxTarget.checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: e.target.value
      }));
    }
  };

  const validateWhatsAppUrl = (url: string): boolean => {
    return url.includes('chat.whatsapp.com') || url.includes('wa.me') || url.includes('whatsapp.com');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.group.trim()) {
      alert('נא לבחור קבוצה');
      return;
    }
    
    if (!formData.groupName.trim()) {
      alert('נא להזין שם לקבוצה');
      return;
    }
    
    if (!formData.whatsappUrl.trim()) {
      alert('נא להזין קישור ווטסאפ');
      return;
    }

    if (!validateWhatsAppUrl(formData.whatsappUrl)) {
      alert('נא להזין קישור ווטסאפ תקין (צריך להכיל chat.whatsapp.com או wa.me)');
      return;
    }

    // Check if group already exists (only for new links)
    if (!link && existingGroups.includes(formData.group)) {
      alert('כבר קיים קישור עבור קבוצה זו');
      return;
    }

    setLoading(true);

    try {
      const linkData = {
        group: formData.group.trim(),
        groupName: formData.groupName.trim(),
        whatsappUrl: formData.whatsappUrl.trim(),
        isActive: Boolean(formData.isActive),
        updatedAt: new Date()
      };

      if (link) {
        console.log('🔄 Updating existing WhatsApp group link:', link.id);
        await updateDoc(doc(db, 'whatsappGroups', link.id), linkData);
      } else {
        console.log('✨ Creating new WhatsApp group link');
        await addDoc(collection(db, 'whatsappGroups'), {
          ...linkData,
          createdAt: new Date()
        });
      }

      const action = link ? 'עודכן' : 'נוצר';
      alert(`✅ קישור הווטסאפ ${action} בהצלחה!`);

      onSuccess();
    } catch (error) {
      console.error('❌ Error saving WhatsApp group link:', error);
      const errorMessage = (error as any).message || error;
      alert('שגיאה בשמירת קישור הווטסאפ: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const availableGroups = HEBREW_LETTERS.filter(letter => 
    !existingGroups.includes(letter) || letter === link?.group
  );

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">
        {link ? 'עריכת קישור ווטסאפ' : 'הוספת קישור ווטסאפ חדש'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">קבוצה *</label>
          <select
            name="group"
            value={formData.group}
            onChange={handleChange}
            className="input"
            required
            disabled={!!link} // Can't change group when editing
          >
            <option value="">בחר קבוצה</option>
            {availableGroups.map(letter => (
              <option key={letter} value={letter}>{letter}</option>
            ))}
          </select>
          {!!link && (
            <p className="text-xs text-gray-400 mt-1">לא ניתן לשנות את הקבוצה בעריכה</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">שם הקבוצה *</label>
          <input
            type="text"
            name="groupName"
            value={formData.groupName}
            onChange={handleChange}
            className="input"
            required
            placeholder="למשל: קבוצת אימונים א"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">קישור ווטסאפ *</label>
          <input
            type="url"
            name="whatsappUrl"
            value={formData.whatsappUrl}
            onChange={handleChange}
            className="input"
            required
            placeholder="https://chat.whatsapp.com/..."
          />
          <p className="text-xs text-gray-400 mt-1">
            הזן קישור ווטסאפ תקין (chat.whatsapp.com או wa.me)
          </p>
        </div>

        <div className="bg-gray-800/50 p-4 rounded border-2 border-dashed border-gray-600">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="isActive"
              id="isActive"
              checked={formData.isActive}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="isActive" className="text-base font-medium cursor-pointer">
                🟢 קישור פעיל
              </label>
              <p className="text-sm text-gray-400 mt-1">
                {formData.isActive 
                  ? '✅ הקישור יישלח לסטודנטים בעת הרשמה' 
                  : '❌ הקישור לא יישלח לסטודנטים'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn">
            <Save size={16} className="ml-2" />
            {loading ? 'שומר...' : link ? 'עדכון' : 'יצירה'}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}