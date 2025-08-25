'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import EventCard from '@/components/EventCard';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import { Event, UserProfile } from '@/types';
import { Search, Filter, Calendar } from 'lucide-react';
import { getVisibleKeys } from '@/utils/groups';

interface EventWithRegistration extends Event {
  isRegistered?: boolean;
  registrationCount?: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventWithRegistration[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventWithRegistration[]>([]);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('🔐 Auth state changed in events list:', user ? user.email : 'Not logged in');
      setCurrentUser(user);
      
      // Load user profile if user is logged in
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'profiles', user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      } else {
        setUserProfile(null);
      }
    });

    loadEvents();
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (events.length > 0 && currentUser) {
      checkRegistrationStatus();
    }
  }, [events.length, currentUser?.uid]);

  // Reload events when user profile changes (for group filtering)
  useEffect(() => {
    if (userProfile !== null || currentUser === null) {
      loadEvents();
    }
  }, [userProfile?.groups, currentUser?.uid]);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, locationFilter, dateFilter]);

  const loadEvents = async () => {
    try {
      console.log('🔍 Loading events...');
      
      // Determine if we need group-based filtering
      const shouldFilterByGroups = currentUser && userProfile && userProfile.role === 'student' && userProfile.groups;
      console.log('📊 Group filtering:', { shouldFilterByGroups, userGroups: userProfile?.groups });
      
      let eventsData: EventWithRegistration[] = [];
      
      if (shouldFilterByGroups) {
        // For students with groups - use group-based filtering
        const visibleKeys = getVisibleKeys(userProfile.groups);
        console.log('🔑 Visible keys for user:', visibleKeys);
        
        try {
          const eventsQuery = query(
            collection(db, 'events'),
            where('publish', '==', true),
            where('groups', 'array-contains-any', visibleKeys),
            orderBy('date', 'asc')
          );
          
          const eventsSnapshot = await getDocs(eventsQuery);
          eventsData = eventsSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`✅ Group-filtered event found: "${data.title}" for groups:`, data.groups);
            return {
              id: doc.id,
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
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              isRegistered: false,
              registrationCount: 0
            } as EventWithRegistration;
          });
        } catch (queryError) {
          console.error('❌ Group-based query failed:', queryError);
          console.log('🔄 Falling back to simple query...');
          
          // Fallback to simple query and filter client-side
          const simpleQuery = query(
            collection(db, 'events'),
            where('publish', '==', true)
          );
          
          const simpleSnapshot = await getDocs(simpleQuery);
          eventsData = simpleSnapshot.docs
            .map(doc => {
              const data = doc.data();
              return {
                id: doc.id,
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
                groups: data.groups || ['ALL'],
                createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                isRegistered: false,
                registrationCount: 0
              } as EventWithRegistration;
            })
            .filter(event => {
              const eventGroups = event.groups || ['ALL'];
              return eventGroups.includes('ALL') || eventGroups.some(group => visibleKeys.includes(group));
            })
            .sort((a, b) => a.startAt.getTime() - b.startAt.getTime());
        }
      } else {
        // For non-students (admins/trainers) or unauthenticated users - show all published events
        try {
          const eventsQuery = query(
            collection(db, 'events'),
            where('publish', '==', true),
            orderBy('date', 'asc')
          );
          
          const eventsSnapshot = await getDocs(eventsQuery);
          eventsData = eventsSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`✅ Published event found: "${data.title}"`);
            return {
              id: doc.id,
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
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              isRegistered: false,
              registrationCount: 0
            } as EventWithRegistration;
          });
        } catch (queryError) {
          console.error('❌ Query with orderBy failed:', queryError);
          console.log('🔄 Trying without orderBy...');
          
          // Try without orderBy in case there's an index issue
          const simpleQuery = query(
            collection(db, 'events'),
            where('publish', '==', true)
          );
          
          const simpleSnapshot = await getDocs(simpleQuery);
          eventsData = simpleSnapshot.docs.map(doc => {
            const data = doc.data();
            console.log(`✅ Published event found (simple query): "${data.title}"`);
            return {
              id: doc.id,
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
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
              isRegistered: false,
              registrationCount: 0
            } as EventWithRegistration;
          }).sort((a, b) => a.startAt.getTime() - b.startAt.getTime()); // Sort manually
        }
      }
      
      console.log(`📊 Final result: ${eventsData.length} events loaded (filtered: ${shouldFilterByGroups})`);
      setEvents(eventsData);
    } catch (error) {
      console.error('💥 Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkRegistrationStatus = async () => {
    if (!currentUser || events.length === 0) return;

    try {
      console.log('🔍 Checking registration status for all events...');
      
      // Load all registrations for current user
      const userRegistrationsQuery = query(
        collection(db, 'registrations'),
        where('uid', '==', currentUser.uid),
        where('status', '!=', 'cancelled')
      );
      
      const userRegistrationsSnapshot = await getDocs(userRegistrationsQuery);
      const userRegistrations = userRegistrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      console.log('📋 User registrations found:', userRegistrations);

      // Load all registrations for registration counts
      const allRegistrationsSnapshot = await getDocs(collection(db, 'registrations'));
      const allRegistrations = allRegistrationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Update events with registration status
      const eventsWithRegistration = events.map(event => {
        const isRegistered = userRegistrations.some(reg => 
          reg.eventId === event.id && reg.status !== 'cancelled'
        );
        
        const registrationCount = allRegistrations.filter(reg => 
          reg.eventId === event.id && reg.status !== 'cancelled'
        ).length;

        console.log(`Event "${event.title}": registered=${isRegistered}, count=${registrationCount}`);

        return {
          ...event,
          isRegistered,
          registrationCount
        };
      });

      setEvents(eventsWithRegistration);
    } catch (error) {
      console.error('Error checking registration status:', error);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        event.locationName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Location filter
    if (locationFilter !== 'all') {
      filtered = filtered.filter(event =>
        event.locationName.toLowerCase().includes(locationFilter.toLowerCase())
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      const oneWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      const oneMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(event => {
        if (dateFilter === 'week') {
          return event.startAt >= now && event.startAt <= oneWeek;
        } else if (dateFilter === 'month') {
          return event.startAt >= now && event.startAt <= oneMonth;
        }
        return true;
      });
    }

    setFilteredEvents(filtered);
  };

  const getUniqueLocations = () => {
    const locations = events.map(event => event.locationName);
    return [...new Set(locations)];
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="section-container py-16 text-center">
          <div className="text-lg">טוען אירועים...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Debug info */}
      {currentUser && (
        <div className="bg-gray-800/50 text-xs p-2 text-center">
          🔍 Debug: User: {currentUser.email} | Events: {events.length} | 
          Registered: {events.filter(e => e.isRegistered).length}
        </div>
      )}
      
      {/* Header */}
      <section className="bg-gray-900 py-16">
        <div className="section-container">
          <h1 className="text-4xl font-bold mb-4">אירועי הכשרה</h1>
          <p className="text-gray-300 text-lg">
            בחר את האימון המתאים לך והתכונן לשירות הצבא בצורה הטובה ביותר
          </p>
          {events.length > 0 && (
            <div className="mt-4 text-sm text-gray-400">
              {filteredEvents.length} אירועים זמינים
              {currentUser && (
                <span className="mr-4">
                  • {events.filter(e => e.isRegistered).length} רישומים שלך
                </span>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Filters */}
      <section className="bg-gray-800/50 py-6 border-b border-gray-700">
        <div className="section-container">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="חפש אירוע..."
                  className="input pr-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <select 
                className="input"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">כל התאריכים</option>
                <option value="week">השבוע</option>
                <option value="month">החודש</option>
              </select>
              
              <select 
                className="input"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value)}
              >
                <option value="all">כל המיקומים</option>
                {getUniqueLocations().map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Events Grid */}
      <section className="py-12">
        <div className="section-container">
          {filteredEvents.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredEvents.map((event) => (
                <EventCardWithRegistration key={event.id} event={event} currentUser={currentUser} />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="text-center py-16">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">אין אירועים זמינים</h3>
              <p className="text-gray-400 text-lg">
                אירועים חדשים יתפרסמו בקרוב. חזור שוב מאוחר יותר
              </p>
              <div className="mt-4 text-sm text-gray-500">
                אירועים חדשים יתפרסמו בקרוב
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">לא נמצאו אירועים</h3>
              <p className="text-gray-400 text-lg mb-4">
                לא נמצאו אירועים התואמים לחיפוש שלך
              </p>
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setLocationFilter('all');
                  setDateFilter('all');
                }}
                className="btn-outline"
              >
                נקה מסננים
              </button>
            </div>
          )}
        </div>
      </section>

      {/* WhatsApp Float */}
      <WhatsAppFloat message="שלום! אני מעוניין לקבל מידע נוסף על האימונים והאירועים" />
    </div>
  );
}

// Enhanced EventCard component with registration status
function EventCardWithRegistration({ event, currentUser }: { 
  event: EventWithRegistration; 
  currentUser: any;
}) {
  const availableSpots = event.capacity - (event.registrationCount || 0);
  const isFull = availableSpots <= 0;

  return (
    <div className="card group hover:scale-105 transition-transform duration-300">
      <div className="aspect-video relative overflow-hidden rounded-lg mb-4">
        <img 
          src={event.cover} 
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
        />
        
        {/* Status Badge */}
        <div className="absolute top-3 right-3 flex gap-2">
          {event.isRegistered && (
            <span className="px-2 py-1 bg-green-600 text-white text-xs rounded font-medium">
              ✅ רשום
            </span>
          )}
          {isFull && (
            <span className="px-2 py-1 bg-red-600 text-white text-xs rounded font-medium">
              🚫 מלא
            </span>
          )}
          {availableSpots <= 5 && availableSpots > 0 && (
            <span className="px-2 py-1 bg-yellow-600 text-white text-xs rounded font-medium">
              ⚠️ {availableSpots} נותרו
            </span>
          )}
        </div>
      </div>

      <h3 className="text-xl font-bold mb-2 group-hover:text-brand-green transition-colors">
        {event.title}
      </h3>
      
      <p className="text-gray-400 mb-4 line-clamp-2">
        {event.description}
      </p>

      <div className="space-y-2 mb-6">
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Calendar size={16} />
          <span>{event.startAt.toLocaleDateString('he-IL', {
            weekday: 'short',
            day: 'numeric',
            month: 'short'
          })}</span>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Search size={16} />
          <span>{event.locationName}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">
            {event.registrationCount || 0}/{event.capacity} נרשמו
          </span>
          <span className="text-brand-green font-bold">
            {event.priceNis === 0 ? 'חינם' : `₪${event.priceNis}`}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        {event.isRegistered ? (
          <>
            <div className="btn bg-green-600 hover:bg-green-700 flex-1 text-center opacity-75 cursor-default">
              ✅ רשום
            </div>
            <a 
              href={`/events/${encodeURIComponent(event.slug)}`}
              className="btn-outline flex-1 text-center"
            >
              פרטים
            </a>
          </>
        ) : isFull ? (
          <>
            <div className="btn bg-red-600 opacity-50 cursor-not-allowed flex-1 text-center">
              🚫 מלא
            </div>
            <a 
              href={`/events/${encodeURIComponent(event.slug)}`}
              className="btn-outline flex-1 text-center"
            >
              פרטים
            </a>
          </>
        ) : (
          <>
            <a 
              href={`/events/${encodeURIComponent(event.slug)}`}
              className="btn flex-1 text-center"
            >
              {currentUser ? 'הרשם עכשיו' : 'צפה בפרטים'}
            </a>
            <a 
              href={`/events/${encodeURIComponent(event.slug)}`}
              className="btn-outline flex-1 text-center"
            >
              פרטים
            </a>
          </>
        )}
      </div>
    </div>
  );
}