import { NextResponse } from "next/server";

export type SmsRequestBody = {
  recipients: string[];
  message: string;
  payload?: Record<string, unknown>;
  headers?: Record<string, string>;
};

export async function POST(req: Request) {
  try {
    const { recipients, message, payload, headers } = (await req.json()) as SmsRequestBody;
    const cleanRecipients = Array.isArray(recipients)
      ? recipients.map((r) => String(r).trim()).filter((r) => r)
      : [];
    const text = String(message || "").trim();

    if (!cleanRecipients.length || !text) {
      return NextResponse.json(
        { error: "Recipients and message are required to send an SMS." },
        { status: 400 }
      );
    }

    const textbeltKey = process.env.TEXTBELT_KEY || "textbelt";
    const textbeltUrl = process.env.TEXTBELT_URL || "https://textbelt.com/text";

    const requestHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...headers,
    };

    const recipientResults = await Promise.all(
      cleanRecipients.map(async (recipient) => {
        const body = payload ?? { phone: recipient, message: text, key: textbeltKey };
        const response = await fetch(textbeltUrl, {
          method: "POST",
          headers: requestHeaders,
          body: JSON.stringify(body),
        });

        const textResponse = await response.text();
        let responseData: unknown;
        try {
          responseData = JSON.parse(textResponse);
        } catch {
          responseData = textResponse;
        }

        return { recipient, ok: response.ok, status: response.status, response: responseData };
      })
    );

    const failed = recipientResults.filter((result) => !result.ok);
    if (failed.length) {
      return NextResponse.json(
        {
          error: "Textbelt SMS provider returned an error for one or more recipients.",
          details: failed,
          results: recipientResults,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, results: recipientResults });
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("SMS API Error:", error);
    }

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { error: "Failed to send SMS via Textbelt.", details: errorMessage },
      { status: 500 }
    );
  }
}
