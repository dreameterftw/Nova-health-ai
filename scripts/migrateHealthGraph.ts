import { getAdminDb } from "@/lib/firebaseAdmin";
import { HEALTH_GRAPH_FIELD } from "@/lib/healthGraph";

async function migrateHealthGraphs() {
  const db = getAdminDb();
  const usersSnapshot = await db.collection("users").get();
  let migrated = 0;

  for (const userDoc of usersSnapshot.docs) {
    const uid = userDoc.id;
    const oldRef = db.collection("users").doc(uid).collection("private").doc("healthGraph");
    const oldSnap = await oldRef.get();

    if (!oldSnap.exists) continue;

    const oldData = oldSnap.data();
    if (!oldData) continue;

    await db.collection("users").doc(uid).set({ [HEALTH_GRAPH_FIELD]: oldData }, { merge: true });
    await oldRef.delete();
    migrated += 1;
    console.log(`Migrated health graph for ${uid}`);
  }

  console.log(`Migration complete. Migrated ${migrated} health graph(s).`);
}

migrateHealthGraphs().catch((error) => {
  console.error("Health graph migration failed:", error);
  process.exitCode = 1;
});
