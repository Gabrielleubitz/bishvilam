import Link from 'next/link';
import { format } from 'date-fns';
import { he } from 'date-fns/locale';
import { Event } from '@/types';
import { MapPin, Calendar, Users, Banknote } from 'lucide-react';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  return (
    <div className="card hover:border-brand-green/60 transition-colors group">
      {event.cover && (
        <div className="w-full h-48 bg-gray-800 rounded-lg mb-4 overflow-hidden">
          <img 
            src={event.cover} 
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      )}
      
      <h3 className="text-xl font-semibold mb-3 group-hover:text-brand-green transition-colors">
        {event.title}
      </h3>
      
      <p className="text-gray-300 mb-4 line-clamp-2">
        {event.description}
      </p>
      
      <div className="space-y-2 mb-4 text-sm text-gray-400">
        <div className="flex items-center gap-2">
          <Calendar size={16} />
          <span>{format(event.startAt, 'dd/MM/yyyy', { locale: he })}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <MapPin size={16} />
          <span>{event.locationName}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Users size={16} />
          <span>{event.capacity} מקומות</span>
        </div>
        
        <div className="flex items-center gap-2">
          <Banknote size={16} />
          <span>₪{event.priceNis}</span>
        </div>
      </div>
      
      <Link 
        href={`/events/${encodeURIComponent(event.slug)}`}
        className="btn w-full text-center block"
      >
        למידע נוסף והרשמה
      </Link>
    </div>
  );
}