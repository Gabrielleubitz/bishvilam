'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy, limit, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';
import Navbar from '@/components/Navbar';
import EventManager from '@/components/admin/EventManager';
import UserManager from '@/components/admin/UserManager';
import MediaManager from '@/components/admin/MediaManager';
import TrainerManager from '@/components/admin/TrainerManager';
import WhatsAppGroupManager from '@/components/admin/WhatsAppGroupManager';
import EmailTester from '@/components/admin/EmailTester';
import AnnouncementManager from '@/components/admin/AnnouncementManager';
import PastEventsManager from '@/components/admin/PastEventsManager';
import { Users, Calendar, Image, BarChart3, UserCheck, MessageCircle, Mail, Megaphone, History } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  const tabs = [
    { id: 'overview', label: 'סקירה כללית', icon: BarChart3 },
    { id: 'events', label: 'ניהול אירועים', icon: Calendar },
    { id: 'past-events', label: 'אירועי עבר', icon: History },
    { id: 'users', label: 'ניהול משתמשים', icon: Users },
    { id: 'trainers', label: 'ניהול מדריכים', icon: UserCheck },
    { id: 'announcements', label: 'ניהול הודעות', icon: Megaphone },
    { id: 'whatsapp', label: 'קישורי ווטסאפ', icon: MessageCircle },
    { id: 'email', label: 'מערכת מייל', icon: Mail },
    { id: 'media', label: 'ניהול מדיה', icon: Image }
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="section-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">פאנל ניהול</h1>
          <p className="text-gray-400">ברוך הבא למערכת הניהול</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-2 mb-8 border-b border-gray-700">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-green text-black'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'overview' && <OverviewTab setActiveTab={setActiveTab} />}
          {activeTab === 'events' && <EventManager />}
          {activeTab === 'past-events' && <PastEventsManager />}
          {activeTab === 'users' && <UserManager />}
          {activeTab === 'trainers' && <TrainerManager />}
          {activeTab === 'announcements' && <AnnouncementManager />}
          {activeTab === 'whatsapp' && <WhatsAppGroupManager />}
          {activeTab === 'email' && <EmailTester />}
          {activeTab === 'media' && <MediaManager />}
        </div>
      </div>
    </div>
  );
}

function OverviewTab({ setActiveTab }: { setActiveTab: (tab: string) => void }) {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    recentRegistrations: 0,
    publishedEvents: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('OverviewTab mounted, fetching stats...');
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Starting to fetch stats...');
      setLoading(true);
      
      // Fetch total users
      console.log('Fetching users from profiles collection...');
      const usersSnapshot = await getDocs(collection(db, 'profiles'));
      const totalUsers = usersSnapshot.size;
      console.log('Total users found:', totalUsers);

      // Fetch total events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const totalEvents = eventsSnapshot.size;

      // Fetch published events (using same field as your EventsPage)
      const publishedEventsQuery = query(
        collection(db, 'events'),
        where('publish', '==', true)
      );
      const publishedEventsSnapshot = await getDocs(publishedEventsQuery);
      const publishedEvents = publishedEventsSnapshot.size;

      // Fetch recent registrations (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const recentUsersQuery = query(
        collection(db, 'profiles'),
        where('createdAt', '>=', Timestamp.fromDate(weekAgo)),
        orderBy('createdAt', 'desc')
      );
      const recentUsersSnapshot = await getDocs(recentUsersQuery);
      const recentRegistrations = recentUsersSnapshot.size;

      // Get recent users for display (limit to 3 most recent)
      const recentUsersDisplayQuery = query(
        collection(db, 'profiles'),
        orderBy('createdAt', 'desc'),
        limit(3)
      );
      const recentUsersDisplaySnapshot = await getDocs(recentUsersDisplayQuery);
      const recentUsersData = recentUsersDisplaySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setStats({
        totalUsers,
        totalEvents,
        recentRegistrations,
        publishedEvents
      });
      
      setRecentUsers(recentUsersData);
    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // If there are index issues, try simpler queries
      try {
        console.log('Trying fallback queries...');
        
        const usersSnapshot = await getDocs(collection(db, 'profiles'));
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        
        // Simple published events query without orderBy
        const publishedEventsQuery = query(
          collection(db, 'events'),
          where('publish', '==', true)
        );
        const publishedEventsSnapshot = await getDocs(publishedEventsQuery);
        
        setStats({
          totalUsers: usersSnapshot.size,
          totalEvents: eventsSnapshot.size,
          recentRegistrations: 0, // Will show 0 if recent query fails
          publishedEvents: publishedEventsSnapshot.size
        });
        
        setRecentUsers([]);
      } catch (fallbackError) {
        console.error('Fallback queries also failed:', fallbackError);
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'לא זמין';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return 'אתמול';
    if (diffDays < 7) return `לפני ${diffDays} ימים`;
    return date.toLocaleDateString('he-IL');
  };

  const statCards = [
    { label: 'סך משתמשים', value: stats.totalUsers, icon: Users, color: 'text-blue-400' },
    { label: 'סך אירועים', value: stats.totalEvents, icon: Calendar, color: 'text-green-400' },
    { label: 'הרשמות השבוע', value: stats.recentRegistrations, icon: Users, color: 'text-yellow-400' },
    { label: 'אירועים פעילים', value: stats.publishedEvents, icon: Calendar, color: 'text-purple-400' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className="card">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
              <stat.icon className={`${stat.color} w-8 h-8`} />
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">פעולות מהירות</h3>
          <div className="space-y-3">
            <button 
              className="btn w-full text-right"
              onClick={() => setActiveTab('events')}
            >
              <Calendar className="w-4 h-4 ml-2" />
              יצירת אירוע חדש
            </button>
            <button 
              className="btn-outline w-full text-right"
              onClick={() => setActiveTab('users')}
            >
              <Users className="w-4 h-4 ml-2" />
              הצגת כל המשתמשים
            </button>
            <button 
              className="btn-outline w-full text-right"
              onClick={() => setActiveTab('media')}
            >
              <Image className="w-4 h-4 ml-2" />
              העלאת מדיה חדשה
            </button>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold mb-4">הרשמות אחרונות</h3>
          <div className="space-y-3 text-sm">
            {recentUsers.length > 0 ? (
              recentUsers.map((user, index) => (
                <div key={user.id} className="flex justify-between items-center py-2 border-b border-gray-700 last:border-b-0">
                  <span>{user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.email || 'משתמש ללא שם'}</span>
                  <span className="text-gray-400">{formatTimeAgo(user.createdAt)}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-400 py-4">
                אין הרשמות אחרונות
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}