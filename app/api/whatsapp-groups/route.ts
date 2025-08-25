import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase.client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const userGroups = searchParams.get('groups')?.split(',').filter(g => g.trim()) || [];
    
    console.log('Fetching WhatsApp groups for user groups:', userGroups);
    
    if (userGroups.length === 0) {
      return NextResponse.json({ groups: [] });
    }

    // Query for active WhatsApp groups that match user's groups
    const groupsQuery = query(
      collection(db, 'whatsappGroups'),
      where('isActive', '==', true),
      where('group', 'in', userGroups)
    );
    
    const snapshot = await getDocs(groupsQuery);
    const whatsappGroups = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Found WhatsApp groups:', whatsappGroups);
    
    return NextResponse.json({ groups: whatsappGroups });
  } catch (error) {
    console.error('Error fetching WhatsApp groups:', error);
    return NextResponse.json(
      { error: 'Failed to fetch WhatsApp groups' },
      { status: 500 }
    );
  }
}