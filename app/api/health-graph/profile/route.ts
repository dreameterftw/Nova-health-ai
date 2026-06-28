import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { seedGraphFromProfile } from "@/lib/healthGraph";

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : authHeader;
    if (!idToken) {
      return NextResponse.json({ error: "Authentication token missing." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const profile = await req.json();
    const graph = await seedGraphFromProfile(decoded.uid, {
      age: typeof profile.age === "number" ? profile.age : null,
      ageRange: typeof profile.ageRange === "string" ? profile.ageRange : null,
      conditions: Array.isArray(profile.conditions)
        ? profile.conditions
        : Array.isArray(profile.allergies)
          ? profile.allergies
          : [],
      goals: Array.isArray(profile.goals) ? profile.goals : [],
      bloodGroup: typeof profile.bloodGroup === "string" ? profile.bloodGroup : null,
      medications: Array.isArray(profile.medications) ? profile.medications : [],
    });

    return NextResponse.json({ graph });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
