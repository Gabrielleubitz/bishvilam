export interface UserProfile {
  uid: string;
  role: 'admin' | 'trainer' | 'instructor' | 'parent' | 'student';
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  tzId: string;
  dob?: string;
  emergency?: string;
  lang: 'he';
  phoneVerified?: boolean;
  groups?: string[]; // Hebrew letters for students, e.g. ["א","ג","מ"]
  createdAt: Date;
}

export interface Event {
  id: string;
  title: string;
  slug: string;
  description: string;
  itineraryMd?: string;
  startAt: Date;
  endAt: Date;
  locationName: string;
  lat?: number;
  lng?: number;
  capacity: number;
  priceNis: number;
  cover?: string;
  publish: boolean;
  status?: 'active' | 'completed' | 'cancelled' | 'draft'; // Event lifecycle status
  assignedTrainers?: string[]; // Array of trainer UIDs
  groups?: string[]; // Hebrew letters or ["ALL"] for visibility, e.g. ["א","ג"] or ["ALL"]
  createdAt: Date;
  completedAt?: any; // When event was marked as completed
}

export interface Registration {
  id: string;
  eventId: string;
  uid: string;
  status: 'pending' | 'paid' | 'cancelled' | 'waitlist';
  paymentStatus?: 'paid' | 'pending' | 'free'; // Admin-controlled payment status
  amountPaid?: number; // Actual amount paid (can be different from event price)
  paymentDate?: Date; // When payment was recorded
  pickup?: string;
  medical?: string;
  notes?: string;
  checkedIn?: boolean;
  checkedInAt?: Date;
  checkedInBy?: string; // Trainer UID who checked them in
  createdAt: Date;
  paidAt?: Date; // Original field (keeping for backwards compatibility)
}

export interface Media {
  id: string;
  ownerUid: string;
  type: 'image' | 'video' | 'youtube';
  title: string;
  srcUrl: string;
  storagePath?: string;
  thumbUrl?: string;
  tags: string[];
  createdAt: Date;
}

export interface Consent {
  id: string;
  uid: string;
  type: 'parental' | 'liability' | 'medical' | 'media';
  signedAt: Date;
  ip: string;
  docUrl?: string;
}

export interface Bundle {
  id: string;
  title: string;
  description: string;
  priceNis: number;
  eventIds: string[];
  replacementEventIds?: string[];
  publish: boolean;
  status?: 'active' | 'draft' | 'expired';
  validUntil?: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt?: Date;
}

export interface BundleRegistration {
  id: string;
  bundleId: string;
  uid: string;
  status: 'pending' | 'paid' | 'cancelled';
  paymentStatus?: 'paid' | 'pending' | 'free';
  amountPaid?: number;
  paymentDate?: Date;
  paymentIntentId?: string;
  eventRegistrations: BundleEventRegistration[];
  skippedEvents?: SkippedEventInfo[];
  createdAt: Date;
  updatedAt?: Date;
}

export interface BundleEventRegistration {
  eventId: string;
  registrationId: string;
  status: 'registered' | 'replaced' | 'skipped';
  replacementEventId?: string;
}

export interface SkippedEventInfo {
  originalEventId: string;
  reason: 'completed' | 'cancelled' | 'full' | 'no_replacement';
  eventTitle: string;
}