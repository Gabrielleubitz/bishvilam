'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { onAuthStateChanged } from 'firebase/auth';
import { Plus, Edit, Trash2, Eye, EyeOff, Calendar, MapPin, Users, DollarSign, Download, Mail, Phone, ChevronDown, ChevronUp, UserCheck, AlertCircle, TrendingUp, X } from 'lucide-react';
import { HEBREW_LETTERS, ALL_GROUPS, formatGroupsDisplay } from '@/utils/groups';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  maxParticipants: number;
  price: number;
  publish: boolean;
  status: 'active' | 'completed' | 'cancelled' | 'draft';
  imageUrl?: string;
  groups?: string[];
  createdAt: any;
  completedAt?: any;
}

interface Registration {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone?: string;
  registeredAt: any;
  status: 'confirmed' | 'pending' | 'cancelled';
  paymentStatus: 'paid' | 'pending' | 'free';
  amountPaid?: number;
  paymentDate?: any;
}

interface EventWithStats extends Event {
  registrations: Registration[];
  registeredCount: number;
  availableSpots: number;
  revenue: number;
}

export default function EventManager() {
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('Current user:', user);
      setCurrentUser(user);
    });

    loadEvents();
    return () => unsubscribe();
  }, []);

  const loadEvents = async () => {
    try {
      console.log('Loading active/draft events with registrations...');
      
      // Load only active and draft events (exclude completed and cancelled)
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const allEventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      
      // Filter to show only active and draft events
      const eventsData = allEventsData.filter(event => 
        !event.status || event.status === 'active' || event.status === 'draft'
      );

      // Load all registrations
      const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
      const registrationsData = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];

      // Combine events with registration stats
      const eventsWithStats: EventWithStats[] = eventsData.map(event => {
        const eventRegistrations = registrationsData.filter(reg => 
          reg.eventId === event.id && reg.status !== 'cancelled'
        );
        
        const registeredCount = eventRegistrations.length;
        const availableSpots = Math.max(0, event.maxParticipants - registeredCount);
        const revenue = eventRegistrations.reduce((sum, reg) => {
          if (reg.paymentStatus === 'paid') {
            // Use actual amount paid if available, otherwise fall back to event price
            return sum + (reg.amountPaid !== undefined ? reg.amountPaid : event.price);
          }
          return sum;
        }, 0);

        return {
          ...event,
          registrations: eventRegistrations,
          registeredCount,
          availableSpots,
          revenue
        };
      });
      
      console.log('Events with stats:', eventsWithStats);
      setEvents(eventsWithStats.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error('Error loading events:', error);
      alert('שגיאה בטעינת האירועים: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const togglePublish = async (eventId: string, currentStatus: boolean) => {
    try {
      console.log('🔄 Toggling publish status:', eventId, 'from', currentStatus, 'to', !currentStatus);
      await updateDoc(doc(db, 'events', eventId), {
        publish: !currentStatus,
        updatedAt: new Date()
      });
      
      alert(!currentStatus ? 'האירוע פורסם בהצלחה! ✅' : 'האירוע הוסתר מהאתר ❌');
      loadEvents();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('שגיאה בעדכון האירוע: ' + (error as any).message);
    }
  };

  const updateEventStatus = async (eventId: string, newStatus: 'active' | 'completed' | 'cancelled' | 'draft') => {
    try {
      console.log('🔄 Updating event status:', eventId, 'to', newStatus);
      
      const updateData: any = {
        status: newStatus,
        updatedAt: new Date()
      };
      
      // Add completion date when marking as completed
      if (newStatus === 'completed') {
        updateData.completedAt = new Date();
      }
      
      await updateDoc(doc(db, 'events', eventId), updateData);
      
      const statusMessages = {
        'active': 'האירוע הופעל ויופיע במערכת ✅',
        'completed': 'האירוע סומן כהושלם ועבר לאירועי העבר ✅', 
        'cancelled': 'האירוע בוטל ועבר לאירועי העבר ❌',
        'draft': 'האירוע נשמר כטיוטה 📝'
      };
      
      alert(statusMessages[newStatus]);
      loadEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
      alert('שגיאה בעדכון סטטוס האירוע: ' + (error as any).message);
    }
  };

  const updatePaymentStatus = async (registrationId: string, newPaymentStatus: 'paid' | 'pending' | 'free', eventPrice?: number) => {
    try {
      console.log('💰 Updating payment status:', registrationId, 'to', newPaymentStatus);
      
      let updateData: any = {
        paymentStatus: newPaymentStatus,
        updatedAt: new Date()
      };
      
      // If switching to 'paid', ask for the actual amount paid
      if (newPaymentStatus === 'paid') {
        const defaultAmount = eventPrice || 0;
        const amountPaidStr = prompt(
          `כמה המשתמש שילם בפועל?\n\n` +
          `מחיר האירוע: ₪${defaultAmount}\n` +
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
      
      await updateDoc(doc(db, 'registrations', registrationId), updateData);
      
      const statusMessages = {
        'paid': `התשלום עודכן לשולם ✅${updateData.amountPaid ? ` (₪${updateData.amountPaid})` : ''}`,
        'pending': 'התשלום עודכן לממתין 🟡',
        'free': 'התשלום עודכן לחינם 🆓'
      };
      
      console.log('✅ Payment status updated successfully');
      alert(statusMessages[newPaymentStatus]);
      loadEvents(); // Reload to show updated status
    } catch (error) {
      console.error('❌ Error updating payment status:', error);
      alert('שגיאה בעדכון סטטוס התשלום: ' + (error as any).message);
    }
  };

  const removeRegistration = async (registrationId: string, userName: string, eventTitle: string) => {
    const confirmMessage = `האם אתה בטוח שברצונך למחוק את ההרשמה?\n\nמשתמש: ${userName}\nאירוע: ${eventTitle}\n\nפעולה זו אינה הפיכה!`;
    
    if (!confirm(confirmMessage)) {
      return;
    }
    
    try {
      console.log('🗑️ Removing registration:', registrationId);
      
      await deleteDoc(doc(db, 'registrations', registrationId));
      
      console.log('✅ Registration removed successfully');
      alert(`ההרשמה של ${userName} נמחקה בהצלחה ✅`);
      loadEvents(); // Reload to show updated registrations
    } catch (error) {
      console.error('❌ Error removing registration:', error);
      alert('שגיאה במחיקת ההרשמה: ' + (error as any).message);
    }
  };

  const deleteEvent = async (eventId: string) => {
    const event = events.find(e => e.id === eventId);
    if (!event) return;

    if (event.registeredCount > 0) {
      if (!confirm(`יש ${event.registeredCount} נרשמים לאירוע זה! האם אתה בטוח שברצונך למחוק אותו לצמיתות?\n\nכל ההרשמות לאירוע זה ימחקו גם כן!\n\nהמלצה: במקום מחיקה, סמן את האירוע כ"הושלם" או "בוטל"`)) return;
    } else {
      if (!confirm('האם אתה בטוח שברצונך למחוק את האירוע לצמיתות?')) return;
    }
    
    try {
      console.log('🗑️ Starting cascade deletion for event:', eventId);
      
      // First, delete all registrations for this event
      const registrationsToDelete = event.registrations;
      console.log(`🗑️ Found ${registrationsToDelete.length} registrations to delete`);
      
      for (const registration of registrationsToDelete) {
        try {
          console.log(`🗑️ Deleting registration ${registration.id} for user ${registration.userEmail}`);
          await deleteDoc(doc(db, 'registrations', registration.id));
        } catch (regError) {
          console.error(`❌ Error deleting registration ${registration.id}:`, regError);
          // Continue with other deletions even if one fails
        }
      }
      
      // Then delete the event itself
      console.log('🗑️ Deleting event document:', eventId);
      await deleteDoc(doc(db, 'events', eventId));
      
      console.log('✅ Event and all registrations deleted successfully');
      alert(`האירוع "${event.title}" ו-${registrationsToDelete.length} ההרשמות שלו נמחקו בהצלחה`);
      loadEvents();
    } catch (error) {
      console.error('❌ Error during cascade deletion:', error);
      alert('שגיאה במחיקת האירוע וההרשמות: ' + (error as any).message);
    }
  };

  const exportAttendees = (event: EventWithStats) => {
    const csvContent = [
      ['שם', 'אימייל', 'טלפון', 'תאריך הרשמה', 'סטטוס תשלום', 'סכום ששולם', 'תאריך תשלום'],
      ...event.registrations.map(reg => [
        reg.userName,
        reg.userEmail, 
        reg.userPhone || '',
        new Date(reg.registeredAt?.toDate?.() || reg.registeredAt).toLocaleDateString('he-IL'),
        reg.paymentStatus === 'paid' ? 'שולם' : reg.paymentStatus === 'pending' ? 'ממתין' : 'חינם',
        reg.paymentStatus === 'paid' && reg.amountPaid !== undefined ? `₪${reg.amountPaid}` : '',
        reg.paymentStatus === 'paid' && reg.paymentDate ? new Date(reg.paymentDate?.toDate?.() || reg.paymentDate).toLocaleDateString('he-IL') : ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title}-attendees.csv`;
    link.click();
  };

  const sendEventEmail = (event: EventWithStats) => {
    const emails = event.registrations.map(reg => reg.userEmail).join(',');
    const subject = `עדכון לגבי האירוע: ${event.title}`;
    const body = `שלום,\n\nזהו עדכון לגבי האירוע "${event.title}" ב${formatEventDate(event.date)}.\n\nבברכה,\nהצוות`;
    
    window.open(`mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div>טוען אירועים...</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך אירועים</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">אירועים פעילים</p>
              <p className="text-2xl font-bold">{events.filter(e => e.publish).length}</p>
            </div>
            <Eye className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך נרשמים</p>
              <p className="text-2xl font-bold">{events.reduce((sum, e) => sum + e.registeredCount, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך הכנסות</p>
              <p className="text-2xl font-bold">₪{events.reduce((sum, e) => sum + e.revenue, 0)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-yellow-400" />
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">ניהול אירועים</h2>
        <button
          onClick={() => setShowCreateForm(true)}
          className="btn flex items-center gap-2"
          disabled={!currentUser}
        >
          <Plus size={20} />
          יצירת אירוע חדש
        </button>
      </div>

      {!currentUser && (
        <div className="bg-red-900/50 text-red-300 p-4 rounded">
          יש להתחבר כדי לנהל אירועים
        </div>
      )}

      {showCreateForm && (
        <EventForm
          currentUser={currentUser}
          onCancel={() => setShowCreateForm(false)}
          onSuccess={() => {
            setShowCreateForm(false);
            loadEvents();
          }}
        />
      )}

      {editingEvent && (
        <EventForm
          event={editingEvent}
          currentUser={currentUser}
          onCancel={() => setEditingEvent(null)}
          onSuccess={() => {
            setEditingEvent(null);
            loadEvents();
          }}
        />
      )}

      <div className="grid gap-6">
        {events.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין אירועים</h3>
            <p className="text-gray-400 mb-4">צור את האירוע הראשון שלך</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn"
              disabled={!currentUser}
            >
              יצירת אירוע חדש
            </button>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="card">
              <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-3 mb-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.publish 
                          ? 'bg-green-900/50 text-green-300 border border-green-500/30' 
                          : 'bg-gray-700 text-gray-300 border border-gray-600'
                      }`}>
                        {event.publish ? '✅ פורסם באתר' : '❌ טיוטה'}
                      </span>
                    
                      {/* Event Status Badge */}
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.status === 'completed' 
                          ? 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
                          : event.status === 'cancelled'
                          ? 'bg-red-900/50 text-red-300 border border-red-500/30'
                          : event.status === 'draft'
                          ? 'bg-gray-700 text-gray-300 border border-gray-600'
                          : 'bg-green-900/50 text-green-300 border border-green-500/30'
                      }`}>
                        {event.status === 'completed' && '✅ הושלם'}
                        {event.status === 'cancelled' && '❌ בוטל'}
                        {event.status === 'draft' && '📝 טיוטה'}
                        {(!event.status || event.status === 'active') && '🎯 פעיל'}
                      </span>
                    </div>
                    
                    {/* Registration Status Badge */}
                    {event.registeredCount > 0 && (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        event.availableSpots === 0 
                          ? 'bg-red-900/50 text-red-300 border border-red-500/30'
                          : event.availableSpots < 5
                          ? 'bg-yellow-900/50 text-yellow-300 border border-yellow-500/30'
                          : 'bg-blue-900/50 text-blue-300 border border-blue-500/30'
                      }`}>
                        {event.availableSpots === 0 
                          ? '🚫 מלא'
                          : `👥 ${event.registeredCount}/${event.maxParticipants}`
                        }
                      </span>
                    )}
                  </div>
                  
                  <p className="text-gray-300 mb-4 line-clamp-2">{event.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Calendar size={16} />
                      <span>{formatEventDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin size={16} />
                      <span>{event.location}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span className={event.availableSpots === 0 ? 'text-red-400' : ''}>
                        {event.registeredCount}/{event.maxParticipants} נרשמו
                        {event.availableSpots > 0 && ` (${event.availableSpots} מקומות נותרו)`}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} />
                      <span>₪{event.price}</span>
                      {event.revenue > 0 && (
                        <span className="text-green-400 mr-2">(הכנסה: ₪{event.revenue})</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={16} />
                      <span className="text-purple-300">{formatGroupsDisplay(event.groups)}</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col gap-3">
                  {/* Primary Actions Row - Stack on mobile */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-end">
                    <button
                      onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                      className="btn-outline text-sm px-3 py-1.5 flex items-center justify-center gap-2 w-full sm:w-auto"
                    >
                      {expandedEvent === event.id ? (
                        <>
                          <ChevronUp size={16} />
                          סגור פרטים
                        </>
                      ) : (
                        <>
                          <ChevronDown size={16} />
                          {event.registeredCount > 0 ? `הצג נרשמים (${event.registeredCount})` : 'פרטים נוספים'}
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => setEditingEvent(event)}
                      className="btn text-sm px-3 py-1.5 flex items-center justify-center gap-2 w-full sm:w-auto"
                      disabled={!currentUser}
                    >
                      <Edit size={16} />
                      ערוך
                    </button>
                  </div>

                  {/* Secondary Actions Row - Stack everything on mobile */}
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                      {/* Publishing Controls */}
                      <div className="flex items-center gap-1 bg-gray-800/50 rounded-md p-1">
                        <button
                          onClick={() => togglePublish(event.id, event.publish)}
                          className={`text-xs px-2 py-1 rounded flex items-center gap-1 transition-colors ${
                            event.publish 
                              ? 'bg-red-900/50 text-red-300 hover:bg-red-800/50' 
                              : 'bg-green-900/50 text-green-300 hover:bg-green-800/50'
                          }`}
                          disabled={!currentUser}
                        >
                          {event.publish ? <EyeOff size={14} /> : <Eye size={14} />}
                          {event.publish ? 'הסתר' : 'פרסם'}
                        </button>
                        
                        {event.publish && (
                          <a
                            href={`/events/${encodeURIComponent((event.title || 'event').replace(/\s+/g, '-').toLowerCase())}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300 hover:bg-purple-800/50 flex items-center gap-1"
                            title="צפה באתר"
                          >
                            <Eye size={14} />
                            צפה
                          </a>
                        )}
                      </div>

                      {/* Registration Management */}
                      {event.registeredCount > 0 && (
                        <div className="flex items-center gap-1 bg-gray-800/50 rounded-md p-1">
                          <button
                            onClick={() => exportAttendees(event)}
                            className="text-xs px-2 py-1 rounded bg-blue-900/50 text-blue-300 hover:bg-blue-800/50 flex items-center gap-1"
                            title="ייצוא לקובץ CSV"
                          >
                            <Download size={14} />
                            ייצוא
                          </button>
                          
                          <button
                            onClick={() => sendEventEmail(event)}
                            className="text-xs px-2 py-1 rounded bg-purple-900/50 text-purple-300 hover:bg-purple-800/50 flex items-center gap-1"
                            title="שלח אימייל לכל הנרשמים"
                          >
                            <Mail size={14} />
                            מייל
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 justify-center lg:justify-end">
                      {/* Status Control Dropdown */}
                      <div className="relative group">
                        <button
                          className="text-xs px-2 py-1 rounded bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800/50 flex items-center gap-1"
                          disabled={!currentUser}
                        >
                          <AlertCircle size={14} />
                          שנה סטטוס
                        </button>
                        
                        <div className="absolute left-0 top-full mt-1 bg-gray-800 border border-gray-600 rounded shadow-lg z-10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all min-w-[140px]">
                          <button
                            onClick={() => updateEventStatus(event.id, 'active')}
                            className="w-full text-right px-3 py-2 hover:bg-gray-700 text-green-400 text-xs"
                            disabled={!currentUser || event.status === 'active'}
                          >
                            🎯 הפעל
                          </button>
                          <button
                            onClick={() => updateEventStatus(event.id, 'completed')}
                            className="w-full text-right px-3 py-2 hover:bg-gray-700 text-blue-400 text-xs"
                            disabled={!currentUser || event.status === 'completed'}
                          >
                            ✅ הושלם
                          </button>
                          <button
                            onClick={() => updateEventStatus(event.id, 'cancelled')}
                            className="w-full text-right px-3 py-2 hover:bg-gray-700 text-red-400 text-xs"
                            disabled={!currentUser || event.status === 'cancelled'}
                          >
                            ❌ בטל
                          </button>
                          <button
                            onClick={() => updateEventStatus(event.id, 'draft')}
                            className="w-full text-right px-3 py-2 hover:bg-gray-700 text-gray-400 text-xs"
                            disabled={!currentUser || event.status === 'draft'}
                          >
                            📝 טיוטה
                          </button>
                        </div>
                      </div>
                      
                      {/* Delete Button - Separated and More Prominent */}
                      <button
                        onClick={() => deleteEvent(event.id)}
                        className="text-xs px-2 py-1 rounded bg-red-900/50 text-red-300 hover:bg-red-800/50 flex items-center gap-1"
                        disabled={!currentUser}
                        title="מחיקה סופית של האירוע וכל ההרשמות"
                      >
                        <Trash2 size={14} />
                        מחק
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Section - Registrations List */}
              {expandedEvent === event.id && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <UserCheck size={16} />
                    רשימת נרשמים ({event.registeredCount})
                  </h4>
                  
                  {event.registrations.length === 0 ? (
                    <div className="text-gray-400 text-center py-4">
                      <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                      <p>אין נרשמים לאירוע זה עדיין</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {event.registrations.map((registration) => (
                        <div key={registration.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-3 bg-gray-800/50 rounded">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              registration.status === 'confirmed' ? 'bg-green-400' :
                              registration.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                            }`} />
                            <div>
                              <div className="font-medium">{registration.userName}</div>
                              <div className="text-sm text-gray-400 break-all">{registration.userEmail}</div>
                              {registration.userPhone && (
                                <div className="text-sm text-gray-400">{registration.userPhone}</div>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap items-center gap-3 justify-end sm:justify-start">
                            {/* Payment Status Dropdown */}
                            <div className="text-left">
                              <select
                                value={registration.paymentStatus}
                                onChange={(e) => updatePaymentStatus(registration.id, e.target.value as 'paid' | 'pending' | 'free', event.price)}
                                disabled={!currentUser}
                                className={`text-sm px-2 py-1 rounded border-0 cursor-pointer ${
                                  registration.paymentStatus === 'paid' ? 'bg-green-900/50 text-green-300' :
                                  registration.paymentStatus === 'pending' ? 'bg-yellow-900/50 text-yellow-300' :
                                  'bg-gray-700 text-gray-300'
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
                                        {new Date(registration.paymentDate?.toDate?.() || registration.paymentDate).toLocaleDateString('he-IL')}
                                      </div>
                                    )}
                                  </div>
                                ) : (
                                  <div>
                                    {new Date(registration.registeredAt?.toDate?.() || registration.registeredAt).toLocaleDateString('he-IL')}
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            {/* Contact Actions */}
                            <div className="flex gap-1">
                              <a
                                href={`mailto:${registration.userEmail}`}
                                className="p-1.5 hover:bg-gray-700 rounded text-blue-400 text-xs"
                                title="שלח אימייל"
                              >
                                <Mail size={14} />
                              </a>
                              {registration.userPhone && (
                                <a
                                  href={`tel:${registration.userPhone}`}
                                  className="p-1.5 hover:bg-gray-700 rounded text-green-400 text-xs"
                                  title="התקשר"
                                >
                                  <Phone size={14} />
                                </a>
                              )}
                              
                              {/* Remove Registration Button */}
                              <button
                                onClick={() => removeRegistration(registration.id, registration.userName, event.title)}
                                disabled={!currentUser}
                                className="p-1.5 hover:bg-gray-700 rounded text-red-400 text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                                title="מחק הרשמה"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
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

// Helper function to format event date in Hebrew
function formatEventDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return dateStr;
  }
}

// Helper function to format date for input field
function formatDateForInput(dateStr: string): { date: string; time: string } {
  try {
    if (!dateStr) {
      const now = new Date();
      const date = now.toISOString().split('T')[0];
      const time = now.toTimeString().slice(0, 5);
      return { date, time };
    }
    
    const dateObj = new Date(dateStr);
    const date = dateObj.toISOString().split('T')[0];
    const time = dateObj.toTimeString().slice(0, 5);
    return { date, time };
  } catch (error) {
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const time = now.toTimeString().slice(0, 5);
    return { date, time };
  }
}

// Helper function to combine date and time
function combineDateAndTime(date: string, time: string): string {
  if (!date || !time) {
    return new Date().toISOString();
  }
  return new Date(`${date}T${time}`).toISOString();
}

function EventForm({ event, currentUser, onCancel, onSuccess }: {
  event?: Event;
  currentUser: any;
  onCancel: () => void;
  onSuccess: () => void;
}) {
  const initialDateTime = formatDateForInput(event?.date || '');
  
  const [formData, setFormData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    date: initialDateTime.date,
    time: initialDateTime.time,
    location: event?.location || '',
    maxParticipants: event?.maxParticipants || 20,
    price: event?.price || 0,
    publish: event?.publish ?? false,
    status: event?.status || 'draft',
    imageUrl: event?.imageUrl || '',
    groups: event?.groups || ['ALL']
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, type } = e.target;
    
    if (type === 'checkbox') {
      const checkboxTarget = e.target as HTMLInputElement;
      console.log(`📋 Checkbox ${name} changed to:`, checkboxTarget.checked);
      setFormData(prev => ({
        ...prev,
        [name]: checkboxTarget.checked
      }));
    } else {
      const value = e.target.value;
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentUser) {
      alert('יש להתחבר כדי ליצור אירוע');
      return;
    }
    
    // Validate required fields
    if (!formData.title.trim()) {
      alert('נא להזין כותרת לאירוע');
      return;
    }
    
    if (!formData.description.trim()) {
      alert('נא להזין תיאור לאירוע');
      return;
    }
    
    if (!formData.date) {
      alert('נא לבחור תאריך לאירוע');
      return;
    }
    
    if (!formData.time) {
      alert('נא לבחור שעה לאירוע');
      return;
    }
    
    if (!formData.location.trim()) {
      alert('נא להזין מיקום לאירוע');
      return;
    }

    setLoading(true);

    try {
      console.log('💾 Saving event with publish status:', formData.publish);
      
      const eventData = {
        title: formData.title.trim(),
        description: formData.description.trim(),
        date: combineDateAndTime(formData.date, formData.time),
        location: formData.location.trim(),
        maxParticipants: Math.max(1, Number(formData.maxParticipants) || 20),
        price: Math.max(0, parseFloat(formData.price.toString()) || 0),
        publish: Boolean(formData.publish),
        status: formData.status,
        imageUrl: formData.imageUrl.trim(),
        groups: formData.groups,
        updatedAt: new Date(),
        createdBy: currentUser.uid
      };

      console.log('💾 Event data to save:', eventData);

      if (event) {
        console.log('🔄 Updating existing event:', event.id);
        await updateDoc(doc(db, 'events', event.id), eventData);
      } else {
        console.log('✨ Creating new event');
        await addDoc(collection(db, 'events'), {
          ...eventData,
          createdAt: new Date()
        });
      }

      const action = event ? 'עודכן' : 'נוצר';
      const publishStatus = formData.publish ? 'ופורסם באתר' : 'כטיוטה';
      alert(`✅ האירוע ${action} בהצלחה ${publishStatus}!`);

      onSuccess();
    } catch (error) {
      console.error('❌ Error saving event:', error);
      const errorMessage = (error as any).message || error;
      alert('שגיאה בשמירת האירוע: ' + errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">
        {event ? 'עריכת אירוע' : 'יצירת אירוע חדש'}
      </h3>
      
      {!currentUser && (
        <div className="bg-red-900/50 text-red-300 p-3 rounded mb-4">
          יש להתחבר כדי ליצור אירוע
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">כותרת האירוע *</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input"
            required
            placeholder="למשל: אימון סיבולת וכוח"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">תיאור האירוע *</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="input resize-none"
            required
            placeholder="תיאור מפורט של האירוע..."
          />
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">תאריך האירוע *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              className="input"
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">שעת האירוע *</label>
            <input
              type="time"
              name="time"
              value={formData.time}
              onChange={handleChange}
              className="input"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">מיקום *</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="input"
              required
              placeholder="למשל: בוש עציון - מרכז האימון"
            />
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">מספר משתתפים מקסימלי</label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              className="input"
              min="1"
              max="100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">מחיר (₪)</label>
            <input
              type="number"
              step="0.5"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="input"
              min="0"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">תמונת האירוע (URL)</label>
          <input
            type="url"
            name="imageUrl"
            value={formData.imageUrl}
            onChange={handleChange}
            className="input"
            placeholder="https://example.com/image.jpg"
          />
        </div>

        {/* Groups Selection */}
        <div>
          <label className="block text-sm font-medium mb-3">קבוצות נראות</label>
          <EventGroupSelector
            selectedGroups={formData.groups}
            onChange={(groups) => setFormData(prev => ({ ...prev, groups }))}
          />
        </div>

        {/* Event Status Selection */}
        <div>
          <label className="block text-sm font-medium mb-2">סטטוס האירוע</label>
          <select
            name="status"
            value={formData.status}
            onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'completed' | 'cancelled' | 'draft' }))}
            className="input"
            required
          >
            <option value="draft">📝 טיוטה - לא מוכן לפרסום</option>
            <option value="active">🎯 פעיל - זמין להרשמה</option>
            <option value="completed">✅ הושלם - האירוע התקיים</option>
            <option value="cancelled">❌ בוטל - האירוע בוטל</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            {formData.status === 'draft' && 'האירוע יישמר כטיוטה ולא יופיע באתר'}
            {formData.status === 'active' && 'האירוע זמין לצפייה והרשמה באתר'}
            {formData.status === 'completed' && 'האירוע יעבור לאירועי העבר ולא יהיה זמין להרשמה'}
            {formData.status === 'cancelled' && 'האירוע יעבור לאירועי העבר עם סטטוס "בוטל"'}
          </p>
        </div>

        <div className="bg-gray-800/50 p-4 rounded border-2 border-dashed border-gray-600">
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              name="publish"
              id="publish"
              checked={formData.publish}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-600 focus:ring-blue-500"
            />
            <div>
              <label htmlFor="publish" className="text-base font-medium cursor-pointer">
                🌐 פרסם את האירוע באתר
              </label>
              <p className="text-sm text-gray-400 mt-1">
                {formData.publish 
                  ? '✅ האירוע יופיע באתר לגולשים' 
                  : '❌ האירוע יישמר כטיוטה ולא יופיע באתר'
                }
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-4">
          <button type="submit" disabled={loading || !currentUser} className="btn">
            {loading ? 'שומר...' : event ? 'עדכון' : 'יצירה'}
          </button>
          <button type="button" onClick={onCancel} className="btn-outline">
            ביטול
          </button>
        </div>
      </form>
    </div>
  );
}

// Event Group Selector Component
function EventGroupSelector({ selectedGroups = ['ALL'], onChange }: {
  selectedGroups: string[];
  onChange: (groups: string[]) => void;
}) {
  const [isAllGroups, setIsAllGroups] = useState(selectedGroups.includes(ALL_GROUPS));

  const handleAllGroupsToggle = (checked: boolean) => {
    setIsAllGroups(checked);
    if (checked) {
      onChange([ALL_GROUPS]);
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
        : [...selectedGroups.filter(g => g !== ALL_GROUPS), group];
      onChange(newGroups);
    }
  };

  return (
    <div className="space-y-4 bg-gray-800/50 p-4 rounded border border-gray-600">
      {/* All Groups Toggle */}
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          id="all-groups"
          checked={isAllGroups}
          onChange={(e) => handleAllGroupsToggle(e.target.checked)}
          className="w-4 h-4 text-brand-green bg-gray-700 border-gray-600 rounded focus:ring-brand-green focus:ring-2"
        />
        <label htmlFor="all-groups" className="text-sm font-medium cursor-pointer flex items-center gap-2">
          <Users size={16} />
          כל הקבוצות (נראה לכל המשתמשים)
        </label>
      </div>

      {!isAllGroups && (
        <div>
          <p className="text-sm text-gray-400 mb-3">בחר קבוצות ספציפיות שיכולות לראות את האירוע:</p>
          <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-8 gap-2">
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
        <span className="font-medium">נבחר:</span> {formatGroupsDisplay(selectedGroups)}
      </div>
    </div>
  );
}