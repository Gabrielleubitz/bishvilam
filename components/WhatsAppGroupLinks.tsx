'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, ExternalLink, Users, CheckCircle } from 'lucide-react';

interface WhatsAppGroupLink {
  id: string;
  group: string;
  groupName: string;
  whatsappUrl: string;
  isActive: boolean;
}

interface WhatsAppGroupLinksProps {
  userGroups: string[];
  onClose?: () => void;
}

export default function WhatsAppGroupLinks({ userGroups, onClose }: WhatsAppGroupLinksProps) {
  const [groupLinks, setGroupLinks] = useState<WhatsAppGroupLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupLinks();
  }, [userGroups]);

  const fetchGroupLinks = async () => {
    try {
      if (!userGroups || userGroups.length === 0) {
        setGroupLinks([]);
        setLoading(false);
        return;
      }

      console.log('Fetching WhatsApp groups for user groups:', userGroups);
      const response = await fetch(`/api/whatsapp-groups?groups=${userGroups.join(',')}`);
      const data = await response.json();
      
      if (data.groups) {
        setGroupLinks(data.groups);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp group links:', error);
      setGroupLinks([]);
    } finally {
      setLoading(false);
    }
  };

  const openWhatsAppGroup = (url: string, groupName: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (loading) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-green"></div>
          <span className="mr-3">טוען קישורי ווטסאפ...</span>
        </div>
      </div>
    );
  }

  if (groupLinks.length === 0) {
    return null; // Don't show anything if no groups
  }

  return (
    <div className="card bg-green-900/20 border border-green-500/30">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-green-600 rounded-lg">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-green-300">
              קבוצות ווטסאפ שלך
            </h3>
            <p className="text-sm text-green-200">
              הצטרף לקבוצות הווטסאפ של הקבוצות שלך
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        )}
      </div>

      <div className="space-y-3">
        {groupLinks.map((link) => (
          <div key={link.id} className="bg-gray-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-brand-green text-black px-3 py-1 rounded font-bold text-lg">
                  {link.group}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{link.groupName}</h4>
                  <p className="text-sm text-gray-400">קבוצת הווטסאפ של קבוצה {link.group}</p>
                </div>
              </div>
              
              <button
                onClick={() => openWhatsAppGroup(link.whatsappUrl, link.groupName)}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg transition-colors"
              >
                <MessageCircle size={18} />
                <span>הצטרף</span>
                <ExternalLink size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-blue-200">
            <p className="font-medium mb-1">מה תמצא בקבוצות?</p>
            <ul className="space-y-1 text-xs">
              <li>• עדכונים על אימונים ואירועים</li>
              <li>• שיתוף ותיאום בין חברי הקבוצה</li>
              <li>• הודעות חשובות ממנהלי הקבוצה</li>
              <li>• תמיכה וחברותא באימונים</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-3 text-xs text-center text-gray-400">
        💡 ההצטרפות לקבוצות היא אופציונלית אך מומלצת לקבלת עדכונים
      </div>
    </div>
  );
}

// Minimal version for inline display
export function InlineWhatsAppLinks({ userGroups }: { userGroups: string[] }) {
  const [groupLinks, setGroupLinks] = useState<WhatsAppGroupLink[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupLinks();
  }, [userGroups]);

  const fetchGroupLinks = async () => {
    try {
      if (!userGroups || userGroups.length === 0) {
        setGroupLinks([]);
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/whatsapp-groups?groups=${userGroups.join(',')}`);
      const data = await response.json();
      
      if (data.groups) {
        setGroupLinks(data.groups);
      }
    } catch (error) {
      console.error('Error fetching WhatsApp group links:', error);
      setGroupLinks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading || groupLinks.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {groupLinks.map((link) => (
        <a
          key={link.id}
          href={link.whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 px-3 py-1 rounded-lg text-sm transition-colors"
        >
          <MessageCircle size={14} />
          <span>קבוצה {link.group}</span>
          <ExternalLink size={12} />
        </a>
      ))}
    </div>
  );
}