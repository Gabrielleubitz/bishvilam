'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import { Calendar, Users, UserCheck, Clock, MapPin, RefreshCw, Search, Filter, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { Event, Registration, UserProfile } from '@/types';

interface EventWithRegistrations extends Event {
  registrations: (Registration & { userProfile?: UserProfile })[];
}

export default function EventAttendanceChecker() {
  const [events, setEvents] = useState<EventWithRegistrations[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'attendance' | 'title'>('date');

  useEffect(() => {
    loadAllEvents();
  }, []);

  const loadAllEvents = async () => {
    try {
      setLoading(true);
      console.log('🔍 Loading all events for attendance overview...');
      
      // Get all events
      const eventsQuery = query(collection(db, 'events'));
      const eventsSnapshot = await getDocs(eventsQuery);
      const eventsData: EventWithRegistrations[] = [];

      for (const eventDoc of eventsSnapshot.docs) {
        const data = eventDoc.data();
        const eventData: Event = {
          id: eventDoc.id,
          title: data.title,
          slug: (data.title || 'event').replace(/\s+/g, '-').toLowerCase(),
          description: data.description,
          startAt: new Date(data.date),
          endAt: new Date(data.date),
          locationName: data.location,
          capacity: data.maxParticipants,
          priceNis: data.price,
          cover: data.imageUrl || 'https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg',
          publish: data.publish,
          status: data.status || 'active',
          assignedTrainers: data.assignedTrainers || [],
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt)
        };

        // Get registrations for this event
        const registrationsQuery = query(
          collection(db, 'registrations'),
          where('eventId', '==', eventDoc.id)
        );
        
        const registrationsSnapshot = await getDocs(registrationsQuery);
        const registrations: (Registration & { userProfile?: UserProfile })[] = [];

        for (const regDoc of registrationsSnapshot.docs) {
          const regData = { id: regDoc.id, ...regDoc.data() } as any;
          
          // Skip cancelled registrations
          if (regData.status === 'cancelled') {
            continue;
          }
          
          // Get user profile for this registration
          try {
            // Check if uid exists and is valid before trying to get the document
            if (regData.uid && typeof regData.uid === 'string' && regData.uid.trim() !== '') {
              const userProfileDoc = await getDoc(doc(db, 'profiles', regData.uid));
              if (userProfileDoc.exists()) {
                regData.userProfile = userProfileDoc.data() as UserProfile;
              } else {
                console.warn(`User profile not found for uid: ${regData.uid}`);
              }
            } else {
              console.warn(`Registration ${regDoc.id} has invalid or missing uid:`, regData.uid);
            }
          } catch (error) {
            console.error(`Error loading user profile for registration ${regDoc.id} with uid ${regData.uid}:`, error);
          }

          registrations.push(regData);
        }
        
        eventsData.push({
          ...eventData,
          registrations
        });
      }

      // Sort events by start date (upcoming first)
      eventsData.sort((a, b) => {
        const dateA = a.startAt ? new Date(a.startAt).getTime() : 0;
        const dateB = b.startAt ? new Date(b.startAt).getTime() : 0;
        return dateA - dateB;
      });
      
      setEvents(eventsData);
      console.log(`📊 Loaded ${eventsData.length} events with registration data`);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEventStatus = (event: EventWithRegistrations) => {
    const now = new Date();
    const eventDate = new Date(event.startAt);
    
    if (!event.publish) return 'draft';
    if (event.status === 'completed') return 'completed';
    if (eventDate < now) return 'past';
    if (eventDate.toDateString() === now.toDateString()) return 'today';
    return 'upcoming';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-blue-400';
      case 'today': return 'text-green-400';
      case 'upcoming': return 'text-yellow-400';
      case 'past': return 'text-red-400';
      case 'draft': return 'text-gray-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'הושלם';
      case 'today': return 'היום';
      case 'upcoming': return 'קרוב';
      case 'past': return 'עבר';
      case 'draft': return 'טיוטה';
      default: return 'לא ידוע';
    }
  };

  const filteredEvents = events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.locationName?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const status = getEventStatus(event);
    return matchesSearch && status === statusFilter;
  });

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(a.startAt).getTime() - new Date(b.startAt).getTime();
      case 'attendance':
        const attendanceA = a.registrations.length > 0 
          ? (a.registrations.filter(r => r.checkedIn).length / a.registrations.length) * 100 
          : 0;
        const attendanceB = b.registrations.length > 0 
          ? (b.registrations.filter(r => r.checkedIn).length / b.registrations.length) * 100 
          : 0;
        return attendanceB - attendanceA;
      case 'title':
        return a.title.localeCompare(b.title, 'he');
      default:
        return 0;
    }
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green mb-4"></div>
        <div className="text-lg">טוען נתוני נוכחות...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="חיפוש אירועים..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pr-12 w-full"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">כל הסטטוסים</option>
            <option value="upcoming">קרובים</option>
            <option value="today">היום</option>
            <option value="completed">הושלמו</option>
            <option value="past">עברו</option>
            <option value="draft">טיוטות</option>
          </select>
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'attendance' | 'title')}
            className="input"
          >
            <option value="date">מיון לפי תאריך</option>
            <option value="attendance">מיון לפי נוכחות</option>
            <option value="title">מיון לפי שם</option>
          </select>
          
          <button
            onClick={loadAllEvents}
            disabled={loading}
            className="btn-outline"
            title="רענן נתונים"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך אירועים</p>
              <p className="text-2xl font-bold">{events.length}</p>
            </div>
            <Calendar className="w-8 h-8 text-brand-green" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך הרשמות</p>
              <p className="text-2xl font-bold">
                {events.reduce((total, event) => total + event.registrations.length, 0)}
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">סך נוכחות</p>
              <p className="text-2xl font-bold">
                {events.reduce((total, event) => 
                  total + event.registrations.filter(r => r.checkedIn).length, 0
                )}
              </p>
            </div>
            <UserCheck className="w-8 h-8 text-green-400" />
          </div>
        </div>
        
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">ממוצע נוכחות</p>
              <p className="text-2xl font-bold">
                {(() => {
                  const totalRegistrations = events.reduce((total, event) => total + event.registrations.length, 0);
                  const totalAttendance = events.reduce((total, event) => 
                    total + event.registrations.filter(r => r.checkedIn).length, 0
                  );
                  return totalRegistrations > 0 ? Math.round((totalAttendance / totalRegistrations) * 100) : 0;
                })()}%
              </p>
            </div>
            <BarChart3 className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </div>

      {/* Events List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">סקירת אירועים ({sortedEvents.length})</h3>
        </div>
        
        {sortedEvents.length === 0 ? (
          <div className="card text-center py-12">
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">לא נמצאו אירועים</h3>
            <p className="text-gray-400">נסה לשנות את הפילטרים או החיפוש</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {sortedEvents.map((event) => {
              const status = getEventStatus(event);
              const attendanceRate = event.registrations.length > 0 
                ? Math.round((event.registrations.filter(r => r.checkedIn).length / event.registrations.length) * 100)
                : 0;
              
              return (
                <div key={event.id} className="card hover:border-brand-green/50 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold">{event.title}</h3>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(status)}`}>
                          {getStatusText(status)}
                        </span>
                        {!event.publish && (
                          <span className="px-2 py-1 rounded text-xs font-medium bg-gray-700 text-gray-300">
                            לא פורסם
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-1 text-sm text-gray-300">
                        <div className="flex items-center gap-2">
                          <Calendar size={16} />
                          <span>{new Date(event.startAt).toLocaleDateString('he-IL', {
                            weekday: 'short',
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin size={16} />
                          <span>{event.locationName}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold text-brand-green">
                        {event.registrations.filter(r => r.checkedIn).length}
                      </div>
                      <div className="text-sm text-gray-400">
                        מתוך {event.registrations.length}
                      </div>
                      <div className="text-xs text-gray-500">נבדקו</div>
                    </div>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <Users size={16} />
                        {event.registrations.length} משתתפים
                      </span>
                      {event.registrations.length > 0 && (
                        <span className={`font-medium ${
                          attendanceRate >= 80 ? 'text-green-400' :
                          attendanceRate >= 60 ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {attendanceRate}% נוכחות
                        </span>
                      )}
                      {event.capacity && (
                        <span className="text-gray-400">
                          קיבולת: {event.capacity}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {event.registrations.length > 0 ? (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <CheckCircle size={14} />
                          <span>
                            {event.registrations.filter(r => r.checkedIn).length} נבדקו
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <XCircle size={14} />
                          <span>אין הרשמות</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}