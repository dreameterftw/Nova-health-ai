import type { HealthGraph } from "@/lib/healthGraph";

type Level = HealthGraph["earlyWarning"]["level"];

const LEVEL_RANK: Record<Level, number> = { none: 0, yellow: 1, orange: 2, red: 3 };

function maxLevel(current: Level, next: Level): Level {
  return LEVEL_RANK[next] > LEVEL_RANK[current] ? next : current;
}

function daysBetween(date: string, now = new Date()) {
  const then = new Date(`${date}T00:00:00`).getTime();
  const today = new Date(now.toISOString().slice(0, 10)).getTime();
  return Math.floor((today - then) / 86400000);
}

function consecutiveLow(scores: HealthGraph["wellnessScores"], threshold: number) {
  let count = 0;
  for (const entry of [...scores].sort((a, b) => b.date.localeCompare(a.date))) {
    if (entry.score < threshold) count++;
    else break;
  }
  return count;
}

function bestRecentStreak(scores: HealthGraph["wellnessScores"]) {
  const dates = new Set(scores.map((entry) => entry.date));
  let best = 0;
  for (const entry of scores) {
    let streak = 0;
    const cursor = new Date(`${entry.date}T00:00:00`);
    while (dates.has(cursor.toISOString().slice(0, 10))) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
    }
    best = Math.max(best, streak);
  }
  return best;
}

export function evaluateEarlyWarning(graph: HealthGraph): HealthGraph["earlyWarning"] {
  let level: Level = "none";
  const reasons: string[] = [];
  const scores = [...graph.wellnessScores].sort((a, b) => b.date.localeCompare(a.date));

  const lowBelow5 = consecutiveLow(scores, 5);
  const lowBelow4 = consecutiveLow(scores, 4);
  const lowBelow3 = consecutiveLow(scores, 3);
  if (lowBelow5 >= 3) {
    level = maxLevel(level, "yellow");
    reasons.push("Wellness below 5 for 3 consecutive check-ins.");
  }
  if (lowBelow4 >= 3) {
    level = maxLevel(level, "orange");
    reasons.push("Wellness below 4 for 3 consecutive check-ins.");
  }
  if (lowBelow3 >= 2 || lowBelow4 >= 7) {
    level = maxLevel(level, "red");
    reasons.push("Sustained very low wellness scores.");
  }

  if (scores.length >= 2 && scores[1].score - scores[0].score >= 3) {
    level = maxLevel(level, "orange");
    reasons.push("Wellness dropped by 3 or more points in one day.");
  }

  const bestStreak = bestRecentStreak(scores);
  const lastScoreDate = scores[0]?.date;
  const missedDays = lastScoreDate ? daysBetween(lastScoreDate) : 0;
  if (bestStreak >= 5 && missedDays >= 2) {
    level = maxLevel(level, "yellow");
    reasons.push("Check-ins paused after an established streak.");
  }
  if (missedDays >= 3) {
    level = maxLevel(level, "orange");
    reasons.push("Three or more consecutive check-ins missed.");
  }
  if (bestStreak >= 7 && missedDays >= 5) {
    level = maxLevel(level, "red");
    reasons.push("Five or more check-ins missed after a strong streak.");
  }

  const recentSentiment = graph.chatSentiment.slice(0, 5);
  const negativeRun = recentSentiment.findIndex((entry) => entry.valence !== "negative");
  const consecutiveNegative = negativeRun === -1 ? recentSentiment.length : negativeRun;
  if (consecutiveNegative >= 2) {
    level = maxLevel(level, "yellow");
    reasons.push("Recent chat tone has been repeatedly negative.");
  }
  if (consecutiveNegative >= 3 || recentSentiment[0]?.negativeSelfReference) {
    level = maxLevel(level, "orange");
    reasons.push("Chat language suggests a tougher emotional stretch.");
  }
  if (recentSentiment[0]?.crisisLanguage) {
    level = maxLevel(level, "red");
    reasons.push("Recent language included high-risk distress signals.");
  }

  for (const med of graph.medications) {
    const isMentalHealth = /mental|anxiety|depress|psychi|mood|sleep/i.test(`${med.name} ${(med as any).purpose ?? ""}`);
    if (typeof med.adherenceRate !== "number") continue;
    if (isMentalHealth && med.adherenceRate < 60) {
      level = maxLevel(level, "yellow");
      reasons.push(`${med.name} adherence is below 60%.`);
    }
    if (isMentalHealth && med.adherenceRate < 40) {
      level = maxLevel(level, "orange");
      reasons.push(`${med.name} adherence is below 40%.`);
    }
  }

  return {
    level,
    reasons: reasons.slice(0, 4),
    updatedAt: new Date().toISOString(),
  };
}
