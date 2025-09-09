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
import EventAttendanceChecker from '@/components/admin/EventAttendanceChecker';
import BundleManager from '@/components/admin/BundleManager';
import TeamManager from '@/components/admin/TeamManager';
import { Users, Calendar, Image, BarChart3, UserCheck, MessageCircle, Mail, Megaphone, History, Settings, ChevronDown, RefreshCw, ClipboardCheck, Package, UserCircle } from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [activeSection, setActiveSection] = useState('');
  const [expandedSections, setExpandedSections] = useState<string[]>(['events', 'users']);
  
  // Stats state
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalEvents: 0,
    recentRegistrations: 0,
    publishedEvents: 0
  });
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      console.log('Starting to fetch stats...');
      setStatsLoading(true);
      
      // Fetch total users
      console.log('Fetching users from profiles collection...');
      const usersSnapshot = await getDocs(collection(db, 'profiles'));
      const totalUsers = usersSnapshot.size;
      console.log('Total users found:', totalUsers);

      // Fetch total events
      const eventsSnapshot = await getDocs(collection(db, 'events'));
      const totalEvents = eventsSnapshot.size;

      // Fetch published events
      const publishedEventsQuery = query(
        collection(db, 'events'),
        where('publish', '==', true)
      );
      const publishedEventsSnapshot = await getDocs(publishedEventsQuery);
      const publishedEvents = publishedEventsSnapshot.size;

      // Fetch recent registrations (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      try {
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
      } catch (recentError) {
        console.log('Recent users query failed, using fallback...');
        // If recent query fails, still set the basic stats
        setStats({
          totalUsers,
          totalEvents,
          recentRegistrations: 0,
          publishedEvents
        });
        setRecentUsers([]);
      }

    } catch (error) {
      console.error('Error fetching stats:', error);
      
      // Fallback queries
      try {
        console.log('Trying fallback queries...');
        
        const usersSnapshot = await getDocs(collection(db, 'profiles'));
        const eventsSnapshot = await getDocs(collection(db, 'events'));
        
        const publishedEventsQuery = query(
          collection(db, 'events'),
          where('publish', '==', true)
        );
        const publishedEventsSnapshot = await getDocs(publishedEventsQuery);
        
        setStats({
          totalUsers: usersSnapshot.size,
          totalEvents: eventsSnapshot.size,
          recentRegistrations: 0,
          publishedEvents: publishedEventsSnapshot.size
        });
        
        setRecentUsers([]);
      } catch (fallbackError) {
        console.error('Fallback queries also failed:', fallbackError);
        setStats({
          totalUsers: 0,
          totalEvents: 0,
          recentRegistrations: 0,
          publishedEvents: 0
        });
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const sections = [
    {
      id: 'overview',
      label: 'סקירה כללית',
      icon: BarChart3,
      items: [
        { id: 'overview', label: 'דשבורד ראשי', icon: BarChart3 }
      ]
    },
    {
      id: 'events',
      label: 'ניהול אירועים',
      icon: Calendar,
      items: [
        { id: 'events', label: 'אירועים פעילים', icon: Calendar },
        { id: 'bundles', label: 'חבילות אירועים', icon: Package },
        { id: 'attendance', label: 'בדיקת נוכחות', icon: ClipboardCheck },
        { id: 'past-events', label: 'אירועי עבר', icon: History }
      ]
    },
    {
      id: 'users',
      label: 'ניהול משתמשים',
      icon: Users,
      items: [
        { id: 'users', label: 'רשימת משתמשים', icon: Users },
        { id: 'trainers', label: 'מדריכים', icon: UserCheck }
      ]
    },
    {
      id: 'communications',
      label: 'תקשורת ויצירת קשר',
      icon: MessageCircle,
      items: [
        { id: 'announcements', label: 'הודעות למשתמשים', icon: Megaphone },
        { id: 'email', label: 'מערכת מייל', icon: Mail },
        { id: 'whatsapp', label: 'קישורי ווטסאפ', icon: MessageCircle }
      ]
    },
    {
      id: 'content',
      label: 'ניהול תוכן',
      icon: Settings,
      items: [
        { id: 'media', label: 'מדיה וגלריה', icon: Image },
        { id: 'team', label: 'צוות החברה', icon: UserCircle }
      ]
    }
  ];

  const toggleSection = (sectionId: string) => {
    if (expandedSections.includes(sectionId)) {
      setExpandedSections(expandedSections.filter(id => id !== sectionId));
    } else {
      setExpandedSections([...expandedSections, sectionId]);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      
      <div className="section-container py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">פאנל ניהול</h1>
          <p className="text-gray-400">ברוך הבא למערכת הניהול</p>
        </div>

        {/* Section Navigation */}
        <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            {/* Mobile Navigation Toggle */}
            <div className="lg:hidden mb-4">
              <button
                onClick={() => setExpandedSections(expandedSections.length === 0 ? ['events', 'users'] : [])}
                className="w-full btn-outline flex items-center justify-between"
              >
                <span>תפריט ניהול</span>
                <ChevronDown 
                  size={16} 
                  className={`transition-transform ${expandedSections.length > 0 ? 'rotate-180' : ''}`}
                />
              </button>
            </div>
            
            <div className={`${expandedSections.length === 0 ? 'hidden lg:block' : 'block'}`}>
            <div className="bg-gray-800/50 rounded-lg p-4">
              <nav className="space-y-2">
                {sections.map((section) => (
                  <div key={section.id}>
                    {/* Section Header */}
                    <button
                      onClick={() => section.items.length > 1 ? toggleSection(section.id) : setActiveTab(section.items[0].id)}
                      className="flex items-center justify-between w-full p-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <section.icon size={18} />
                        <span className="font-medium text-sm">{section.label}</span>
                      </div>
                      {section.items.length > 1 && (
                        <ChevronDown 
                          size={16} 
                          className={`transition-transform ${
                            expandedSections.includes(section.id) ? 'rotate-180' : ''
                          }`}
                        />
                      )}
                    </button>
                    
                    {/* Subsection Items */}
                    {section.items.length > 1 && expandedSections.includes(section.id) && (
                      <div className="ml-6 mt-1 space-y-1">
                        {section.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`flex items-center gap-2 w-full p-2 rounded text-sm transition-colors ${
                              activeTab === item.id
                                ? 'bg-brand-green text-black font-medium'
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                          >
                            <item.icon size={16} />
                            {item.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </nav>
            </div>
            
            {/* Quick Stats */}
            <div className="mt-6 bg-gray-800/50 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-300">סטטיסטיקות מהירות</h3>
                <button
                  onClick={fetchStats}
                  disabled={statsLoading}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="רענן נתונים"
                >
                  <RefreshCw 
                    size={14} 
                    className={statsLoading ? 'animate-spin' : ''} 
                  />
                </button>
              </div>
              
              {statsLoading ? (
                <div className="flex items-center justify-center py-4">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-green"></div>
                </div>
              ) : (
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400">אירועים פעילים</span>
                    <span className="text-brand-green font-medium">{stats.publishedEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">סך אירועים</span>
                    <span className="text-blue-400 font-medium">{stats.totalEvents}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">משתמשים רשומים</span>
                    <span className="text-purple-400 font-medium">{stats.totalUsers}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">הרשמות השבוע</span>
                    <span className="text-yellow-400 font-medium">{stats.recentRegistrations}</span>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-3">
            <div className="bg-gray-800/30 rounded-lg">
              {/* Content Header */}
              <div className="border-b border-gray-700 p-6 pb-4">
                <div className="flex items-center gap-2">
                  {(() => {
                    const currentItem = sections
                      .flatMap(section => section.items)
                      .find(item => item.id === activeTab);
                    const currentSection = sections.find(section => 
                      section.items.some(item => item.id === activeTab)
                    );
                    
                    return (
                      <>
                        {currentSection && <currentSection.icon size={24} className="text-brand-green" />}
                        <div>
                          <h2 className="text-xl font-bold">
                            {currentItem?.label || 'ניהול מערכת'}
                          </h2>
                          {currentSection && currentItem?.id !== currentSection.id && (
                            <p className="text-sm text-gray-400">
                              {currentSection.label}
                            </p>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
              
              {/* Tab Content */}
              <div className="p-6">
                {activeTab === 'overview' && (
                  <OverviewTab 
                    setActiveTab={setActiveTab} 
                    stats={stats}
                    recentUsers={recentUsers}
                    loading={statsLoading}
                  />
                )}
                {activeTab === 'events' && <EventManager />}
                {activeTab === 'bundles' && <BundleManager />}
                {activeTab === 'attendance' && <EventAttendanceChecker />}
                {activeTab === 'past-events' && <PastEventsManager />}
                {activeTab === 'users' && <UserManager />}
                {activeTab === 'trainers' && <TrainerManager />}
                {activeTab === 'announcements' && <AnnouncementManager />}
                {activeTab === 'whatsapp' && <WhatsAppGroupManager />}
                {activeTab === 'email' && <EmailTester />}
                {activeTab === 'media' && <MediaManager />}
                {activeTab === 'team' && <TeamManager />}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Updated OverviewTab to receive props instead of fetching data itself
function OverviewTab({ 
  setActiveTab, 
  stats, 
  recentUsers, 
  loading 
}: { 
  setActiveTab: (tab: string) => void;
  stats: {
    totalUsers: number;
    totalEvents: number;
    recentRegistrations: number;
    publishedEvents: number;
  };
  recentUsers: any[];
  loading: boolean;
}) {
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