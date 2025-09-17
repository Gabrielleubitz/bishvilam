/**
 * Diagnostic utilities to help debug Firebase connectivity issues
 */

export async function testFirebaseConnection() {
  try {
    // Dynamic import to avoid SSR issues
    const { collection, getDocs } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase.client');
    
    console.log('🔍 Testing Firebase connection...');
    
    // Test basic connection
    const testQuery = collection(db, 'fallenSoldiers');
    const snapshot = await getDocs(testQuery);
    
    console.log('✅ Firebase connection successful');
    console.log(`📊 Found ${snapshot.size} documents in fallenSoldiers collection`);
    
    // Log each document
    snapshot.docs.forEach((doc, index) => {
      const data = doc.data();
      console.log(`📄 Document ${index + 1}:`, {
        id: doc.id,
        hebrewName: data.hebrewName,
        hasImage: !!data.imageUrl,
        imageUrl: data.imageUrl || 'EMPTY/MISSING',
        slug: data.slug,
        name: data.name,
        rank: data.rank,
        unit: data.unit,
        age: data.age,
        dateOfFalling: data.dateOfFalling
      });
      console.log(`📋 Full data for ${data.hebrewName}:`, data);
    });
    
    return {
      success: true,
      documentCount: snapshot.size,
      documents: snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }))
    };
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    return {
      success: false,
      error: error.message,
      documentCount: 0,
      documents: []
    };
  }
}

export async function testSpecificSoldier(slug: string) {
  try {
    const { doc, getDoc } = await import('firebase/firestore');
    const { db } = await import('@/lib/firebase.client');
    
    console.log(`🔍 Testing soldier lookup for slug: ${slug}`);
    
    const soldierDoc = await getDoc(doc(db, 'fallenSoldiers', slug));
    
    if (soldierDoc.exists()) {
      const data = soldierDoc.data();
      console.log('✅ Soldier found:', {
        id: soldierDoc.id,
        hebrewName: data.hebrewName,
        hasImage: !!data.imageUrl,
        imageUrl: data.imageUrl
      });
      return { success: true, found: true, data };
    } else {
      console.log(`❌ No soldier found with slug: ${slug}`);
      return { success: true, found: false };
    }
    
  } catch (error) {
    console.error('❌ Error testing soldier:', error);
    return { success: false, error: error.message };
  }
}