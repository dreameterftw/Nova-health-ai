import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

const QA = [
  {
    q: "Who can see my health data?",
    a: "Your health data stays in your account. NOVA uses it to personalize your briefings, chat, HealthPulse insights, and report summaries.",
  },
  {
    q: "Is my data sold or used for ads?",
    a: "No. NOVA does not use your health data for advertising and does not sell it to third parties.",
  },
  {
    q: "What happens when I upload a report?",
    a: "The report is stored in your private vault. NOVA reads it to extract useful health markers and compare future reports when possible.",
  },
  {
    q: "Does NOVA diagnose me?",
    a: "No. NOVA can explain information in plain language and help you prepare questions, but it does not diagnose conditions or replace a clinician.",
  },
  {
    q: "What does Family Circle see?",
    a: "Trusted contacts are used for SOS support. They do not get open access to your vault, chat, or HealthPulse history.",
  },
  {
    q: "Can I export my information?",
    a: "Yes. You can export your clinical data from settings whenever you want.",
  },
];

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-[#F8F9FC] px-5 py-8">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-black text-slate-500 no-underline">
          <ArrowLeft size={16} />
          Back to NOVA
        </Link>

        <section className="rounded-[32px] bg-white border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-5">
            <Shield size={22} />
          </div>
          <h1 className="text-3xl font-black text-slate-950" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
            Privacy, in plain English
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            NOVA handles sensitive health information, so the rule is simple: your data should help you, not follow you around the internet.
          </p>
        </section>

        <section className="space-y-3">
          {QA.map((item) => (
            <article key={item.q} className="rounded-3xl bg-white border border-slate-200 p-5">
              <h2 className="text-sm font-black text-slate-900">{item.q}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.a}</p>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}
