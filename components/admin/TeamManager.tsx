'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc, orderBy, query } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Users, Plus, X, Save, Edit, Trash2, Image, UserCircle } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  title: string;
  description?: string;
  imageUrl?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export default function TeamManager() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    loadTeamMembers();
  }, []);

  const loadTeamMembers = async () => {
    try {
      setLoading(true);
      
      const teamQuery = query(
        collection(db, 'teamMembers'),
        orderBy('order', 'asc')
      );
      const teamSnapshot = await getDocs(teamQuery);
      const teamData = teamSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || '',
          title: data.title || '',
          description: data.description || '',
          imageUrl: data.imageUrl || '',
          order: data.order || 0,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date()
        } as TeamMember;
      });

      setTeamMembers(teamData);
    } catch (error) {
      console.error('Error loading team members:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveMember = async (memberData: Partial<TeamMember>) => {
    try {
      setSaving('member');
      
      if (editingMember) {
        // Update existing member
        await updateDoc(doc(db, 'teamMembers', editingMember.id), {
          ...memberData,
          updatedAt: new Date()
        });
      } else {
        // Create new member
        await addDoc(collection(db, 'teamMembers'), {
          ...memberData,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      await loadTeamMembers(); // Reload data
      setShowForm(false);
      setEditingMember(null);
    } catch (error) {
      console.error('Error saving team member:', error);
      alert('שגיאה בשמירת חבר הצוות');
    } finally {
      setSaving(null);
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק חבר צוות זה?')) return;
    
    try {
      setSaving(memberId);
      await deleteDoc(doc(db, 'teamMembers', memberId));
      await loadTeamMembers(); // Reload data
    } catch (error) {
      console.error('Error deleting team member:', error);
      alert('שגיאה במחיקת חבר הצוות');
    } finally {
      setSaving(null);
    }
  };

  const createDefaultTeamMembers = async () => {
    try {
      setSaving('creating-defaults');
      
      const defaultMembers = [
        {
          name: 'יוחאי קיל',
          title: 'מנהל ומייסד',
          description: 'מנהל החברה ומייסדה',
          imageUrl: '',
          order: 1
        },
        {
          name: 'דני לוי',
          title: 'מדריך ראשי',
          description: 'מדריך בכיר עם ניסיון רב',
          imageUrl: '',
          order: 2
        },
        {
          name: 'רועי אברהם',
          title: 'מדריך ניווט',
          description: 'מומחה ניווט ומדריך מקצועי',
          imageUrl: '',
          order: 3
        }
      ];

      for (const member of defaultMembers) {
        await addDoc(collection(db, 'teamMembers'), {
          ...member,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }

      await loadTeamMembers();
    } catch (error) {
      console.error('Error creating default team members:', error);
      alert('שגיאה ביצירת חברי צוות ברירת המחדל');
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
        <h2 className="text-2xl font-bold mb-2">ניהול חברי הצוות</h2>
        <p className="text-gray-400">נהל את פרטי חברי הצוות שמוצגים בעמוד &ldquo;אודות&rdquo;</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך חברי צוות</p>
              <p className="text-2xl font-bold">{teamMembers.length}</p>
            </div>
            <Users className="text-purple-400 w-8 h-8" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">חברים עם תמונה</p>
              <p className="text-2xl font-bold">
                {teamMembers.filter(member => member.imageUrl && member.imageUrl.trim()).length}
              </p>
            </div>
            <Image className="text-green-400 w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Team Members Management */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-brand-green" />
            <h3 className="text-xl font-semibold">חברי הצוות</h3>
          </div>
          <div className="flex gap-3">
            {teamMembers.length === 0 && (
              <button
                onClick={createDefaultTeamMembers}
                disabled={saving === 'creating-defaults'}
                className="btn-outline flex items-center gap-2"
              >
                <Plus size={16} />
                {saving === 'creating-defaults' ? 'יוצר...' : 'צור חברי צוות ברירת מחדל'}
              </button>
            )}
            <button
              onClick={() => {
                setEditingMember(null);
                setShowForm(true);
              }}
              className="btn bg-blue-600 hover:bg-blue-700 border-blue-600 flex items-center gap-2 font-semibold"
            >
              <Plus size={16} />
              הוסף חבר צוות חדש
            </button>
          </div>
        </div>
        
        {teamMembers.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p>אין חברי צוות עדיין</p>
            <p className="text-sm mt-2">הוסף חברי צוות שיוצגו בעמוד אודות</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {member.imageUrl ? (
                        <img
                          src={member.imageUrl}
                          alt={member.name}
                          className="w-12 h-12 rounded-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                          }}
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center">
                          <UserCircle className="text-gray-400" size={24} />
                        </div>
                      )}
                      <div>
                        <h4 className="font-semibold text-white">{member.name}</h4>
                        <p className="text-sm text-brand-green">{member.title}</p>
                      </div>
                    </div>
                    {member.description && (
                      <p className="text-sm text-gray-300 mb-2">{member.description}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => {
                        setEditingMember(member);
                        setShowForm(true);
                      }}
                      className="p-2 hover:bg-gray-700 rounded text-blue-400"
                      title="עריכה"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => deleteMember(member.id)}
                      disabled={saving === member.id}
                      className="p-2 hover:bg-gray-700 rounded text-red-400"
                      title="מחיקה"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>סדר: {member.order}</span>
                  <span>עודכן: {member.updatedAt.toLocaleDateString('he-IL')}</span>
                </div>
                
                {member.imageUrl && (
                  <div className="mt-2">
                    <p className="text-xs text-gray-400 truncate" title={member.imageUrl}>
                      תמונה: {member.imageUrl}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Member Form Modal */}
      {showForm && (
        <MemberForm
          member={editingMember}
          onSave={saveMember}
          onCancel={() => {
            setShowForm(false);
            setEditingMember(null);
          }}
          saving={saving === 'member'}
        />
      )}
    </div>
  );
}

// Member Form Component
function MemberForm({ 
  member, 
  onSave, 
  onCancel, 
  saving 
}: {
  member: TeamMember | null;
  onSave: (data: Partial<TeamMember>) => void;
  onCancel: () => void;
  saving: boolean;
}) {
  const [formData, setFormData] = useState({
    name: member?.name || '',
    title: member?.title || '',
    description: member?.description || '',
    imageUrl: member?.imageUrl || '',
    order: member?.order || 1
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('נא להזין שם לחבר הצוות');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('נא להזין תפקיד לחבר הצוות');
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
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="p-6 border-b border-gray-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              {member ? 'עריכת חבר צוות' : 'חבר צוות חדש'}
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-6 overflow-y-auto flex-1">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">שם מלא</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="שם חבר הצוות..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תפקיד</label>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="תפקיד בחברה..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">תיאור (אופציונלי)</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="input w-full h-24 resize-none"
                  placeholder="תיאור קצר על חבר הצוות..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">כתובת תמונה (URL)</label>
                <input
                  type="url"
                  name="imageUrl"
                  value={formData.imageUrl}
                  onChange={handleChange}
                  className="input w-full"
                  placeholder="https://example.com/image.jpg"
                />
                <p className="text-xs text-gray-400 mt-1">
                  הכנס כתובת URL של תמונה חבר הצוות
                </p>
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
                  max="10"
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  מספר בין 1-10 לקביעת סדר התצוגה
                </p>
              </div>

              {formData.imageUrl && (
                <div>
                  <label className="block text-sm font-medium mb-2">תצוגה מקדימה</label>
                  <img
                    src={formData.imageUrl}
                    alt="תצוגה מקדימה"
                    className="w-20 h-20 rounded-full object-cover border border-gray-600"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-3 p-6 border-t border-gray-700 flex-shrink-0 bg-gray-800">
            <button
              type="submit"
              disabled={saving}
              className="btn bg-green-600 hover:bg-green-700 border-green-600 flex-1 flex items-center justify-center gap-2 font-semibold"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  שומר...
                </>
              ) : (
                <>
                  <Save size={16} />
                  שמור חבר צוות
                </>
              )}
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