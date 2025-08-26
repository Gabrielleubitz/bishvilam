'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Edit, Trash2, Send, Calendar, Users, AlertCircle, CheckCircle, X, Mail } from 'lucide-react';
import { HEBREW_LETTERS, ALL_GROUPS, formatGroupsDisplay } from '@/utils/groups';

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetGroups: string[];
  type: 'info' | 'warning' | 'success' | 'urgent';
  active: boolean;
  emailSent: boolean;
  createdAt: any;
  createdBy: string;
  expiresAt?: any;
}

export default function AnnouncementManager() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Current user:', user);
      setCurrentUser(user);
    });

    loadAnnouncements();
    return () => unsubscribe();
  }, []);

  const loadAnnouncements = async () => {
    try {
      console.log('Loading announcements...');
      
      const announcementsQuery = query(
        collection(db, 'announcements'),
        orderBy('createdAt', 'desc')
      );
      
      const announcementsSnapshot = await getDocs(announcementsQuery);
      const announcementsData = announcementsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Announcement[];

      console.log('Loaded announcements:', announcementsData);
      setAnnouncements(announcementsData);
    } catch (error) {
      console.error('Error loading announcements:', error);
      alert('שגיאה בטעינת ההודעות: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את ההודעה?')) return;
    
    try {
      console.log('Deleting announcement:', announcementId);
      await deleteDoc(doc(db, 'announcements', announcementId));
      loadAnnouncements();
    } catch (error) {
      console.error('Error deleting announcement:', error);
      alert('שגיאה במחיקת ההודעה: ' + (error as any).message);
    }
  };

  const toggleActive = async (announcementId: string, currentActive: boolean) => {
    try {
      console.log('Toggling announcement active status:', announcementId, !currentActive);
      await updateDoc(doc(db, 'announcements', announcementId), {
        active: !currentActive,
        updatedAt: new Date()
      });
      
      alert(!currentActive ? 'ההודעה הופעלה!' : 'ההודעה הושבתה!');
      loadAnnouncements();
    } catch (error) {
      console.error('Error updating announcement:', error);
      alert('שגיאה בעדכון ההודעה: ' + (error as any).message);
    }
  };

  const sendAnnouncementEmail = async (announcement: Announcement) => {
    if (!confirm(`האם לשלוח את ההודעה "${announcement.title}" במייל לכל הקבוצות הרלוונטיות?`)) return;

    try {
      console.log('Sending announcement email:', announcement.id);
      
      const response = await fetch('/api/send-announcement-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          announcementId: announcement.id,
          title: announcement.title,
          content: announcement.content,
          targetGroups: announcement.targetGroups,
          type: announcement.type
        }),
      });

      if (response.ok) {
        // Mark as email sent
        await updateDoc(doc(db, 'announcements', announcement.id), {
          emailSent: true,
          emailSentAt: new Date()
        });
        
        alert('ההודעה נשלחה במייל בהצלחה!');
        loadAnnouncements();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send email');
      }
    } catch (error) {
      console.error('Error sending announcement email:', error);
      alert('שגיאה בשליחת המייל: ' + (error as any).message);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <AlertCircle className="text-blue-400" size={16} />;
      case 'warning': return <AlertCircle className="text-yellow-400" size={16} />;
      case 'success': return <CheckCircle className="text-green-400" size={16} />;
      case 'urgent': return <AlertCircle className="text-red-400" size={16} />;
      default: return <AlertCircle className="text-gray-400" size={16} />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'border-blue-500/30 bg-blue-900/30';
      case 'warning': return 'border-yellow-500/30 bg-yellow-900/30';
      case 'success': return 'border-green-500/30 bg-green-900/30';
      case 'urgent': return 'border-red-500/30 bg-red-900/30';
      default: return 'border-gray-500/30 bg-gray-900/30';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div>טוען הודעות...</div>
        {currentUser ? (
          <div className="text-sm text-green-400 mt-2">משתמש מחובר: {currentUser.email}</div>
        ) : (
          <div className="text-sm text-red-400 mt-2">משתמש לא מחובר!</div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך הודעות</p>
              <p className="text-2xl font-bold">{announcements.length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">הודעות פעילות</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.active).length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">נשלחו במייל</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.emailSent).length}</p>
            </div>
            <Mail className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">הודעות דחופות</p>
              <p className="text-2xl font-bold">{announcements.filter(a => a.type === 'urgent' && a.active).length}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול הודעות</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn flex items-center gap-2"
          disabled={!currentUser}
        >
          <Plus size={20} />
          יצירת הודעה חדשה
        </button>
      </div>

      {!currentUser && (
        <div className="bg-red-900/50 text-red-300 p-4 rounded">
          יש להתחבר כדי לנהל הודעות
        </div>
      )}

      {showCreateForm && (
        <AnnouncementForm
          currentUser={currentUser}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadAnnouncements();
          }}
        />
      )}

      {editingAnnouncement && (
        <AnnouncementForm
          announcement={editingAnnouncement}
          currentUser={currentUser}
          onCancel={() => setEditingAnnouncement(null)}
          onSuccess={() => {
            setEditingAnnouncement(null);
            loadAnnouncements();
          }}
        />
      )}

      <div className="grid gap-6">
        {announcements.length === 0 ? (
          <div className="card text-center py-12">
            <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין הודעות</h3>
            <p className="text-gray-400 mb-4">צור את ההודעה הראשונה שלך</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn"
              disabled={!currentUser}
            >
              יצירת הודעה חדשה
            </button>
          </div>
        ) : (
          announcements.map((announcement) => (
            <div key={announcement.id} className={`card border ${getTypeColor(announcement.type)}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getTypeIcon(announcement.type)}
                    <h3 className="text-xl font-semibold">{announcement.title}</h3>
                    
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      announcement.active 
                        ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {announcement.active ? '✅ פעיל' : '❌ כבוי'}
                    </span>

                    {announcement.emailSent && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-500/30">
                        📧 נשלח במייל
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-4 whitespace-pre-line">{announcement.content}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{new Date(announcement.createdAt?.toDate?.() || announcement.createdAt).toLocaleDateString('he-IL')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span className="text-purple-300">{formatGroupsDisplay(announcement.targetGroups)}</span>
                    </div>
                    {announcement.expiresAt && (
                      <div className="flex items-center gap-1">
                        <Calendar size={16} />
                        <span className="text-yellow-300">פוגה: {new Date(announcement.expiresAt.toDate()).toLocaleDateString('he-IL')}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {announcement.active && !announcement.emailSent && (
                    <button
                      onClick={() => sendAnnouncementEmail(announcement)}
                      className="p-2 hover:bg-gray-700 rounded text-purple-400"
                      title="שלח במייל"
                    >
                      <Send size={18} />
                    </button>
                  )}

                  <button
                    onClick={() => toggleActive(announcement.id, announcement.active)}
                    className={`p-2 rounded transition-colors ${
                      announcement.active 
                        ? 'hover:bg-red-900/50 text-red-400' 
                        : 'hover:bg-green-900/50 text-green-400'
                    }`}
                    title={announcement.active ? 'השבת הודעה' : 'הפעל הודעה'}
                    disabled={!currentUser}
                  >
                    {announcement.active ? <X size={18} /> : <CheckCircle size={18} />}
                  </button>
                  
                  <button
                    onClick={() => setEditingAnnouncement(announcement)}
                    className="p-2 hover:bg-gray-700 rounded text-blue-400"
                    title="עריכת הודעה"
                    disabled={!currentUser}
                  >
                    <Edit size={18} />
                  </button>
                  
                  <button
                    onClick={() => deleteAnnouncement(announcement.id)}
                    className="p-2 hover:bg-gray-700 rounded text-red-400"
                    title="מחיקת הודעה"
                    disabled={!currentUser}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AnnouncementForm({ announcement, currentUser, onCancel, onSuccess }: {
  announcement?: Announcement;
  currentUser: any;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: announcement?.title || '',
    content: announcement?.content || '',
    targetGroups: announcement?.targetGroups || ['ALL'],
    type: announcement?.type || 'info' as 'info' | 'warning' | 'success' | 'urgent',
    active: announcement?.active ?? true,
    expiresAt: announcement?.expiresAt ? new Date(announcement.expiresAt.toDate()).toISOString().split('T')[0] : ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('יש להתחבר כדי ליצור הודעה');
      return;
    }
    
    if (!formData.title.trim() || !formData.content.trim()) {
      alert('נא למלא כותרת ותוכן ההודעה');
      return;
    }

    setLoading(true);

    try {
      const announcementData = {
        title: formData.title.trim(),
        content: formData.content.trim(),
        targetGroups: formData.targetGroups,
        type: formData.type,
        active: formData.active,
        emailSent: false,
        expiresAt: formData.expiresAt ? new Date(formData.expiresAt) : null,
        updatedAt: new Date(),
        createdBy: currentUser.uid
      };

      if (announcement) {
        await updateDoc(doc(db, 'announcements', announcement.id), announcementData);
        alert('ההודעה עודכנה בהצלחה!');
      } else {
        await addDoc(collection(db, 'announcements'), {
          ...announcementData,
          createdAt: new Date()
        });
        alert('ההודעה נוצרה בהצלחה!');
      }

      onSuccess();
    } catch (error) {
      console.error('Error saving announcement:', error);
      alert('שגיאה בשמירת ההודעה: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">
        {announcement ? 'עריכת הודעה' : 'יצירת הודעה חדשה'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">כותרת ההודעה *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            required
            placeholder="למשל: עדכון חשוב לגבי האימונים"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">תוכן ההודעה *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            rows={6}
            className="input resize-none"
            required
            placeholder="תוכן ההודעה המפורט..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">סוג הודעה</label>
            <select
              name="type"
              value={formData.type}
              onChange={handleChange}
              className="input"
            >
              <option value="info">מידע (כחול)</option>
              <option value="success">הודעת הצלחה (ירוק)</option>
              <option value="warning">אזהרה (צהוב)</option>
              <option value="urgent">דחוף (אדום)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">תאריך תפוגה (אופציונלי)</label>
            <input
              type="date"
              name="expiresAt"
              value={formData.expiresAt}
              onChange={handleChange}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        {/* Groups Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">קבוצות היעד</label>
          <AnnouncementGroupSelector
            selectedGroups={formData.targetGroups}
            onChange={(groups) => setFormData(prev => ({ ...prev, targetGroups: groups }))}
          />
        </div>

        <div className="bg-gray-800/50 p-4 rounded border-2 border-dashed border-gray-600">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="active"
              id="active"
              checked={formData.active}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="active" className="text-base font-medium cursor-pointer">
                🟢 הודעה פעילה
              </label>
              <p className="text-sm text-gray-400 mt-1">
                {formData.active 
                  ? '✅ ההודעה תוצג למשתמשים' 
                  : '❌ ההודעה תישמר אך לא תוצג'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading || !currentUser} className="btn">
            {loading ? 'שומר...' : announcement ? 'עדכון' : 'יצירה'}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

// Announcement Group Selector Component
function AnnouncementGroupSelector({ selectedGroups = ['ALL'], onChange }: {
  selectedGroups: string[];
  onChange: (groups: string[]) => void;
}) {
  const [isAllGroups, setIsAllGroups] = useState(selectedGroups.includes('ALL'));

  const handleAllGroupsToggle = (checked: boolean) => {
    setIsAllGroups(checked);
    if (checked) {
      onChange(['ALL']);
    } else {
      onChange([]);
    }
  };

  const handleGroupToggle = (group: string) => {
    if (isAllGroups) {
      // Switch from "All" to specific groups
      setIsAllGroups(false);
      onChange([group]);
    } else {
      const newGroups = selectedGroups.includes(group)
        ? selectedGroups.filter(g => g !== group)
        : [...selectedGroups.filter(g => g !== 'ALL'), group];
      onChange(newGroups);
    }
  };

  return (
    <div className="space-y-4 bg-gray-800/50 p-4 rounded border border-gray-600">
      {/* All Groups Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="all-groups-announcement"
          checked={isAllGroups}
          onChange={(e) => handleAllGroupsToggle(e.target.checked)}
          className="w-4 h-4 text-brand-green bg-gray-700 border-gray-600 rounded focus:ring-brand-green focus:ring-2"
        />
        <label htmlFor="all-groups-announcement" className="text-sm font-medium cursor-pointer flex items-center gap-2">
          <Users size={16} />
          כל הקבוצות (שלח לכל המשתמשים)
        </label>
      </div>

      {!isAllGroups && (
        <div>
          <p className="text-sm text-gray-400 mb-3">בחר קבוצות ספציפיות שיקבלו את ההודעה:</p>
          <div className="grid grid-cols-6 sm:grid-cols-8 lg:grid-cols-12 gap-2">
            {HEBREW_LETTERS.map(letter => (
              <button
                key={letter}
                type="button"
                onClick={() => handleGroupToggle(letter)}
                className={`p-2 text-sm rounded border transition-colors ${
                  selectedGroups.includes(letter)
                    ? 'bg-brand-green text-black border-brand-green'
                    : 'bg-gray-700 text-white border-gray-600 hover:border-gray-500'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
          
          {selectedGroups.length === 0 && !isAllGroups && (
            <p className="text-sm text-red-400 mt-2">
              ⚠️ נא לבחור לפחות קבוצה אחת או לסמן &quot;כל הקבוצות&quot;
            </p>
          )}
        </div>
      )}

      {/* Current Selection Display */}
      <div className="text-sm text-gray-400">
        <span className="font-medium">יקבלו הודעה:</span> {formatGroupsDisplay(selectedGroups)}
      </div>
    </div>
  );
}