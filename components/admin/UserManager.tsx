'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { UserProfile } from '@/types';
import { Search, Filter, Edit, Trash2, Shield, User, Phone, Mail, Calendar, ChevronDown, UserCheck, Users, X, Plus } from 'lucide-react';
import { HEBREW_LETTERS, formatGroupsDisplay } from '@/utils/groups';

export default function UserManager() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'student' | 'admin' | 'trainer'>('all');
  const [groupFilter, setGroupFilter] = useState<string[]>([]);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [roleDropdown, setRoleDropdown] = useState<string | null>(null);
  const [showGroupManager, setShowGroupManager] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [showBulkGroupManager, setShowBulkGroupManager] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchTerm, roleFilter, groupFilter]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (roleDropdown && !(event.target as Element).closest('.role-dropdown')) {
        setRoleDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [roleDropdown]);

  const loadUsers = async () => {
    try {
      const usersQuery = query(collection(db, 'profiles'), orderBy('createdAt', 'desc'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData = usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as any[];
      
      setUsers(usersData);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(user =>
        user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.phone.includes(searchTerm)
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.role === roleFilter);
    }

    if (groupFilter.length > 0) {
      filtered = filtered.filter(user => {
        if (!user.groups || user.groups.length === 0) {
          return groupFilter.includes('unassigned');
        }
        return user.groups.some(group => groupFilter.includes(group));
      });
    }

    setFilteredUsers(filtered);
  };

  const updateUserRole = async (userId: string, newRole: 'student' | 'admin' | 'trainer') => {
    const roleNames = { admin: 'מנהל', trainer: 'מדריך', student: 'תלמיד' };
    if (!confirm(`האם אתה בטוח שברצונך לשנות את התפקיד ל${roleNames[newRole]}?`)) return;
    
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        role: newRole,
        updatedAt: new Date()
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('שגיאה בעדכון התפקיד');
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המשתמש? פעולה זו אינה הפיכה.')) return;
    
    try {
      await deleteDoc(doc(db, 'profiles', userId));
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      alert('שגיאה במחיקת המשתמש');
    }
  };

  const updateUserGroups = async (userId: string, newGroups: string[]) => {
    try {
      await updateDoc(doc(db, 'profiles', userId), {
        groups: newGroups,
        updatedAt: new Date()
      });
      loadUsers();
    } catch (error) {
      console.error('Error updating user groups:', error);
      alert('שגיאה בעדכון קבוצות המשתמש');
    }
  };

  const bulkUpdateGroups = async (userIds: string[], newGroups: string[], mode: 'replace' | 'add') => {
    if (userIds.length === 0) {
      alert('נא לבחור לפחות משתמש אחד');
      return;
    }

    const modeText = mode === 'replace' ? 'החלפת' : 'הוספת';
    if (!confirm(`האם אתה בטוח ברצונך לבצע ${modeText} קבוצות עבור ${userIds.length} משתמשים?`)) {
      return;
    }

    try {
      const promises = userIds.map(async (userId) => {
        const user = users.find(u => u.uid === userId);
        if (!user) return;

        let finalGroups: string[];
        if (mode === 'replace') {
          finalGroups = newGroups;
        } else {
          // Add mode - merge with existing groups
          const existingGroups = user.groups || [];
          finalGroups = Array.from(new Set([...existingGroups, ...newGroups]));
        }

        await updateDoc(doc(db, 'profiles', userId), {
          groups: finalGroups,
          updatedAt: new Date()
        });
      });

      await Promise.all(promises);
      await loadUsers();
      setSelectedUsers(new Set());
      setShowBulkGroupManager(false);
    } catch (error) {
      console.error('Error bulk updating groups:', error);
      alert('שגיאה בעדכון קבוצות המשתמשים');
    }
  };

  if (loading) {
    return <div className="text-center py-8">טוען משתמשים...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול משתמשים</h2>
        <div className="text-sm text-gray-400">
          {filteredUsers.length} מתוך {users.length} משתמשים
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="חיפוש לפי שם, אימייל או טלפון..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pr-10"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as any)}
              className="bg-gray-800 border border-gray-600 rounded px-3 py-2"
            >
              <option value="all">כל התפקידים</option>
              <option value="student">תלמידים</option>
              <option value="trainer">מדריכים</option>
              <option value="admin">מנהלים</option>
            </select>
          </div>

          {/* Group Filter */}
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-400" />
            <GroupFilter 
              selectedGroups={groupFilter}
              onGroupsChange={setGroupFilter}
            />
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedUsers.size > 0 && (
          <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-600">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">
                נבחרו {selectedUsers.size} משתמשים
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowBulkGroupManager(true)}
                  className="btn-outline text-sm flex items-center gap-2"
                >
                  <Users size={16} />
                  נהל קבוצות
                </button>
                <button
                  onClick={() => setSelectedUsers(new Set())}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {editingUser && (
        <UserEditForm
          user={editingUser}
          onCancel={() => setEditingUser(null)}
          onSuccess={() => {
            setEditingUser(null);
            loadUsers();
          }}
        />
      )}

      {/* Users Grid */}
      <div className="grid gap-4">
        {filteredUsers.length === 0 ? (
          <div className="card text-center py-12">
            <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">לא נמצאו משתמשים</h3>
            <p className="text-gray-400">נסה לשנות את הפילטרים או החיפוש</p>
          </div>
        ) : (
          filteredUsers.map((user) => (
            <div key={user.uid} className="card">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3 flex-1">
                  {/* Checkbox for bulk selection */}
                  <input
                    type="checkbox"
                    checked={selectedUsers.has(user.uid)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedUsers);
                      if (e.target.checked) {
                        newSelected.add(user.uid);
                      } else {
                        newSelected.delete(user.uid);
                      }
                      setSelectedUsers(newSelected);
                    }}
                    className="w-4 h-4 text-brand-green bg-gray-700 border-gray-600 rounded focus:ring-brand-green focus:ring-2"
                  />
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">
                        {user.firstName} {user.lastName} {(!user.firstName && !user.lastName) && user.email}
                      </h3>
                      <div className="relative">
                      <button
                        onClick={() => setRoleDropdown(roleDropdown === user.uid ? null : user.uid)}
                        className={`px-2 py-1 rounded text-xs flex items-center gap-1 hover:opacity-80 transition-opacity cursor-pointer ${
                          user.role === 'admin' 
                            ? 'bg-red-900/50 text-red-300' 
                            : user.role === 'trainer'
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-blue-900/50 text-blue-300'
                        }`}>
                        {user.role === 'admin' ? <Shield size={12} /> : 
                         user.role === 'trainer' ? <UserCheck size={12} /> : 
                         <User size={12} />}
                        {user.role === 'admin' ? 'מנהל' : 
                         user.role === 'trainer' ? 'מדריך' : 
                         'תלמיד'}
                        <ChevronDown size={12} />
                      </button>

                      {roleDropdown === user.uid && (
                        <div className="role-dropdown absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-10 min-w-[120px]">
                          <button
                            onClick={() => {
                              updateUserRole(user.uid, 'student');
                              setRoleDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 text-blue-300"
                          >
                            <User size={14} />
                            תלמיד
                          </button>
                          <button
                            onClick={() => {
                              updateUserRole(user.uid, 'trainer');
                              setRoleDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 text-green-300"
                          >
                            <UserCheck size={14} />
                            מדריך
                          </button>
                          <button
                            onClick={() => {
                              updateUserRole(user.uid, 'admin');
                              setRoleDropdown(null);
                            }}
                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-700 flex items-center gap-2 text-red-300"
                          >
                            <Shield size={14} />
                            מנהל
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-400">
                    {user.email && (
                      <div className="flex items-center gap-2">
                        <Mail size={14} />
                        <span>{user.email}</span>
                      </div>
                    )}
                    {user.phone && (
                      <div className="flex items-center gap-2">
                        <Phone size={14} />
                        <span>{user.phone}</span>
                      </div>
                    )}
                    {user.createdAt && (
                      <div className="flex items-center gap-2">
                        <Calendar size={14} />
                        <span>נרשם: {new Date((user as any).createdAt?.toDate ? (user as any).createdAt.toDate() : (user as any).createdAt).toLocaleDateString('he-IL')}</span>
                      </div>
                    )}
                  </div>

                  {/* Groups Display */}
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm">
                        <Users size={14} className="text-gray-400" />
                        <span className="text-gray-400">קבוצות:</span>
                        <span className="text-white">{formatGroupsDisplay(user.groups)}</span>
                      </div>
                      {user.role === 'student' && (
                        <button
                          onClick={() => setShowGroupManager(showGroupManager === user.uid ? null : user.uid)}
                          className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1"
                        >
                          <Edit size={12} />
                          ערוך
                        </button>
                      )}
                    </div>
                  </div>

                  {(user.tzId || user.dob || user.emergency) && (
                    <div className="mt-3 pt-3 border-t border-gray-700 text-sm text-gray-400">
                      {user.tzId && <div>ת.ז: {user.tzId}</div>}
                      {user.dob && <div>תאריך לידה: {user.dob}</div>}
                      {user.emergency && <div>איש קשר חירום: {user.emergency}</div>}
                    </div>
                  )}

                  {/* Inline Group Manager */}
                  {showGroupManager === user.uid && user.role === 'student' && (
                    <div className="mt-3 pt-3 border-t border-gray-700">
                      <GroupSelector
                        selectedGroups={user.groups || []}
                        onSave={(groups) => {
                          updateUserGroups(user.uid, groups);
                          setShowGroupManager(null);
                        }}
                        onCancel={() => setShowGroupManager(null)}
                      />
                    </div>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingUser(user)}
                    className="p-2 hover:bg-gray-700 rounded text-blue-400"
                    title="עריכת משתמש"
                  >
                    <Edit size={18} />
                  </button>
                  
                  
                  <button
                    onClick={() => deleteUser(user.uid)}
                    className="p-2 hover:bg-gray-700 rounded text-red-400"
                    title="מחיקת משתמש"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
                </div>
            </div>
          ))
        )}
      </div>

      {/* Bulk Group Manager Modal */}
      {showBulkGroupManager && (
        <BulkGroupManager
          selectedUserIds={Array.from(selectedUsers)}
          onSave={bulkUpdateGroups}
          onCancel={() => setShowBulkGroupManager(false)}
        />
      )}
    </div>
  );
}

function UserEditForm({ user, onCancel, onSuccess }: {
  user: UserProfile;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: user.firstName || '',
    lastName: user.lastName || '',
    phone: user.phone || '',
    tzId: user.tzId || '',
    dob: user.dob || '',
    emergency: user.emergency || '',
    role: user.role
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, 'profiles', user.uid), {
        ...formData,
        updatedAt: new Date()
      });
      onSuccess();
    } catch (error) {
      console.error('Error updating user:', error);
      alert('שגיאה בעדכון המשתמש');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">עריכת משתמש</h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">שם פרטי</label>
            <input
              type="text"
              name="firstName"
              value={formData.firstName}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">שם משפחה</label>
            <input
              type="text"
              name="lastName"
              value={formData.lastName}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">טלפון</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">תעודת זהות</label>
            <input
              type="text"
              name="tzId"
              value={formData.tzId}
              onChange={handleChange}
              className="input"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">תאריך לידה</label>
            <input
              type="date"
              name="dob"
              value={formData.dob}
              onChange={handleChange}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">תפקיד</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="input"
            >
              <option value="student">תלמיד</option>
              <option value="trainer">מדריך</option>
              <option value="admin">מנהל</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">איש קשר חירום</label>
          <input
            type="text"
            name="emergency"
            value={formData.emergency}
            onChange={handleChange}
            className="input"
            placeholder="שם ומספר טלפון"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading} className="btn">
            {loading ? 'שומר...' : 'עדכון'}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

// Group Filter Component
function GroupFilter({ selectedGroups, onGroupsChange }: {
  selectedGroups: string[];
  onGroupsChange: (groups: string[]) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleGroup = (group: string) => {
    const newGroups = selectedGroups.includes(group)
      ? selectedGroups.filter(g => g !== group)
      : [...selectedGroups, group];
    onGroupsChange(newGroups);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-gray-800 border border-gray-600 rounded px-3 py-2 text-sm flex items-center gap-2 min-w-[120px]"
      >
        {selectedGroups.length === 0 ? 'כל הקבוצות' : `${selectedGroups.length} קבוצות`}
        <ChevronDown size={14} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-600 rounded-lg shadow-lg z-20 min-w-[200px] max-h-60 overflow-y-auto">
          <div className="p-2">
            <button
              onClick={() => toggleGroup('unassigned')}
              className={`w-full text-left px-2 py-1 rounded text-sm ${
                selectedGroups.includes('unassigned') ? 'bg-brand-green text-black' : 'hover:bg-gray-700'
              }`}
            >
              לא משויך לקבוצה
            </button>
            {HEBREW_LETTERS.map(letter => (
              <button
                key={letter}
                onClick={() => toggleGroup(letter)}
                className={`w-full text-left px-2 py-1 rounded text-sm ${
                  selectedGroups.includes(letter) ? 'bg-brand-green text-black' : 'hover:bg-gray-700'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>
          <div className="p-2 border-t border-gray-600">
            <button
              onClick={() => {
                onGroupsChange([]);
                setIsOpen(false);
              }}
              className="text-sm text-gray-400 hover:text-white"
            >
              נקה הכל
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Group Selector Component
function GroupSelector({ selectedGroups, onSave, onCancel }: {
  selectedGroups: string[];
  onSave: (groups: string[]) => void;
  onCancel: () => void;
}) {
  const [groups, setGroups] = useState<string[]>(selectedGroups);

  const toggleGroup = (group: string) => {
    setGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  return (
    <div className="space-y-3">
      <div className="text-sm font-medium">בחר קבוצות:</div>
      <div className="grid grid-cols-6 gap-2">
        {HEBREW_LETTERS.map(letter => (
          <button
            key={letter}
            onClick={() => toggleGroup(letter)}
            className={`p-2 text-sm rounded border transition-colors ${
              groups.includes(letter)
                ? 'bg-brand-green text-black border-brand-green'
                : 'bg-gray-700 text-white border-gray-600 hover:border-gray-500'
            }`}
          >
            {letter}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onSave(groups)}
          className="btn text-sm"
        >
          שמור
        </button>
        <button
          onClick={onCancel}
          className="btn-outline text-sm"
        >
          ביטול
        </button>
        <button
          onClick={() => setGroups([])}
          className="text-sm text-gray-400 hover:text-white"
        >
          נקה הכל
        </button>
      </div>
    </div>
  );
}

// Bulk Group Manager Modal
function BulkGroupManager({ selectedUserIds, onSave, onCancel }: {
  selectedUserIds: string[];
  onSave: (userIds: string[], groups: string[], mode: 'replace' | 'add') => void;
  onCancel: () => void;
}) {
  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);
  const [mode, setMode] = useState<'replace' | 'add'>('replace');

  const toggleGroup = (group: string) => {
    setSelectedGroups(prev => 
      prev.includes(group) 
        ? prev.filter(g => g !== group)
        : [...prev, group]
    );
  };

  const handleSave = () => {
    if (selectedGroups.length === 0) {
      alert('נא לבחור לפחות קבוצה אחת');
      return;
    }
    onSave(selectedUserIds, selectedGroups, mode);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg max-w-lg w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">
              ניהול קבוצות עבור {selectedUserIds.length} משתמשים
            </h3>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">פעולה:</label>
            <div className="space-y-2">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="replace"
                  checked={mode === 'replace'}
                  onChange={(e) => setMode(e.target.value as 'replace' | 'add')}
                  className="w-4 h-4 text-brand-green"
                />
                <span>החלף קבוצות (מחק קבוצות קיימות)</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="add"
                  checked={mode === 'add'}
                  onChange={(e) => setMode(e.target.value as 'replace' | 'add')}
                  className="w-4 h-4 text-brand-green"
                />
                <span>הוסף קבוצות (שמור קבוצות קיימות)</span>
              </label>
            </div>
          </div>

          {/* Group Selection */}
          <div>
            <label className="block text-sm font-medium mb-3">בחר קבוצות:</label>
            <div className="grid grid-cols-6 gap-2">
              {HEBREW_LETTERS.map(letter => (
                <button
                  key={letter}
                  onClick={() => toggleGroup(letter)}
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
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSave}
              className="btn flex-1"
            >
              {mode === 'replace' ? 'החלף קבוצות' : 'הוסף קבוצות'}
            </button>
            <button
              onClick={onCancel}
              className="btn-outline flex-1"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}