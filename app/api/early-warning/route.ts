import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { getGraph } from "@/lib/healthGraph";
import { evaluateEarlyWarning } from "@/lib/earlyWarning";

// ADDED — re-evaluate if cached result is older than this
const STALE_THRESHOLD_MINS = parseInt(
  process.env.NOVA_EARLY_WARNING_STALE_MINS ?? "60",
  10
);

function isFresh(updatedAt?: string): boolean {
  if (!updatedAt) return false;
  const ageMs = Date.now() - new Date(updatedAt).getTime();
  return ageMs < STALE_THRESHOLD_MINS * 60 * 1000;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const idToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : authHeader;
    if (!idToken) {
      return NextResponse.json({ error: "Authentication token missing." }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(idToken);
    const graph = await getGraph(decoded.uid);

    // ADDED — return cached result if it's still fresh
    if (graph.earlyWarning && isFresh(graph.earlyWarning.updatedAt)) {
      return NextResponse.json({
        earlyWarning: {
          level: graph.earlyWarning.level,
          reasons: graph.earlyWarning.reasons,
          updatedAt: graph.earlyWarning.updatedAt,
        },
        cached: true,
      });
    }

    // Re-evaluate and stamp with current time
    const result = evaluateEarlyWarning(graph);
    const earlyWarning = {
      level: result.level,
      reasons: result.reasons,
      updatedAt: new Date().toISOString(),
    };

    // ADDED — persist result back to graph so next call within threshold is free
    try {
      await getAdminDb()
        .collection("users")
        .doc(decoded.uid)
        .set(
          { healthGraph: { earlyWarning } },
          { merge: true }
        );
    } catch {
      // best-effort — persist failure doesn't fail the response
    }

    return NextResponse.json({ earlyWarning, cached: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}