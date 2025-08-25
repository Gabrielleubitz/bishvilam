// app/api/media/publish/route.ts
import { NextRequest } from "next/server";
import { adminDb } from "@/lib/firebase.admin";
import { getStorage } from "firebase-admin/storage";

export async function POST(req: NextRequest) {
  // Expect: { sourcePath: "user-uploads/<uid>/<file>", destPath: "public/<eventId>/<file>" }
  const { sourcePath, destPath } = await req.json();
  if (!sourcePath || !destPath) return new Response("Bad request", { status: 400 });

  // Verify caller is admin via Firestore profile
  const authz = req.headers.get("authorization") || "";
  const idToken = authz.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!idToken) return new Response("Missing token", { status: 401 });

  // We verify admin by reading the caller profile from Firestore via Admin SDK
  // (adminAuth.verifyIdToken is optional if you pass uid in headers; keeping server-side trust here is fine if route is protected upstream)
  try {
    // In case you want strict verification:
    const { getAuth } = await import("firebase-admin/auth");
    const decoded = await getAuth().verifyIdToken(idToken);
    const caller = await adminDb.collection("profiles").doc(decoded.uid).get();
    if (caller.data()?.role !== "admin") return new Response("Forbidden", { status: 403 });

    const bucket = getStorage().bucket();
    await bucket.file(sourcePath).copy(bucket.file(destPath));
    // Optional: delete original
    await bucket.file(sourcePath).delete({ ignoreNotFound: true });

    return Response.json({ ok: true, destPath });
  } catch (e) {
    console.error(e);
    return new Response("Unauthorized", { status: 401 });
  }
}