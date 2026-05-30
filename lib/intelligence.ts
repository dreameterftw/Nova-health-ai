export type AnalysisResult = {
  type: string;
  findings: string[];
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
  firstAid?: string[];
};

type OllamaChatResponse = {
  message?: {
    content?: string;
  };
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
      "The document was uploaded, but NOVA could not complete local Ollama analysis.",
      reason
    ],
    riskLevel: "low",
    recommendations: [
      "Start Ollama locally with `ollama serve` and create the `nova-health` model before retrying.",
      "For urgent symptoms or abnormal reports, contact a qualified clinician or emergency services directly."
    ]
  };
}

export async function analyzeMedicalDocument(
  documentText: string,
  fileName: string
): Promise<AnalysisResult> {
  const ollamaHost = process.env.OLLAMA_HOST || "http://localhost:11434";
  const ollamaModel = process.env.OLLAMA_MODEL || "nova-health";
  const trimmedText = documentText.trim();

  if (!trimmedText) {
    return unavailableAnalysis("No extractable text was found. Image and scanned PDF analysis requires OCR before NOVA can review the content.");
  }

  try {
    const response = await fetch(`${ollamaHost}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: ollamaModel,
        stream: false,
        options: {
          temperature: 0.2,
          top_p: 0.8,
          num_predict: 700
        },
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
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      return unavailableAnalysis(`Ollama returned ${response.status}: ${errorText.slice(0, 240)}`);
    }

    const data = await response.json() as OllamaChatResponse;
    const content = data.message?.content || "";
    return normalizeAnalysis(extractJsonObject(content));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown Ollama error";
    return unavailableAnalysis(message);
  }
}
