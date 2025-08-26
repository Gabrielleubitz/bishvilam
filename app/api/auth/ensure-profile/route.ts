import { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase.admin";

export async function POST(req: NextRequest) {
  const authz = req.headers.get("authorization") || "";
  const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  
  if (!idToken) {
    return new Response("Missing token", { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const ref = adminDb.collection("profiles").doc(uid);
    const snap = await ref.get();

    if (!snap.exists) {
      const profileData = {
        uid: uid,
        role: "student",
        email: decoded.email ?? "",
        firstName: body.firstName || "",
        lastName: body.lastName || "",
        phone: body.phone || "",
        tzId: body.tzId || "",
        dob: body.dob || "",
        emergency: body.emergency || "",
        groups: body.groups || [],
        lang: "he",
        createdAt: new Date()
      };
      
      await ref.set(profileData);

      // Send welcome email to new user and notify admins
      try {
        const userName = `${profileData.firstName} ${profileData.lastName}`.trim() || 
                        decoded.email?.split('@')[0] || 'משתמש חדש';

        const response = await fetch(`${req.nextUrl.origin}/api/send-welcome-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userEmail: profileData.email,
            userName,
            userPhone: profileData.phone,
            userGroups: profileData.groups,
            createdAt: new Date().toLocaleDateString('he-IL')
          }),
        });

        if (response.ok) {
          console.log('✅ Welcome emails sent for new user:', profileData.email);
        } else {
          console.warn('⚠️ Welcome emails failed, but account creation completed');
        }
      } catch (emailError) {
        console.error('❌ Error sending welcome emails:', emailError);
        // Don't fail account creation if emails fail
      }
    }

    const profileData = snap.exists ? snap.data() : await ref.get().then(s => s.data());
    
    return Response.json({ 
      ok: true, 
      profile: profileData 
    });
  } catch (error) {
    console.error("Error ensuring profile:", error);
    return new Response("Unauthorized", { status: 401 });
  }
}