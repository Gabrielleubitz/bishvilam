'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import Navbar from '@/components/Navbar';
import WhatsAppFloat from '@/components/WhatsAppFloat';
import ImageModal from '@/components/ImageModal';
import ImageWithCacheBuster from '@/components/ImageWithCacheBuster';
import { ArrowLeft, Heart, Star } from 'lucide-react';
import { useMedia } from '@/hooks/useMedia';
import Link from 'next/link';

interface FallenSoldier {
  id: string;
  name: string;
  hebrewName: string;
  age?: number;
  unit?: string;
  rank?: string;
  dateOfFalling: string;
  imageUrl?: string;
  parentText: string;
  shortDescription: string;
  slug: string;
  order: number;
}

export default function SoldierMemorialPage() {
  const { getMemorialImages } = useMedia();
  const memorialImages = getMemorialImages();
  const params = useParams();
  const slug = params.slug as string;
  const [soldier, setSoldier] = useState<FallenSoldier | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    loadSoldierData();
  }, [slug]);

  const loadSoldierData = async () => {
    if (!slug) return;
    
    try {
      setLoading(true);
      
      // Dynamically import Firebase to avoid SSR issues
      const { doc, getDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase.client');
      
      const soldierDoc = await getDoc(doc(db, 'fallenSoldiers', slug));
      
      if (soldierDoc.exists()) {
        const data = soldierDoc.data();
        
        const imageUrl = data.imageUrl || '';
        
        setSoldier({
          id: soldierDoc.id,
          name: data.name || '',
          hebrewName: data.hebrewName || '',
          age: data.age,
          unit: data.unit || '',
          rank: data.rank || '',
          dateOfFalling: data.dateOfFalling || '',
          imageUrl: imageUrl,
          parentText: data.parentText || '',
          shortDescription: data.shortDescription || '',
          slug: data.slug || slug,
          order: data.order || 0
        } as FallenSoldier);
      }
    } catch (error) {
      console.error('Error loading soldier data:', error);
    } finally {
      setLoading(false);
    }
  };

  const openImageModal = () => {
    if (soldier?.imageUrl) {
      setModalOpen(true);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, index) => (
      <span key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </span>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          <span className="ml-3 text-white">טוען...</span>
        </div>
      </div>
    );
  }

  if (!soldier) {
    return (
      <div className="min-h-screen bg-gray-900">
        <Navbar />
        <div className="section-container py-20 text-center">
          <h1 className="text-3xl font-bold text-white mb-4">דף לא נמצא</h1>
          <p className="text-gray-300 mb-8">הדף המבוקש לא קיים</p>
          <Link href="/lizchram" className="btn-primary">
            חזרה לדף הזיכרון
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative bg-black/50 py-16">
        <div className="section-container">
          {/* Back Button */}
          <Link 
            href="/lizchram"
            className="inline-flex items-center gap-2 text-brand-green hover:text-white transition-colors mb-8"
          >
            <ArrowLeft size={20} />
            חזרה לדף הזיכרון
          </Link>

          <div className="grid md:grid-cols-2 gap-12 items-start">
            {/* Soldier Image */}
            <div className="text-center">
              {soldier.imageUrl ? (
                <div className="relative inline-block">
                  <ImageWithCacheBuster
                    key={soldier.imageUrl} // Force remount when URL changes
                    src={soldier.imageUrl}
                    alt={soldier.hebrewName}
                    className="w-64 h-64 md:w-80 md:h-80 object-cover rounded-lg cursor-pointer hover:scale-105 transition-transform duration-300"
                    onClick={openImageModal}
                    cacheBustOnMount={true}
                  />
                  <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-green rounded-full flex items-center justify-center">
                    <Heart className="text-white" size={16} fill="currentColor" />
                  </div>
                </div>
              ) : (
                <div className="w-64 h-64 md:w-80 md:h-80 bg-gray-800 rounded-lg flex items-center justify-center mx-auto">
                  <Star className="text-gray-400" size={64} />
                </div>
              )}
              
              {/* Military Style Info Box */}
              <div className="mt-6 bg-gray-800 border border-brand-green/30 p-4 rounded">
                <div className="text-brand-green text-sm font-mono mb-2">[ פרטי לוחם ]</div>
                <div className="space-y-1 text-white">
                  {soldier.rank && <p><span className="text-brand-green">דרגה:</span> {soldier.rank}</p>}
                  {soldier.unit && <p><span className="text-brand-green">יחידה:</span> {soldier.unit}</p>}
                  {soldier.age && <p><span className="text-brand-green">גיל:</span> {soldier.age}</p>}
                  <p><span className="text-brand-green">תאריך נפילה:</span> {soldier.dateOfFalling}</p>
                </div>
              </div>
            </div>

            {/* Soldier Info */}
            <div>
              <div className="mb-6">
                <h1 className="text-4xl font-bold text-white mb-2">{soldier.hebrewName}</h1>
                <p className="text-xl text-brand-green">{soldier.shortDescription}</p>
              </div>

              {/* Military-style corner brackets */}
              <div className="relative bg-gray-800/50 border border-gray-700 p-6 rounded-lg">
                <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-brand-green"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-brand-green"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-brand-green"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-brand-green"></div>

                <div className="text-brand-green text-sm font-mono mb-3">[ זכרו לברכה ]</div>
                <blockquote className="text-gray-300 leading-relaxed italic">
                  &quot;{soldier.shortDescription}&quot;
                </blockquote>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Parent's Message */}
      <section className="py-16">
        <div className="section-container">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-4">מכתב מההורים</h2>
              <div className="w-20 h-1 bg-brand-green mx-auto"></div>
            </div>

            <div className="bg-gray-800 border border-brand-green/30 p-8 rounded-lg relative">
              {/* Decorative corners */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-brand-green opacity-50"></div>
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-brand-green opacity-50"></div>
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-brand-green opacity-50"></div>
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-brand-green opacity-50"></div>

              <div className="text-brand-green text-sm font-mono mb-4 text-center">
                [ מילים מהלב - מאת ההורים האבלים ]
              </div>
              
              <div className="prose prose-lg max-w-none">
                <div className="text-gray-300 leading-relaxed whitespace-pre-wrap text-right">
                  {formatText(soldier.parentText)}
                </div>
              </div>

              <div className="mt-8 text-center">
                <div className="text-brand-green text-sm font-mono">
                  [ יהי זכרו ברוך ]
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Memorial Section */}
      <section className="py-16 bg-gray-900/50">
        <div className="section-container text-center">
          <div className="max-w-2xl mx-auto">
            <div className="bg-gray-800 border border-brand-green/30 p-8 rounded-lg">
              <Heart className="text-brand-green mx-auto mb-4" size={48} fill="currentColor" />
              <h3 className="text-2xl font-bold text-white mb-4">לזכרו של {soldier.hebrewName}</h3>
              <p className="text-gray-300 mb-6">
                נפל בקרב על הגנת המולדת ב{soldier.dateOfFalling}
              </p>
              <div className="text-brand-green text-lg font-semibold">
                &quot;גיבור אמיתי לא מתפחד למות למען דבר שהוא מאמין בו&quot;
              </div>
            </div>
          </div>
        </div>
      </section>

      <WhatsAppFloat message={`שלום, ראיתי את דף הזיכרון של ${soldier.hebrewName} ואני רוצה לקבל מידע נוסף על הפעילות שלכם`} />

      {/* Image Modal */}
      {soldier.imageUrl && (
        <ImageModal
          isOpen={modalOpen}
          imageUrl={soldier.imageUrl}
          altText={soldier.hebrewName}
          onClose={() => setModalOpen(false)}
          modalType="team"
          teamMemberPosition={`${soldier.rank || ''} ${soldier.unit || ''}`.trim()}
        />
      )}
    </div>
  );
}