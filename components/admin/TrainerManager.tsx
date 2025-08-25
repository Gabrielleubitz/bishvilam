'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, addDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { UserProfile, Event } from '@/types';
import { Users, Plus, X, UserCheck, Calendar, Save, BookOpen, Edit, Trash2 } from 'lucide-react';

interface TrainerGuideline {
  id: string;
  title: string;
  content: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function TrainerManager() {
  const [trainers, setTrainers] = useState<UserProfile[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [guidelines, setGuidelines] = useState<TrainerGuideline[]>([]);
  const [editingGuideline, setEditingGuideline] = useState<TrainerGuideline | null>(null);
  const [showGuidelineForm, setShowGuidelineForm] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load trainers
      const trainersQuery = query(
        collection(db, 'profiles'),
        where('role', '==', 'trainer')
      );
      const trainersSnapshot = await getDocs(trainersQuery);
      const trainersData = trainersSnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id
      })) as UserProfile[];

      // Load events
      const eventsQuery = query(collection(db, 'events'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startAt: data.startAt?.toDate ? data.startAt.toDate() : new Date(data.startAt),
          endAt: data.endAt?.toDate ? data.endAt.toDate() : new Date(data.endAt),
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        } as Event;
      });

      // Load guidelines
      const guidelinesQuery = query(
        collection(db, 'trainerGuidelines'),
        orderBy('order', 'asc')
      );
      const guidelinesSnapshot = await getDocs(guidelinesQuery);
      const guidelinesData = guidelinesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          title: data.title || '',
          content: data.content || '',
          order: data.order || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        } as TrainerGuideline;
      });

      setTrainers(trainersData);
      setEvents(eventsData);
      setGuidelines(guidelinesData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const assignTrainerToEvent = async (eventId: string, trainerId: string) => {
    try {
      setSaving(eventId);
      
      const event = events.find(e => e.id === eventId);
      if (!event) return;

      const currentTrainers = event.assignedTrainers || [];
      const updatedTrainers = currentTrainers.includes(trainerId)
        ? currentTrainers.filter(id => id !== trainerId) // Remove if already assigned
        : [...currentTrainers, trainerId]; // Add if not assigned

      await updateDoc(doc(db, 'events', eventId), {
        assignedTrainers: updatedTrainers
      });

      // Update local state
      setEvents(prevEvents =>
        prevEvents.map(e =>
          e.id === eventId
            ? { ...e, assignedTrainers: updatedTrainers }
            : e
        )
      );

    } catch (error) {
      console.error('Error assigning trainer:', error);
      alert('שגיאה בהקצאת מדריך');
    } finally {
      setSaving(null);
    }
  };

  const getTrainerName = (trainerId: string) => {
    const trainer = trainers.find(t => t.uid === trainerId);
    return trainer ? `${trainer.firstName} ${trainer.lastName}` : 'מדריך לא נמצא';
  };

  const getEventTrainers = (event: Event) => {
    if (!event.assignedTrainers || event.assignedTrainers.length === 0) {
      return 'לא הוקצו מדריכים';
    }
    return event.assignedTrainers.map(trainerId => getTrainerName(trainerId)).join(', ');
  };

  const saveGuideline = async (guidelineData: Partial<TrainerGuideline>) => {
    try {
      setSaving('guideline');
      
      if (editingGuideline) {
        // Update existing guideline
        await updateDoc(doc(db, 'trainerGuidelines', editingGuideline.id), {
          ...guidelineData,
          updatedAt: new Date()
        });
      } else {
        // Create new guideline
        await addDoc(collection(db, 'trainerGuidelines'), {
          ...guidelineData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await loadData(); // Reload data
      setShowGuidelineForm(false);
      setEditingGuideline(null);
    } catch (error) {
      console.error('Error saving guideline:', error);
      alert('שגיאה בשמירת ההנחיה');
    } finally {
      setSaving(null);
    }
  };

  const deleteGuideline = async (guidelineId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק הנחיה זו?')) return;
    
    try {
      setSaving(guidelineId);
      await deleteDoc(doc(db, 'trainerGuidelines', guidelineId));
      await loadData(); // Reload data
    } catch (error) {
      console.error('Error deleting guideline:', error);
      alert('שגיאה במחיקת ההנחיה');
    } finally {
      setSaving(null);
    }
  };

  const createDefaultGuidelines = async () => {
    try {
      setSaving('creating-defaults');
      
      const defaultGuidelines = [
        {
          title: 'הכנות לפני האירוע',
          content: '• הגע 15 דקות לפני תחילת האירוע\n• ודא שכל הציוד הנדרש זמין ותקין\n• בדוק את רשימת המשתתפים מראש\n• הכן תוכנית גיבוי למקרה של בעיות טכניות',
          order: 1
        },
        {
          title: 'ניהול המשתתפים',
          content: '• בדוק נוכחות בתחילת האירוע\n• שמור על אווירה חיובית ומעודדת\n• עזור למשתתפים שמתקשים\n• שמור על משמעת ובטיחות',
          order: 2
        },
        {
          title: 'בטיחות וחירום',
          content: '• הכר את נהלי החירום של המתקן\n• ודא שתמיד יש גישה לעזרה ראשונה\n• שמור על בטיחות המשתתפים בכל עת\n• דווח על תקלות או בעיות מיד',
          order: 3
        },
        {
          title: 'סיום האירוע',
          content: '• ודא שכל המשתתפים עזבו בבטחה\n• נקה ופנה את האזור\n• מלא דוח סיכום לאדמין\n• החזר ציוד למקומו המיועד',
          order: 4
        }
      ];

      for (const guideline of defaultGuidelines) {
        await addDoc(collection(db, 'trainerGuidelines'), {
          ...guideline,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await loadData();
    } catch (error) {
      console.error('Error creating default guidelines:', error);
      alert('שגיאה ביצירת הנחיות ברירת המחדל');
    } finally {
      setSaving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
        <span className="ml-3">טוען נתונים...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold mb-2">ניהול מדריכים</h2>
        <p className="text-gray-400">הקצה מדריכים לאירועים ונהל את ההרשאות שלהם</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך מדריכים</p>
              <p className="text-2xl font-bold">{trainers.length}</p>
            </div>
            <UserCheck className="text-blue-400 w-8 h-8" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">אירועים עם מדריכים</p>
              <p className="text-2xl font-bold">
                {events.filter(e => e.assignedTrainers && e.assignedTrainers.length > 0).length}
              </p>
            </div>
            <Calendar className="text-green-400 w-8 h-8" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">הקצאות פעילות</p>
              <p className="text-2xl font-bold">
                {events.reduce((acc, event) => acc + (event.assignedTrainers?.length || 0), 0)}
              </p>
            </div>
            <Users className="text-purple-400 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Trainers List */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">רשימת מדריכים</h3>
        
        {trainers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            אין מדריכים במערכת עדיין
          </div>
        ) : (
          <div className="space-y-4">
            {trainers.map((trainer) => (
              <div key={trainer.uid} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                    <UserCheck size={20} className="text-white" />
                  </div>
                  <div>
                    <h4 className="font-semibold">{trainer.firstName} {trainer.lastName}</h4>
                    <div className="text-sm text-gray-400">
                      {trainer.email} • {trainer.phone}
                    </div>
                  </div>
                </div>
                
                <div className="text-sm text-gray-400">
                  {events.filter(e => e.assignedTrainers?.includes(trainer.uid)).length} אירועים מוקצים
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events Assignment */}
      <div className="card">
        <h3 className="text-xl font-semibold mb-6">הקצאת מדריכים לאירועים</h3>
        
        {events.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            אין אירועים במערכת עדיין
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <div key={event.id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-semibold text-lg">{event.title}</h4>
                    <div className="text-sm text-gray-400">
                      {event.startAt.toLocaleDateString('he-IL', {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })} • {event.locationName}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => {
                      setSelectedEvent(event);
                      setShowAssignModal(true);
                    }}
                    className="btn-outline"
                  >
                    נהל מדריכים
                  </button>
                </div>

                <div className="text-sm">
                  <span className="text-gray-400">מדריכים מוקצים: </span>
                  <span className="text-white">{getEventTrainers(event)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Trainer Guidelines Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-brand-green" />
            <h3 className="text-xl font-semibold">הנחיות למדריכים</h3>
          </div>
          <button
            onClick={() => {
              setEditingGuideline(null);
              setShowGuidelineForm(true);
            }}
            className="btn flex items-center gap-2"
          >
            <Plus size={16} />
            הוסף הנחיה
          </button>
        </div>
        
        {guidelines.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p>אין הנחיות עדיין</p>
            <p className="text-sm mt-2">הוסף הנחיות שיוצגו למדריכים בפאנל שלהם</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {guidelines.map((guideline) => (
              <div key={guideline.id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h4 className="font-semibold text-brand-green mb-2">{guideline.title}</h4>
                    <p className="text-sm text-gray-300 whitespace-pre-line">{guideline.content}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingGuideline(guideline);
                        setShowGuidelineForm(true);
                      }}
                      className="p-2 hover:bg-gray-700 rounded text-blue-400"
                      title="עריכה"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteGuideline(guideline.id)}
                      disabled={saving === guideline.id}
                      className="p-2 hover:bg-gray-700 rounded text-red-400"
                      title="מחיקה"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="text-xs text-gray-500">
                  סדר: {guideline.order} • עודכן: {guideline.updatedAt.toLocaleDateString('he-IL')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Assignment Modal */}
      {showAssignModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-800 rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-700">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">הקצת מדריכים</h3>
                <button
                  onClick={() => setShowAssignModal(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-gray-400 mt-2">{selectedEvent.title}</p>
            </div>

            <div className="p-6 max-h-96 overflow-y-auto">
              {trainers.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  אין מדריכים במערכת
                </div>
              ) : (
                <div className="space-y-3">
                  {trainers.map((trainer) => {
                    const isAssigned = selectedEvent.assignedTrainers?.includes(trainer.uid) || false;
                    return (
                      <div key={trainer.uid} className="flex items-center justify-between p-3 bg-gray-700/50 rounded">
                        <div>
                          <div className="font-semibold">{trainer.firstName} {trainer.lastName}</div>
                          <div className="text-sm text-gray-400">{trainer.email}</div>
                        </div>
                        
                        <button
                          onClick={() => assignTrainerToEvent(selectedEvent.id, trainer.uid)}
                          disabled={saving === selectedEvent.id}
                          className={`btn ${isAssigned ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                          {saving === selectedEvent.id ? (
                            'שומר...'
                          ) : isAssigned ? (
                            'הסר הקצאה'
                          ) : (
                            'הקצה'
                          )}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Guideline Form Modal */}
      {showGuidelineForm && (
        <GuidelineForm
          guideline={editingGuideline}
          onSave={saveGuideline}
          onCancel={() => {
            setShowGuidelineForm(false);
            setEditingGuideline(null);
          }}
          saving={saving === 'guideline'}
        />
      )}
    </div>
  );
}

// Guideline Form Component
function GuidelineForm({ 
  guideline, 
  onSave, 
  onCancel, 
  saving 
}: {
  guideline: TrainerGuideline | null;
  onSave: (data: Partial<TrainerGuideline>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    title: guideline?.title || '',
    content: guideline?.content || '',
    order: guideline?.order || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      alert('נא להזין כותרת להנחיה');
      return;
    }
    
    if (!formData.content.trim()) {
      alert('נא להזין תוכן להנחיה');
      return;
    }
    
    onSave(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'order' ? parseInt(value) || 1 : value
    }));
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {guideline ? 'עריכת הנחיה' : 'הנחיה חדשה'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">כותרת</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="input w-full"
                placeholder="כותרת ההנחיה..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">תוכן</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="input w-full h-32 resize-none"
                placeholder="תוכן ההנחיה..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">סדר תצוגה</label>
              <input
                type="number"
                name="order"
                value={formData.order}
                onChange={handleChange}
                className="input w-full"
                min="1"
                max="4"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                מספר בין 1-4 לקביעת סדר התצוגה
              </p>
            </div>
          </div>

          <div className="flex gap-3 pt-6">
            <button
              type="submit"
              disabled={saving}
              className="btn flex-1"
            >
              {saving ? 'שומר...' : 'שמור'}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="btn-outline flex-1"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}