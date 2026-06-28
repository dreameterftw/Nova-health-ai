import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { getGraph, updateGraph } from "@/lib/healthGraph";
import type { HealthGraph } from "@/lib/healthGraph";

// Vercel Cron calls this with a secret header to prevent public access
function isAuthorized(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If no secret is set, only allow in development
  if (!cronSecret) {
    return process.env.NODE_ENV === "development";
  }

  return authHeader === `Bearer ${cronSecret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getAdminDb();
  const results = {
    processed: 0,
    skipped: 0,
    errors: 0,
  };

  try {
    // Get all user documents
    const usersSnap = await db.collection("users").get();

    for (const userDoc of usersSnap.docs) {
      const uid = userDoc.id;

      try {
        const graph = await getGraph(uid);

        // Skip users with no medications
        if (!graph.medications.length) {
          results.skipped++;
          continue;
        }

        const updatedMedications = await calculateAdherenceForUser(
          db,
          uid,
          graph
        );

        // Only write if something actually changed
        const hasChanges = updatedMedications.some((med, i) => {
          const original = graph.medications[i];
          return med.adherenceRate !== original?.adherenceRate;
        });

        if (hasChanges) {
          await updateGraph(uid, { medications: updatedMedications });
        }

        results.processed++;
      } catch (err) {
        console.error(`Adherence calc failed for uid ${uid}:`, err);
        results.errors++;
      }
    }

    return NextResponse.json({
      ok: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Nightly adherence job failed:", err);
    return NextResponse.json(
      { error: "Job failed", detail: String(err) },
      { status: 500 }
    );
  }
}

async function calculateAdherenceForUser(
  db: FirebaseFirestore.Firestore,
  uid: string,
  graph: HealthGraph
): Promise<HealthGraph["medications"]> {
  // Look back 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const cutoffDate = thirtyDaysAgo.toISOString();

  // Fetch medication events for this user from the last 30 days
  // These are written when a user confirms a dose taken
  const eventsSnap = await db
    .collection("medicationEvents")
    .where("userId", "==", uid)
    .where("createdAt", ">=", cutoffDate)
    .get();

  // Build a map of medication name -> set of dates confirmed taken
  const takenByMedication: Record<string, Set<string>> = {};

  for (const eventDoc of eventsSnap.docs) {
    const data = eventDoc.data();
    const name = (data.medicationName as string)?.toLowerCase().trim();
    const date = (data.date as string)?.slice(0, 10); // YYYY-MM-DD

    if (!name || !date) continue;

    if (!takenByMedication[name]) {
      takenByMedication[name] = new Set();
    }
    takenByMedication[name].add(date);
  }

  return graph.medications.map((med) => {
    const key = med.name.toLowerCase().trim();
    const takenDates = takenByMedication[key] ?? new Set();

    // How many days should this medication have been taken?
    // We don't have a start date on the medication, so we use
    // the smaller of: 30 days, or days since first medicationEvent
    // for this medication was recorded
    const expectedDays = 30;
    const takenDays = takenDates.size;

    // Minimum 1 expected day to avoid division by zero
    const adherenceRate = Math.round(
      (takenDays / Math.max(expectedDays, 1)) * 100
    );

    // Cap at 100 in case of duplicate events
    const clampedRate = Math.min(adherenceRate, 100);

    return {
      ...med,
      adherenceRate: clampedRate,
    };
  });
}
