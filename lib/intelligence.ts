export type AnalysisResult = {
  type: string;
  findings: string[];
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
  firstAid?: string[];
};

function extractJsonObject(text: string): unknown {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1] || text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Model response did not include a JSON object.");
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

function normalizeAnalysis(value: unknown): AnalysisResult {
  const data = value && typeof value === "object" ? value as Partial<AnalysisResult> : {};
  const riskLevel = data.riskLevel === "medium" || data.riskLevel === "high" ? data.riskLevel : "low";

  return {
    type: typeof data.type === "string" && data.type.trim() ? data.type : "Clinical Document Review",
    findings: Array.isArray(data.findings) && data.findings.length
      ? data.findings.map(String).slice(0, 8)
      : ["NOVA could not identify concrete clinical findings from the provided text."],
    riskLevel,
    recommendations: Array.isArray(data.recommendations) && data.recommendations.length
      ? data.recommendations.map(String).slice(0, 8)
      : ["Review the original report with a qualified clinician, especially if symptoms are worsening."],
    firstAid: Array.isArray(data.firstAid) ? data.firstAid.map(String).slice(0, 6) : undefined,
  };
}

function unavailableAnalysis(reason: string): AnalysisResult {
  return {
    type: "AI Analysis Unavailable",
    findings: [
      "The document was uploaded, but NOVA could not complete analysis.",
      reason
    ],
    riskLevel: "low",
    recommendations: [
      "Ensure the Groq or OpenRouter API key is correctly configured in your server environment variables.",
      "For urgent symptoms or abnormal reports, contact a qualified clinician or emergency services directly."
    ]
  };
}

/**
 * Resolves which Cloud LLM provider to use for document analysis.
 * Priority: GROQ_API_KEY → OPENROUTER_API_KEY
 */
function resolveProvider(): { apiKey: string; model: string; endpoint: string; headers: Record<string, string> } | null {
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    return {
      apiKey: groqKey,
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      endpoint: "https://api.groq.com/openai/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqKey}`,
      }
    };
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    return {
      apiKey: openRouterKey,
      model: process.env.OPENROUTER_MODEL || "meta-llama/llama-3.1-8b-instruct",
      endpoint: "https://openrouter.ai/api/v1/chat/completions",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openRouterKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "NOVA Health"
      }
    };
  }

  return null;
}

export async function analyzeMedicalDocument(
  documentText: string,
  fileName: string
): Promise<AnalysisResult> {
  const provider = resolveProvider();
  const trimmedText = documentText.trim();

  if (!trimmedText) {
    return unavailableAnalysis("No extractable text was found. Image and scanned PDF analysis requires OCR before NOVA can review the content.");
  }

  if (!provider) {
    return unavailableAnalysis("No AI API key is configured. Please set GROQ_API_KEY or OPENROUTER_API_KEY in your environment variables.");
  }

  try {
    const response = await fetch(provider.endpoint, {
      method: "POST",
      headers: provider.headers,
      body: JSON.stringify({
        model: provider.model,
        messages: [
          {
            role: "user",
            content: `Analyze this medical document named "${fileName}".

Document text:
${trimmedText.slice(0, 12000)}

Return only valid JSON with this exact shape:
{
  "type": "short document/report type",
  "findings": ["specific observations from the document text"],
  "riskLevel": "low" | "medium" | "high",
  "recommendations": ["safe next steps and clinician follow-up guidance"],
  "firstAid": ["optional first aid actions only when relevant"]
}

Rules: do not diagnose, do not invent values not present in the document, flag urgent red flags, and recommend emergency care for life-threatening signs.`
          }
        ],
        temperature: 0.2,
        top_p: 0.8,
        max_tokens: 700
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return unavailableAnalysis(`Cloud LLM returned ${response.status}: ${errorText.slice(0, 240)}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    return normalizeAnalysis(extractJsonObject(content));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Cloud LLM error";
    return unavailableAnalysis(message);
  }
}
