'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase.client';
import { onAuthStateChanged } from 'firebase/auth';
import { Calendar, MapPin, Users, DollarSign, Eye, CheckCircle, XCircle, AlertCircle, ChevronDown, ChevronUp, UserCheck, Download, Mail, RotateCcw } from 'lucide-react';
import { formatGroupsDisplay } from '@/utils/groups';

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
}

interface PastEventWithStats extends Event {
  registrations: Registration[];
  registeredCount: number;
  revenue: number;
}

export default function PastEventsManager() {
  const [pastEvents, setPastEvents] = useState<PastEventWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      console.log('🔐 Past Events - Auth state:', user ? user.email : 'Not logged in');
      setCurrentUser(user);
    });

    loadPastEvents();
    return () => unsubscribe();
  }, [statusFilter]);

  const loadPastEvents = async () => {
    try {
      console.log('Loading past events (completed/cancelled)...');
      
      // Load events with completed or cancelled status
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const allEventsData = eventsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Event[];
      
      // Filter to show only completed and cancelled events
      let filteredEvents = allEventsData.filter(event => 
        event.status === 'completed' || event.status === 'cancelled'
      );

      // Apply status filter
      if (statusFilter !== 'all') {
        filteredEvents = filteredEvents.filter(event => event.status === statusFilter);
      }

      // Load all registrations
      const registrationsSnapshot = await getDocs(collection(db, 'registrations'));
      const registrationsData = registrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Registration[];

      // Combine events with registration stats
      const eventsWithStats: PastEventWithStats[] = filteredEvents.map(event => {
        const eventRegistrations = registrationsData.filter(reg => 
          reg.eventId === event.id && reg.status !== 'cancelled'
        );
        
        const registeredCount = eventRegistrations.length;
        const revenue = eventRegistrations.reduce((sum, reg) => 
          sum + (reg.paymentStatus === 'paid' ? event.price : 0), 0
        );

        return {
          ...event,
          registrations: eventRegistrations,
          registeredCount,
          revenue
        };
      });

      // Sort by completion/cancellation date, then creation date
      eventsWithStats.sort((a, b) => {
        const aDate = a.completedAt ? new Date(a.completedAt.toDate ? a.completedAt.toDate() : a.completedAt) : new Date(a.createdAt?.toDate?.() || a.createdAt);
        const bDate = b.completedAt ? new Date(b.completedAt.toDate ? b.completedAt.toDate() : b.completedAt) : new Date(b.createdAt?.toDate?.() || b.createdAt);
        return bDate.getTime() - aDate.getTime();
      });

      console.log(`📊 Loaded ${eventsWithStats.length} past events`);
      setPastEvents(eventsWithStats);
    } catch (error) {
      console.error('Error loading past events:', error);
      alert('שגיאה בטעינת אירועי העבר: ' + (error as any).message);
    } finally {
      setLoading(false);
    }
  };

  const restoreEvent = async (eventId: string) => {
    if (!confirm('האם אתה בטוח שברצונך להחזיר את האירוע לרשימת האירועים הפעילים?')) return;
    
    try {
      console.log('🔄 Restoring event to active:', eventId);
      await updateDoc(doc(db, 'events', eventId), {
        status: 'active',
        updatedAt: new Date()
      });
      
      alert('האירוע הוחזר לרשימת האירועים הפעילים ✅');
      loadPastEvents();
    } catch (error) {
      console.error('Error restoring event:', error);
      alert('שגיאה בהחזרת האירוע: ' + (error as any).message);
    }
  };

  const exportAttendees = (event: PastEventWithStats) => {
    if (event.registrations.length === 0) {
      alert('אין נרשמים לאירוע זה');
      return;
    }

    const csvContent = [
      ['שם', 'אימייל', 'טלפון', 'סטטוס הרשמה', 'סטטוס תשלום', 'תאריך הרשמה'].join(','),
      ...event.registrations.map(reg => [
        reg.userName || '',
        reg.userEmail || '',
        reg.userPhone || '',
        reg.status === 'confirmed' ? 'מאושר' : reg.status === 'pending' ? 'ממתין' : 'בוטל',
        reg.paymentStatus === 'paid' ? 'שולם' : reg.paymentStatus === 'pending' ? 'ממתין לתשלום' : 'חינם',
        reg.registeredAt ? new Date(reg.registeredAt.toDate ? reg.registeredAt.toDate() : reg.registeredAt).toLocaleDateString('he-IL') : ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${event.title}-attendees.csv`;
    link.click();
  };

  const formatEventDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('he-IL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-blue-900/50 text-blue-300 border border-blue-500/30">
            ✅ הושלם בהצלחה
          </span>
        );
      case 'cancelled':
        return (
          <span className="px-2 py-1 rounded text-xs font-medium bg-red-900/50 text-red-300 border border-red-500/30">
            ❌ בוטל
          </span>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mx-auto"></div>
        <div className="mt-2">טוען אירועי עבר...</div>
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
      {/* Debug info */}
      <div className="bg-gray-800 p-3 rounded text-sm">
        <div>סטטוס אותנטיקציה: {currentUser ? '✅ מחובר' : '❌ לא מחובר'}</div>
        {currentUser && <div>משתמש: {currentUser.email}</div>}
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך אירועי עבר</p>
              <p className="text-2xl font-bold">{pastEvents.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">אירועים שהושלמו</p>
              <p className="text-2xl font-bold">{pastEvents.filter(e => e.status === 'completed').length}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">אירועים שבוטלו</p>
              <p className="text-2xl font-bold">{pastEvents.filter(e => e.status === 'cancelled').length}</p>
            </div>
            <XCircle className="w-8 h-8 text-red-400" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך נרשמים</p>
              <p className="text-2xl font-bold">{pastEvents.reduce((sum, e) => sum + e.registeredCount, 0)}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Filter and Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">אירועי עבר</h2>
          <p className="text-gray-400 text-sm">אירועים שהושלמו או בוטלו</p>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as 'all' | 'completed' | 'cancelled')}
            className="input text-sm"
          >
            <option value="all">כל האירועים</option>
            <option value="completed">הושלמו בלבד</option>
            <option value="cancelled">בוטלו בלבד</option>
          </select>
        </div>
      </div>

      {!currentUser && (
        <div className="bg-red-900/50 text-red-300 p-4 rounded">
          יש להתחבר כדי לצפות באירועי העבר
        </div>
      )}

      <div className="grid gap-6">
        {pastEvents.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">אין אירועי עבר</h3>
            <p className="text-gray-400 mb-4">
              {statusFilter === 'completed' && 'אין אירועים שהושלמו עדיין'}
              {statusFilter === 'cancelled' && 'אין אירועים שבוטלו'}
              {statusFilter === 'all' && 'אין אירועי עבר במערכת'}
            </p>
          </div>
        ) : (
          pastEvents.map((event) => (
            <div key={event.id} className="card">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{event.title}</h3>
                    
                    {getStatusBadge(event.status)}
                    
                    {/* Registration Stats Badge */}
                    {event.registeredCount > 0 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-purple-900/50 text-purple-300 border border-purple-500/30">
                        👥 {event.registeredCount} נרשמים
                      </span>
                    )}

                    {/* Revenue Badge */}
                    {event.revenue > 0 && (
                      <span className="px-2 py-1 rounded text-xs font-medium bg-green-900/50 text-green-300 border border-green-500/30">
                        💰 ₪{event.revenue.toLocaleString()}
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
                      <span>עד {event.maxParticipants} משתתפים</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign size={16} />
                      <span>{event.price === 0 ? 'חינם' : `₪${event.price}`}</span>
                    </div>
                    {event.groups && event.groups.length > 0 && (
                      <div className="flex items-center gap-1">
                        <Users size={16} />
                        <span className="text-purple-300">{formatGroupsDisplay(event.groups)}</span>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {event.registeredCount > 0 && (
                    <>
                      <button
                        onClick={() => exportAttendees(event)}
                        className="p-2 hover:bg-gray-700 rounded text-blue-400"
                        title="ייצוא רשימת נרשמים"
                      >
                        <Download size={18} />
                      </button>
                      
                      <button
                        onClick={() => {
                          const emails = event.registrations.map(reg => reg.userEmail).join(',');
                          const subject = `עדכון לגבי האירוע: ${event.title}`;
                          const body = `שלום,\n\nזהו עדכון לגבי האירוע "${event.title}" ב${formatEventDate(event.date)}.\n\nבברכה,\nהצוות`;
                          window.open(`mailto:${emails}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`);
                        }}
                        className="p-2 hover:bg-gray-700 rounded text-purple-400"
                        title="שלח אימייל לנרשמים"
                      >
                        <Mail size={18} />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => setExpandedEvent(expandedEvent === event.id ? null : event.id)}
                    className="p-2 hover:bg-gray-700 rounded text-orange-400"
                    title={event.registeredCount > 0 ? "הצג נרשמים" : "פרטים נוספים"}
                  >
                    {expandedEvent === event.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                  </button>

                  <button
                    onClick={() => restoreEvent(event.id)}
                    className="p-2 hover:bg-gray-700 rounded text-green-400"
                    title="החזר לאירועים פעילים"
                    disabled={!currentUser}
                  >
                    <RotateCcw size={18} />
                  </button>
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
                      <p>לא היו נרשמים לאירוע זה</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-sm">
                        <thead className="bg-gray-700">
                          <tr>
                            <th className="text-right py-2 px-3">שם</th>
                            <th className="text-right py-2 px-3">אימייל</th>
                            <th className="text-right py-2 px-3">טלפון</th>
                            <th className="text-right py-2 px-3">סטטוס</th>
                            <th className="text-right py-2 px-3">תשלום</th>
                            <th className="text-right py-2 px-3">הרשמה</th>
                          </tr>
                        </thead>
                        <tbody>
                          {event.registrations.map((registration) => (
                            <tr key={registration.id} className="border-b border-gray-700">
                              <td className="py-2 px-3">{registration.userName || 'לא צוין'}</td>
                              <td className="py-2 px-3">
                                <a href={`mailto:${registration.userEmail}`} className="text-blue-400 hover:underline">
                                  {registration.userEmail}
                                </a>
                              </td>
                              <td className="py-2 px-3">
                                {registration.userPhone ? (
                                  <a href={`tel:${registration.userPhone}`} className="text-green-400 hover:underline">
                                    {registration.userPhone}
                                  </a>
                                ) : (
                                  'לא צוין'
                                )}
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  registration.status === 'confirmed' 
                                    ? 'bg-green-900/50 text-green-300'
                                    : registration.status === 'pending'
                                    ? 'bg-yellow-900/50 text-yellow-300'
                                    : 'bg-red-900/50 text-red-300'
                                }`}>
                                  {registration.status === 'confirmed' ? 'מאושר' : 
                                   registration.status === 'pending' ? 'ממתין' : 'בוטל'}
                                </span>
                              </td>
                              <td className="py-2 px-3">
                                <span className={`px-2 py-1 rounded text-xs ${
                                  registration.paymentStatus === 'paid'
                                    ? 'bg-green-900/50 text-green-300'
                                    : registration.paymentStatus === 'pending'
                                    ? 'bg-yellow-900/50 text-yellow-300'
                                    : 'bg-gray-700 text-gray-300'
                                }`}>
                                  {registration.paymentStatus === 'paid' ? '✅ שולם' :
                                   registration.paymentStatus === 'pending' ? '⏳ ממתין' : '🆓 חינם'}
                                </span>
                              </td>
                              <td className="py-2 px-3 text-xs text-gray-400">
                                {registration.registeredAt 
                                  ? new Date(registration.registeredAt.toDate ? registration.registeredAt.toDate() : registration.registeredAt).toLocaleDateString('he-IL')
                                  : 'לא ידוע'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
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