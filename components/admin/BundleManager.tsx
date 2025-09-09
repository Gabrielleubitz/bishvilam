'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, DollarSign, Calendar, Users, X, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Bundle, BundleRegistration, Event } from '@/types';

interface BundleWithStats extends Bundle {
  events: Event[];
  registrations: BundleRegistration[];
  revenue: number;
  soldCount: number;
}

export default function BundleManager() {
  const [bundles, setBundles] = useState<BundleWithStats[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingBundle, setEditingBundle] = useState<Bundle | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedBundle, setExpandedBundle] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
    });

    loadData();
    return () => unsubscribe();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const eventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      setEvents(eventsData);

      // Load bundles
      const bundlesSnapshot = await getDocs(collection(db, 'bundles'));
      const bundlesData = bundlesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Bundle[];

      // Load bundle registrations
      const bundleRegistrationsSnapshot = await getDocs(collection(db, 'bundleRegistrations'));
      const bundleRegistrationsData = bundleRegistrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as BundleRegistration[];

      // Combine bundles with stats
      const bundlesWithStats: BundleWithStats[] = bundlesData.map(bundle => {
        const bundleEvents = eventsData.filter(event => bundle.eventIds.includes(event.id));
        const bundleRegistrations = bundleRegistrationsData.filter(reg => reg.bundleId === bundle.id);
        
        const soldCount = bundleRegistrations.filter(reg => reg.paymentStatus === 'paid').length;
        const revenue = bundleRegistrations.reduce((sum, reg) => {
          if (reg.paymentStatus === 'paid') {
            return sum + (reg.amountPaid || bundle.priceNis);
          }
          return sum;
        }, 0);

        return {
          ...bundle,
          events: bundleEvents,
          registrations: bundleRegistrations,
          revenue,
          soldCount
        };
      });

      setBundles(bundlesWithStats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
    } catch (error) {
      console.error('Error loading bundle data:', error);
      alert('שגיאה בטעינת נתוני החבילות: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (bundleId: string, currentStatus: boolean) => {
    try {
      await updateDoc(doc(db, 'bundles', bundleId), {
        publish: !currentStatus,
        updatedAt: new Date()
      });
      
      alert(!currentStatus ? 'החבילה פורסמה בהצלחה! ✅' : 'החבילה הוסתרה מהאתר ❌');
      loadData();
    } catch (error) {
      console.error('Error updating bundle:', error);
      alert('שגיאה בעדכון החבילה: ' + (error as any).message);
    }
  };

  const updateBundlePaymentStatus = async (registrationId: string, newPaymentStatus: 'paid' | 'pending' | 'free', bundlePrice?: number) => {
    try {
      console.log('💰 Updating bundle payment status:', registrationId, 'to', newPaymentStatus);
      
      let updateData: any = {
        paymentStatus: newPaymentStatus,
        updatedAt: new Date()
      };
      
      // If switching to 'paid', ask for the actual amount paid
      if (newPaymentStatus === 'paid') {
        const defaultAmount = bundlePrice || 0;
        const amountPaidStr = prompt(
          `כמה המשתמש שילם בפועל?\n\n` +
          `מחיר החבילה: ₪${defaultAmount}\n` +
          `הכנס את הסכום ששולם (או לחץ ביטול):`,
          defaultAmount.toString()
        );
        
        if (amountPaidStr === null) {
          // User cancelled
          return;
        }
        
        const amountPaid = parseFloat(amountPaidStr);
        if (isNaN(amountPaid) || amountPaid < 0) {
          alert('נא להזין סכום תקין (מספר חיובי)');
          return;
        }
        
        updateData.amountPaid = amountPaid;
        updateData.paymentDate = new Date();
        console.log('💰 Recording payment amount:', amountPaid);
      } else if (newPaymentStatus === 'pending' || newPaymentStatus === 'free') {
        // Clear payment tracking when switching away from paid
        updateData.amountPaid = null;
        updateData.paymentDate = null;
      }
      
      await updateDoc(doc(db, 'bundleRegistrations', registrationId), updateData);
      
      const statusMessages = {
        'paid': `התשלום עודכן לשולם ✅${updateData.amountPaid ? ` (₪${updateData.amountPaid})` : ''}`,
        'pending': 'התשלום עודכן לממתין 🟡',
        'free': 'התשלום עודכן לחינם 🆓'
      };
      
      console.log('✅ Bundle payment status updated successfully');
      alert(statusMessages[newPaymentStatus]);
      loadData(); // Reload to show updated status
    } catch (error) {
      console.error('❌ Error updating bundle payment status:', error);
      alert('שגיאה בעדכון סטטוס התשלום: ' + (error as any).message);
    }
  };

  const deleteBundle = async (bundleId: string) => {
    const bundle = bundles.find(b => b.id === bundleId);
    if (!bundle) return;

    if (bundle.soldCount > 0) {
      if (!confirm(`נמכרו ${bundle.soldCount} חבילות! האם אתה בטוח שברצונך למחוק?\n\nכל ההרשמות לחבילה זו ימחקו גם כן!`)) return;
    } else {
      if (!confirm('האם אתה בטוח שברצונך למחוק את החבילה?')) return;
    }
    
    try {
      // Delete all bundle registrations
      for (const registration of bundle.registrations) {
        await deleteDoc(doc(db, 'bundleRegistrations', registration.id));
      }
      
      // Delete the bundle
      await deleteDoc(doc(db, 'bundles', bundleId));
      
      alert(`החבילה "${bundle.title}" נמחקה בהצלחה`);
      loadData();
    } catch (error) {
      console.error('Error deleting bundle:', error);
      alert('שגיאה במחיקת החבילה: ' + (error as any).message);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div>טוען חבילות...</div>
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
              <p className="text-gray-400 text-sm">סך חבילות</p>
              <p className="text-2xl font-bold">{bundles.length}</p>
            </div>
            <Package className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">חבילות פעילות</p>
              <p className="text-2xl font-bold">{bundles.filter(b => b.publish).length}</p>
            </div>
            <Eye className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך מכירות</p>
              <p className="text-2xl font-bold">{bundles.reduce((sum, b) => sum + b.soldCount, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך הכנסות</p>
              <p className="text-2xl font-bold">₪{bundles.reduce((sum, b) => sum + b.revenue, 0)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול חבילות אירועים</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn flex items-center gap-2"
          disabled={!currentUser}
        >
          <Plus size={20} />
          יצירת חבילה חדשה
        </button>
      </div>

      {!currentUser && (
        <div className="bg-red-900/50 text-red-300 p-4 rounded">
          יש להתחבר כדי לנהל חבילות
        </div>
      )}

      {showCreateForm && (
        <BundleForm
          events={events}
          currentUser={currentUser}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadData();
          }}
        />
      )}

      {editingBundle && (
        <BundleForm
          bundle={editingBundle}
          events={events}
          currentUser={currentUser}
          onCancel={() => setEditingBundle(null)}
          onSuccess={() => {
            setEditingBundle(null);
            loadData();
          }}
        />
      )}

      <div className="grid gap-6">
        {bundles.length === 0 ? (
          <div className="card text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין חבילות</h3>
            <p className="text-gray-400 mb-4">צור את החבילה הראשונה שלך</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn"
              disabled={!currentUser}
            >
              יצירת חבילה חדשה
            </button>
          </div>
        ) : (
          bundles.map((bundle) => (
            <div key={bundle.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{bundle.title}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      bundle.publish 
                        ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
                        : 'bg-gray-700 text-gray-300 border border-gray-600'
                    }`}>
                      {bundle.publish ? '✅ פורסם באתר' : '❌ טיוטה'}
                    </span>
                    
                    {bundle.status && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        bundle.status === 'expired' 
                          ? 'bg-red-900/50 text-red-300 border border-red-500/30'
                          : bundle.status === 'draft'
                          ? 'bg-gray-700 text-gray-300 border border-gray-600'
                          : 'bg-green-900/50 text-green-300 border border-green-500/30'
                      }`}>
                        {bundle.status === 'expired' && '⏰ פג תוקף'}
                        {bundle.status === 'draft' && '📝 טיוטה'}
                        {bundle.status === 'active' && '🎯 פעיל'}
                      </span>
                    )}

                    {bundle.soldCount > 0 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-500/30">
                        🛒 {bundle.soldCount} נמכרו
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-4">{bundle.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} />
                      <span>₪{bundle.priceNis}</span>
                      {bundle.revenue > 0 && (
                        <span className="text-green-400 mr-2">(הכנסה: ₪{bundle.revenue})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Package size={16} />
                      <span>{bundle.events.length} אירועים</span>
                    </div>
                    {bundle.validUntil && (
                      <div className="flex items-center gap-1">
                        <Clock size={16} />
                        <span>תוקף עד: {new Date(bundle.validUntil).toLocaleDateString('he-IL')}</span>
                      </div>
                    )}
                  </div>

                  {/* Events in Bundle */}
                  <div className="bg-gray-800/50 rounded-lg p-3">
                    <h4 className="font-medium mb-2 text-sm">אירועים בחבילה:</h4>
                    <div className="flex flex-wrap gap-2">
                      {bundle.events.map((event) => (
                        <span 
                          key={event.id} 
                          className="px-2 py-1 bg-blue-900/30 text-blue-300 rounded text-xs"
                        >
                          {event.title}
                        </span>
                      ))}
                    </div>
                    {bundle.replacementEventIds && bundle.replacementEventIds.length > 0 && (
                      <div className="mt-2">
                        <h5 className="text-xs font-medium text-gray-400 mb-1">אירועי חלופה:</h5>
                        <div className="flex flex-wrap gap-2">
                          {events.filter(e => bundle.replacementEventIds!.includes(e.id)).map((event) => (
                            <span 
                              key={event.id} 
                              className="px-2 py-1 bg-yellow-900/30 text-yellow-300 rounded text-xs"
                            >
                              {event.title}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedBundle(expandedBundle === bundle.id ? null : bundle.id)}
                      className="btn-outline text-sm px-3 py-1.5 flex items-center gap-2"
                    >
                      {expandedBundle === bundle.id ? (
                        <>
                          <X size={16} />
                          סגור
                        </>
                      ) : (
                        <>
                          <Users size={16} />
                          {bundle.registrations.length > 0 ? `רכישות (${bundle.registrations.length})` : 'פרטים'}
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setEditingBundle(bundle)}
                      className="btn text-sm px-3 py-1.5 flex items-center gap-2"
                      disabled={!currentUser}
                    >
                      <Edit size={16} />
                      ערוך
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => togglePublish(bundle.id, bundle.publish)}
                      className={`text-xs px-2 py-1 rounded flex items-center gap-1 ${
                        bundle.publish 
                          ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50' 
                          : 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
                      }`}
                      disabled={!currentUser}
                    >
                      {bundle.publish ? <EyeOff size={14} /> : <Eye size={14} />}
                      {bundle.publish ? 'הסתר' : 'פרסם'}
                    </button>
                    
                    <button
                      onClick={() => deleteBundle(bundle.id)}
                      className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-300 hover:bg-red-800/50 flex items-center gap-1"
                      disabled={!currentUser}
                    >
                      <Trash2 size={14} />
                      מחק
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Section - Bundle Registrations */}
              {expandedBundle === bundle.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Package size={16} />
                    רכישות חבילה ({bundle.registrations.length})
                  </h4>
                  
                  {bundle.registrations.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>אין רכישות לחבילה זו עדיין</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {bundle.registrations.map((registration) => {
                        return (
                          <div key={registration.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded">
                            <div className="flex items-center gap-3">
                              <div className={`w-3 h-3 rounded-full ${
                                registration.paymentStatus === 'paid' ? 'bg-green-400' :
                                registration.paymentStatus === 'pending' ? 'bg-yellow-400' : 'bg-blue-400'
                              }`} />
                              <div>
                                <div className="font-medium">
                                  {(registration as any).userName || 'משתמש'} 
                                  <span className="text-gray-500 text-sm ml-2">#{registration.id.slice(-6)}</span>
                                </div>
                                <div className="text-sm text-gray-400">
                                  {(registration as any).userEmail && (
                                    <div>📧 {(registration as any).userEmail}</div>
                                  )}
                                  {(registration as any).userPhone && (
                                    <div>📱 {(registration as any).userPhone}</div>
                                  )}
                                  <div>📅 נרשם: {registration.createdAt ? ((registration.createdAt as any).toDate ? (registration.createdAt as any).toDate() : new Date(registration.createdAt)).toLocaleDateString('he-IL') : 'לא ידוע'}</div>
                                </div>
                                <div className="text-sm text-blue-300">
                                  🎟️ אירועים: {registration.eventRegistrations.length} רשום
                                  {registration.skippedEvents?.length ? `, ${registration.skippedEvents.length} דולגו` : ''}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                              {/* Payment Status Dropdown */}
                              <div className="text-left">
                                <select
                                  value={registration.paymentStatus || 'pending'}
                                  onChange={(e) => updateBundlePaymentStatus(registration.id, e.target.value as 'paid' | 'pending' | 'free', bundle.priceNis)}
                                  disabled={!currentUser}
                                  className={`text-sm px-2 py-1 rounded border-0 cursor-pointer ${
                                    registration.paymentStatus === 'paid' ? 'bg-green-900/50 text-green-300' :
                                    registration.paymentStatus === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                                    'bg-blue-900/50 text-blue-300'
                                  } ${!currentUser ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                                >
                                  <option value="paid">💰 שולם</option>
                                  <option value="pending">🟡 ממתין</option>
                                  <option value="free">🆓 חינם</option>
                                </select>
                                <div className="text-xs text-gray-400 mt-1">
                                  {registration.paymentStatus === 'paid' && registration.amountPaid !== undefined ? (
                                    <div>
                                      <span className="text-green-400">₪{registration.amountPaid}</span>
                                      {registration.paymentDate && (
                                        <div className="text-gray-500">
                                          {registration.paymentDate ? ((registration.paymentDate as any).toDate ? (registration.paymentDate as any).toDate() : new Date(registration.paymentDate)).toLocaleDateString('he-IL') : 'לא ידוע'}
                                        </div>
                                      )}
                                    </div>
                                  ) : (
                                    <div>
                                      מחיר: ₪{bundle.priceNis}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BundleForm({ bundle, events, currentUser, onCancel, onSuccess }: {
  bundle?: Bundle;
  events: Event[];
  currentUser: any;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    title: bundle?.title || '',
    description: bundle?.description || '',
    priceNis: bundle?.priceNis || 0,
    eventIds: bundle?.eventIds || [],
    replacementEventIds: bundle?.replacementEventIds || [],
    publish: bundle?.publish ?? false,
    status: bundle?.status || 'draft',
    validUntil: bundle?.validUntil ? new Date(bundle.validUntil).toISOString().split('T')[0] : ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('יש להתחבר כדי ליצור חבילה');
      return;
    }
    
    if (!formData.title.trim()) {
      alert('נא להזין שם לחבילה');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('נא להזין תיאור לחבילה');
      return;
    }
    
    if (formData.eventIds.length === 0) {
      alert('נא לבחור לפחות אירוע אחד');
      return;
    }
    
    if (formData.priceNis <= 0) {
      alert('נא להזין מחיר תקין');
      return;
    }

    setLoading(true);

    try {
      const bundleData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        priceNis: Number(formData.priceNis),
        eventIds: formData.eventIds,
        replacementEventIds: formData.replacementEventIds.length > 0 ? formData.replacementEventIds : [],
        publish: Boolean(formData.publish),
        status: formData.status,
        validUntil: formData.validUntil ? new Date(formData.validUntil) : undefined,
        updatedAt: new Date(),
        createdBy: currentUser.uid
      };

      if (bundle) {
        await updateDoc(doc(db, 'bundles', bundle.id), bundleData);
      } else {
        await addDoc(collection(db, 'bundles'), {
          ...bundleData,
          createdAt: new Date()
        });
      }

      const action = bundle ? 'עודכנה' : 'נוצרה';
      alert(`✅ החבילה ${action} בהצלחה!`);
      onSuccess();
    } catch (error) {
      console.error('Error saving bundle:', error);
      alert('שגיאה בשמירת החבילה: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const toggleEvent = (eventId: string, isReplacement: boolean = false) => {
    const key = isReplacement ? 'replacementEventIds' : 'eventIds';
    const currentIds = formData[key];
    
    if (currentIds.includes(eventId)) {
      setFormData(prev => ({
        ...prev,
        [key]: currentIds.filter(id => id !== eventId)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [key]: [...currentIds, eventId]
      }));
    }
  };

  const activeEvents = events.filter(e => e.publish && (!e.status || e.status === 'active'));

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">
        {bundle ? 'עריכת חבילה' : 'יצירת חבילה חדשה'}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">שם החבילה *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="input"
              required
              placeholder="למשל: חבילת אימונים שבועית"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">מחיר (₪) *</label>
            <input
              type="number"
              value={formData.priceNis}
              onChange={(e) => setFormData(prev => ({ ...prev, priceNis: Number(e.target.value) }))}
              className="input"
              required
              min="1"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">תיאור החבילה *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="input resize-none"
            required
            placeholder="תיאור מפורט של החבילה ומה היא כוללת..."
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">סטטוס</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'draft' | 'expired' }))}
              className="input"
            >
              <option value="draft">📝 טיוטה</option>
              <option value="active">🎯 פעיל</option>
              <option value="expired">⏰ פג תוקף</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">תוקף עד (אופציונלי)</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">אירועים בחבילה * (בחר {formData.eventIds.length})</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto border border-gray-600 rounded-lg p-3">
            {activeEvents.map((event) => (
              <label key={event.id} className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.eventIds.includes(event.id)}
                  onChange={() => toggleEvent(event.id)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(event.startAt).toLocaleDateString('he-IL')} • ₪{event.priceNis}
                  </div>
                </div>
              </label>
            ))}
          </div>
          {formData.eventIds.length === 0 && (
            <p className="text-sm text-red-400 mt-2">נא לבחור לפחות אירוע אחד</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-3">
            אירועי חלופה (אופציונלי) - בחר {formData.replacementEventIds.length}
          </label>
          <p className="text-xs text-gray-400 mb-3">
            אירועים שיוחלפו אוטומטיט אם אירוע בחבילה לא זמין
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border border-gray-600 rounded-lg p-3">
            {activeEvents.filter(e => !formData.eventIds.includes(e.id)).map((event) => (
              <label key={event.id} className="flex items-center gap-3 p-2 hover:bg-gray-800/50 rounded cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.replacementEventIds.includes(event.id)}
                  onChange={() => toggleEvent(event.id, true)}
                  className="w-4 h-4"
                />
                <div className="flex-1">
                  <div className="font-medium text-sm">{event.title}</div>
                  <div className="text-xs text-gray-400">
                    {new Date(event.startAt).toLocaleDateString('he-IL')} • ₪{event.priceNis}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 rounded border-2 border-dashed border-gray-600">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={formData.publish}
              onChange={(e) => setFormData(prev => ({ ...prev, publish: e.target.checked }))}
              className="w-5 h-5 rounded"
            />
            <div>
              <label className="text-base font-medium cursor-pointer">
                🌐 פרסם את החבילה באתר
              </label>
              <p className="text-sm text-gray-400 mt-1">
                {formData.publish 
                  ? '✅ החבילה תופיע באתר למכירה' 
                  : '❌ החבילה תישמר כטיוטה'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button 
            type="submit" 
            disabled={loading || !currentUser || formData.eventIds.length === 0} 
            className="btn"
          >
            {loading ? 'שומר...' : bundle ? 'עדכון' : 'יצירה'}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}