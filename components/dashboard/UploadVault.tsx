"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader, FileText, Database, Shield, TrendingUp, TrendingDown, Minus, GitCompare, MessageCircle } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  green: "#10B981",
  rose: "#F43F5E",
  gold: "#D97706",
  teal: "#0D9488",
};

type AnalysisResult = {
  type: string;
  markers?: { name: string; value: number; unit?: string; status?: string }[];
  findings: string[];
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
  firstAid?: string[];
};

type ReportComparison = {
  currentId?: string;
  previousId: string;
  reportType: string;
  currentDate: string;
  previousDate: string;
  rows: {
    marker: string;
    previous: number;
    current: number;
    unit?: string;
    change: number;
    direction: "up" | "down" | "flat";
    status: string;
  }[];
  notTestedThisTime: string[];
  interpretation: string;
};

type UploadedFile = {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "uploading" | "analyzing" | "complete";
  result?: AnalysisResult;
  comparison?: ReportComparison | null;
  ext: string;
  url?: string;
  createdAt: any;
  discussedWithNOVA?: boolean;
};

const RISK_CONFIG = {
  low: { color: "#166534", bg: "#F0FDF4", border: "#BBF7D0", label: "Low Risk" },
  medium: { color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", label: "Moderate" },
  high: { color: "#9F1239", bg: "#FFF1F2", border: "#FECDD3", label: "High — Seek Care" },
};

function toDate(value: any): Date {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return new Date(value || Date.now());
}

function formatMonth(value: any) {
  return toDate(value).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
}

function markerPreview(file: UploadedFile) {
  const marker = file.result?.markers?.[0];
  if (marker) return `${marker.name}: ${marker.value}${marker.unit ? ` ${marker.unit}` : ""}`;
  return file.result?.findings?.[0] || "Ready to review";
}

// ADDED — direction arrow with colour coding for the comparison table
function DirectionIcon({ direction, change }: { direction: "up" | "down" | "flat"; change: number }) {
  if (direction === "flat") return <Minus size={13} color={C.textSoft} />;
  if (direction === "up")
    return <TrendingUp size={13} color={change > 0 ? C.green : C.rose} />;
  return <TrendingDown size={13} color={change < 0 ? C.rose : C.green} />;
}

// ADDED — computes a comparison between two complete reports of the same type
// Called client-side; falls back to /api/vault/compare if markers are absent
async function buildComparison(
  current: UploadedFile,
  previous: UploadedFile,
  token: string
): Promise<ReportComparison | null> {
  // If both have markers locally, compute inline without a round-trip
  const curMarkers = current.result?.markers ?? [];
  const prevMarkers = previous.result?.markers ?? [];

  if (curMarkers.length > 0 && prevMarkers.length > 0) {
    const prevMap: Record<string, (typeof prevMarkers)[0]> = {};
    for (const m of prevMarkers) prevMap[m.name] = m;

    const rows: ReportComparison["rows"] = [];
    const notTestedThisTime: string[] = [];

    for (const m of curMarkers) {
      const prev = prevMap[m.name];
      if (!prev) continue;
      const change = parseFloat((m.value - prev.value).toFixed(2));
      const direction: "up" | "down" | "flat" =
        Math.abs(change) < 0.01 ? "flat" : change > 0 ? "up" : "down";
      rows.push({
        marker: m.name,
        previous: prev.value,
        current: m.value,
        unit: m.unit,
        change,
        direction,
        status: m.status ?? "normal",
      });
    }

    // Markers in previous but absent from current
    for (const m of prevMarkers) {
      if (!curMarkers.find((c) => c.name === m.name)) {
        notTestedThisTime.push(m.name);
      }
    }

    const improving = rows.filter((r) => r.direction === "down" && r.status !== "normal").length;
    const worsening = rows.filter((r) => r.direction === "up" && r.status !== "normal").length;
    const interpretation =
      worsening > improving
        ? `${worsening} marker${worsening > 1 ? "s" : ""} moved in an unfavourable direction since your last ${current.result?.type ?? "report"}. Consider discussing with your doctor.`
        : improving > 0
          ? `${improving} marker${improving > 1 ? "s" : ""} improved since your last ${current.result?.type ?? "report"}. Keep it up.`
          : `Markers are broadly stable compared to your previous ${current.result?.type ?? "report"}.`;

    return {
      currentId: current.id,
      previousId: previous.id,
      reportType: current.result?.type ?? current.type,
      currentDate: toDate(current.createdAt).toISOString(),
      previousDate: toDate(previous.createdAt).toISOString(),
      rows,
      notTestedThisTime,
      interpretation,
    };
  }

  // Server fallback when markers aren't embedded in the Firestore doc
  try {
    const res = await fetch("/api/vault/compare", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ currentId: current.id, previousId: previous.id }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.comparison ?? null;
  } catch {
    return null;
  }
}

// ADDED — Longitudinal comparison panel rendered in the right column
function ComparisonPanel({
  comparison,
  currentFile,
  previousFile,
  onDismiss,
  onTalkToNOVA,
}: {
  comparison: ReportComparison;
  currentFile: UploadedFile;
  previousFile: UploadedFile;
  onDismiss: () => void;
  onTalkToNOVA: () => void;
}) {
  const hasRows = comparison.rows.length > 0;

  return (
    <motion.div
      key="comparison"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="rounded-[40px] bg-white border border-slate-200 shadow-2xl shadow-indigo-600/5 overflow-hidden"
    >
      {/* Banner */}
      <div className="h-24 px-6 flex items-end justify-between"
        style={{ background: "linear-gradient(135deg, #EEF2FF 0%, #F0FDFA 100%)" }}>
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 block"
            style={{ color: C.indigoDark }}>
            Longitudinal Comparison
          </span>
          <h3 className="text-xl font-black" style={{ color: C.text }}>
            {comparison.reportType}
          </h3>
        </div>
        <button onClick={onDismiss}
          className="w-9 h-9 rounded-xl flex items-center justify-center mb-2"
          style={{ background: "rgba(255,255,255,0.7)", border: `1px solid ${C.border}` }}>
          <X size={16} color={C.textSoft} />
        </button>
      </div>

      <div className="p-6 space-y-5">
        {/* Date range header */}
        <div className="flex items-center gap-3 text-xs font-bold"
          style={{ color: C.textSoft }}>
          <span className="px-2.5 py-1 rounded-full"
            style={{ background: C.surface2, color: C.textMid }}>
            {formatMonth(previousFile.createdAt)}
          </span>
          <div className="flex-1 h-px" style={{ background: C.border }} />
          <span className="px-2.5 py-1 rounded-full"
            style={{ background: "#EEF2FF", color: C.indigoDark, border: `1px solid #C7D2FE` }}>
            {formatMonth(currentFile.createdAt)} · latest
          </span>
        </div>

        {/* Interpretation callout */}
        <div className="rounded-2xl p-4 flex gap-3"
          style={{ background: "#EEF2FF", border: `1px solid #C7D2FE` }}>
          <GitCompare size={16} color={C.indigoDark} className="flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-semibold" style={{ color: C.textMid }}>
            {comparison.interpretation}
          </p>
        </div>

        {/* Marker table */}
        {hasRows ? (
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-3"
              style={{ color: C.textSoft }}>
              Marker Changes
            </h4>
            <div className="rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${C.border}` }}>
              {/* Table header */}
              <div className="grid grid-cols-[1fr_80px_80px_56px] gap-0 px-4 py-2"
                style={{ background: C.surface2, borderBottom: `1px solid ${C.border}` }}>
                {["Marker", "Before", "Now", "Δ"].map((h) => (
                  <p key={h} className="text-[9px] font-black uppercase tracking-widest"
                    style={{ color: C.textSoft }}>{h}</p>
                ))}
              </div>
              {/* Rows */}
              {comparison.rows.map((row, i) => {
                const isAbnormal = row.status !== "normal";
                const changeColor =
                  row.direction === "flat" ? C.textSoft :
                    row.direction === "up" && isAbnormal ? C.rose :
                      row.direction === "down" && isAbnormal ? C.green :
                        C.textSoft;

                return (
                  <motion.div
                    key={row.marker}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    className="grid grid-cols-[1fr_80px_80px_56px] gap-0 px-4 py-3 items-center"
                    style={{
                      borderBottom: i < comparison.rows.length - 1 ? `1px solid ${C.border}` : "none",
                      background: isAbnormal ? `${C.rose}06` : "transparent",
                    }}>
                    {/* Marker name */}
                    <div>
                      <p className="text-xs font-black" style={{ color: C.text }}>
                        {row.marker}
                      </p>
                      {row.unit && (
                        <p className="text-[9px]" style={{ color: C.textSoft }}>{row.unit}</p>
                      )}
                    </div>
                    {/* Previous */}
                    <p className="text-xs font-semibold" style={{ color: C.textSoft }}>
                      {row.previous}
                    </p>
                    {/* Current */}
                    <p className="text-xs font-black"
                      style={{ color: isAbnormal ? C.rose : C.text }}>
                      {row.current}
                    </p>
                    {/* Delta */}
                    <div className="flex items-center gap-1">
                      <DirectionIcon direction={row.direction} change={row.change} />
                      <span className="text-[10px] font-black"
                        style={{ color: changeColor }}>
                        {row.change > 0 ? "+" : ""}{row.change}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="rounded-2xl p-5 text-center"
            style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
            <p className="text-sm font-black" style={{ color: C.textMid }}>
              No common markers found
            </p>
            <p className="text-xs mt-1" style={{ color: C.textSoft }}>
              These reports may be different types or markers weren't extracted. Ask NOVA to interpret them together.
            </p>
          </div>
        )}

        {/* Not tested this time */}
        {comparison.notTestedThisTime.length > 0 && (
          <div>
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-2"
              style={{ color: C.textSoft }}>
              Not tested this time
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {comparison.notTestedThisTime.map((m) => (
                <span key={m}
                  className="text-[10px] px-2.5 py-1 rounded-full font-bold"
                  style={{ background: "#FFFBEB", color: C.gold, border: `1px solid #FDE68A` }}>
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Talk to NOVA CTA */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onTalkToNOVA}
          className="w-full py-3.5 rounded-2xl text-sm font-black text-white flex items-center justify-center gap-2"
          style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})` }}>
          <MessageCircle size={15} />
          Ask NOVA about these changes
        </motion.button>

        <div className="flex items-start gap-2 p-3 rounded-2xl"
          style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
          <Shield size={13} color="#9F1239" className="flex-shrink-0 mt-0.5" />
          <p className="text-[10px] font-black leading-relaxed"
            style={{ color: "#9F1239" }}>
            Comparison is AI-generated. Always confirm significant changes with your doctor before acting on them.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function UploadVault({ onNavigateToChat }: { onNavigateToChat?: () => void }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  // ADDED — comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [compareTarget, setCompareTarget] = useState<UploadedFile | null>(null);
  const [activeComparison, setActiveComparison] = useState<{
    comparison: ReportComparison;
    current: UploadedFile;
    previous: UploadedFile;
  } | null>(null);
  const [comparingId, setComparingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadVault() {
      const user = auth.currentUser;
      if (!user) { setIsInitialLoading(false); return; }
      try {
        const q = query(
          collection(db, "medicalVault"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const loadedFiles = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as UploadedFile[];
        setFiles(loadedFiles);
      } catch {
        setFiles([]);
      } finally {
        setIsInitialLoading(false);
      }
    }
    loadVault();
  }, []);

  const processFile = useCallback(async (file: File) => {
    const user = auth.currentUser;
    if (!user) return;

    const fileId = `f-${Date.now()}`;
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const tempFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      type: file.name.toLowerCase().includes("blood") ? "Blood Report" : "Medical Document",
      status: "uploading",
      ext,
      createdAt: new Date(),
    };

    setFiles((prev) => [tempFile, ...prev]);

    try {
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append("file", file);
      formData.append("fileName", file.name);
      formData.append("type", tempFile.type);

      const response = await fetch("/api/vault/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error(await response.text());
      const uploaded = await response.json();
      if (uploaded.error) throw new Error(uploaded.error);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === fileId
            ? { ...f, id: uploaded.id, status: "complete", result: uploaded.result, url: uploaded.url }
            : f
        )
      );
    } catch {
      setFiles((prev) => prev.filter((f) => f.id !== fileId));
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    Array.from(e.dataTransfer.files).forEach((f) => processFile(f));
  }, [processFile]);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    Array.from(e.target.files || []).forEach((f) => processFile(f));
    e.target.value = "";
  };

  // ADDED — when user picks a second file in compare mode, run the comparison
  const handleCompareSelect = useCallback(async (file: UploadedFile) => {
    if (!compareTarget || file.id === compareTarget.id) return;

    setComparingId(file.id);
    const user = auth.currentUser;
    if (!user) { setComparingId(null); return; }

    const token = await user.getIdToken();
    // Treat the more recent file as current, older as previous
    const [current, previous] =
      toDate(compareTarget.createdAt) >= toDate(file.createdAt)
        ? [compareTarget, file]
        : [file, compareTarget];

    const comparison = await buildComparison(current, previous, token);
    setComparingId(null);

    if (comparison) {
      setActiveComparison({ comparison, current, previous });
      setSelectedFile(null);
    }

    setCompareMode(false);
    setCompareTarget(null);
  }, [compareTarget]);

  // ADDED — enter compare mode: first click sets compareTarget, second triggers handleCompareSelect
  const handleFileClick = useCallback((file: UploadedFile) => {
    if (file.status !== "complete") return;

    if (!compareMode) {
      setSelectedFile(file);
      setActiveComparison(null);
      return;
    }

    if (!compareTarget) {
      setCompareTarget(file);
      return;
    }

    void handleCompareSelect(file);
  }, [compareMode, compareTarget, handleCompareSelect]);

  // ADDED — group complete files by report type for the compare picker
  const completeFiles = files.filter((f) => f.status === "complete");
  const reportTypeGroups = completeFiles.reduce<Record<string, UploadedFile[]>>((acc, f) => {
    const type = f.result?.type ?? f.type;
    if (!acc[type]) acc[type] = [];
    acc[type].push(f);
    return acc;
  }, {});
  const comparableTypes = Object.entries(reportTypeGroups).filter(([, group]) => group.length >= 2);

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="rounded-[40px] p-8 bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              Business Ready Deployment
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2"
            style={{ fontFamily: "var(--font-outfit)" }}>
            Clinical Data Vault
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            All documents are encrypted and stored in your private clinical vault. Our AI analyses your reports in real-time and tracks how your markers change over time.
          </p>
        </div>
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1 group">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-indigo-50 group-hover:border-indigo-100">
              <Shield size={24} className="text-slate-400 group-hover:text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Secure</span>
          </div>
          <div className="flex flex-col items-center gap-1 group">
            <div className="w-14 h-14 rounded-3xl bg-slate-50 border border-slate-100 flex items-center justify-center transition-all group-hover:scale-110 group-hover:bg-indigo-50 group-hover:border-indigo-100">
              <Database size={24} className="text-slate-400 group-hover:text-indigo-600" />
            </div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Vault</span>
          </div>
          {/* ADDED — Compare button in header, only visible when 2+ same-type reports exist */}
          {comparableTypes.length > 0 && (
            <div className="flex flex-col items-center gap-1 group">
              <motion.button
                whileTap={{ scale: 0.94 }}
                onClick={() => {
                  setCompareMode((v) => !v);
                  setCompareTarget(null);
                  setActiveComparison(null);
                  setSelectedFile(null);
                }}
                className="w-14 h-14 rounded-3xl flex items-center justify-center transition-all"
                style={{
                  background: compareMode ? C.indigo : "#F8FAFF",
                  border: `1.5px solid ${compareMode ? C.indigo : "#C7D2FE"}`,
                }}>
                <GitCompare size={24} color={compareMode ? "#fff" : C.indigo} />
              </motion.button>
              <span className="text-[10px] font-black uppercase tracking-tighter"
                style={{ color: compareMode ? C.indigo : "#94A3B8" }}>
                {compareMode ? "Cancel" : "Compare"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ADDED — Compare mode instruction banner */}
      <AnimatePresence>
        {compareMode && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl px-5 py-3.5 flex items-center gap-3"
            style={{ background: "#EEF2FF", border: `1.5px solid #C7D2FE` }}>
            <GitCompare size={16} color={C.indigoDark} />
            <div className="flex-1">
              <p className="text-xs font-black" style={{ color: C.indigoDark }}>
                {!compareTarget
                  ? "Select the first report to compare"
                  : `"${compareTarget.name}" selected — now pick the second report`}
              </p>
              <p className="text-[10px]" style={{ color: C.textSoft }}>
                Pick two reports of the same type to see how your markers have changed
              </p>
            </div>
            {compareTarget && (
              <button onClick={() => setCompareTarget(null)}
                className="text-[10px] font-black px-2.5 py-1 rounded-full"
                style={{ background: "rgba(91,94,244,0.12)", color: C.indigo }}>
                Reset
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          {/* Upload zone — hidden during compare mode */}
          {!compareMode && (
            <motion.div
              onDragEnter={() => setIsDragging(true)}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              className="relative rounded-[32px] border-2 border-dashed p-10 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/30 overflow-hidden"
              style={{ borderColor: isDragging ? "#6366f1" : "rgba(203,213,225,0.4)" }}>
              <input type="file" multiple onChange={handleInput}
                className="absolute inset-0 opacity-0 cursor-pointer z-10" />
              <div className="relative z-0 flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-[32px] bg-white shadow-xl flex items-center justify-center border border-slate-100">
                  <Upload size={32} className="text-indigo-600" />
                </div>
                <div>
                  <p className="font-black text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>
                    Click or Drag to Upload
                  </p>
                  <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">
                    Supports PDF, DICOM, Images
                  </p>
                </div>
              </div>
              {isDragging && (
                <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] pointer-events-none" />
              )}
            </motion.div>
          )}

          {!compareMode && (
            <p className="px-2 text-[11px] font-semibold leading-relaxed text-slate-500">
              Reports are encrypted at rest and never shared with third parties. Only you and NOVA can access this.
            </p>
          )}

          {/* File list */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-2">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Document History
              </h4>
              {/* ADDED — comparable types hint */}
              {comparableTypes.length > 0 && !compareMode && (
                <p className="text-[10px] font-bold" style={{ color: C.indigo }}>
                  {comparableTypes.length} type{comparableTypes.length > 1 ? "s" : ""} comparable
                </p>
              )}
            </div>

            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {isInitialLoading ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-20">
                  <Loader size={30} className="animate-spin mb-2" />
                  <p className="text-xs font-black uppercase tracking-widest">Loading Vault...</p>
                </div>
              ) : files.length > 0 ? (
                <AnimatePresence>
                  {files.map((file) => {
                    const isSelected = selectedFile?.id === file.id;
                    const isCompareFirst = compareTarget?.id === file.id;
                    const isComparing = comparingId === file.id;

                    return (
                      <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border group ${isSelected
                            ? "bg-white border-indigo-200 shadow-lg shadow-indigo-600/5 ring-2 ring-indigo-600/5"
                            : isCompareFirst
                              ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                              : "bg-white border-slate-100 hover:border-indigo-100"
                          }`}
                        onClick={() => handleFileClick(file)}>
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors relative">
                            <FileText size={24} />
                            {/* ADDED — discussedWithNOVA badge */}
                            {file.discussedWithNOVA && (
                              <div className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center"
                                style={{ background: C.teal, border: "2px solid white" }}>
                                <MessageCircle size={8} color="white" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-black text-slate-900 truncate">{file.name}</h5>
                            {/* ADDED — marker preview shown under filename */}
                            {file.status === "complete" && (
                              <p className="text-[10px] font-semibold truncate mt-0.5"
                                style={{ color: C.textSoft }}>
                                {markerPreview(file)}
                              </p>
                            )}
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                              {file.size} · {formatMonth(file.createdAt)}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            {file.status === "uploading" && (
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 italic">
                                <Loader size={10} className="animate-spin" /> SYNCING
                              </div>
                            )}
                            {file.status === "analyzing" && (
                              <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 italic">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> AI ANALYZING
                              </div>
                            )}
                            {file.status === "complete" && !isComparing && (
                              <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                READY
                              </div>
                            )}
                            {isComparing && (
                              <Loader size={14} className="animate-spin" color={C.indigo} />
                            )}
                            {/* ADDED — compare badge when this file is the first selection */}
                            {isCompareFirst && (
                              <span className="text-[9px] font-black px-2 py-0.5 rounded-full"
                                style={{ background: C.indigo, color: "white" }}>
                                1st
                              </span>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              ) : (
                <div className="text-center py-12 rounded-[32px] bg-slate-50/50 border border-slate-100 border-dashed">
                  <Database size={40} className="mx-auto text-slate-200 mb-4" />
                  <p className="text-sm font-black text-slate-500">No reports uploaded yet</p>
                  <p className="text-xs text-slate-400 mt-2 max-w-xs mx-auto leading-relaxed">
                    Upload blood tests, prescriptions, imaging notes, or visit summaries. NOVA will extract key markers and compare future reports against them.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ADDED — comparable type shortcuts when not in compare mode */}
          {!compareMode && comparableTypes.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-[10px] font-black uppercase tracking-widest px-2"
                style={{ color: C.textSoft }}>
                Quick compare
              </h4>
              {comparableTypes.map(([type, group]) => {
                const [latest, previous] = group;
                return (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.97 }}
                    onClick={async () => {
                      setActiveComparison(null);
                      setSelectedFile(null);
                      setComparingId(latest.id);
                      const user = auth.currentUser;
                      if (!user) return;
                      const token = await user.getIdToken();
                      const comparison = await buildComparison(latest, previous, token);
                      setComparingId(null);
                      if (comparison) setActiveComparison({ comparison, current: latest, previous });
                    }}
                    className="w-full rounded-2xl px-4 py-3 flex items-center gap-3 text-left"
                    style={{ background: C.surface, border: `1px solid ${C.border}` }}>
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{ background: "#EEF2FF", border: `1px solid #C7D2FE` }}>
                      <GitCompare size={14} color={C.indigo} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-black" style={{ color: C.text }}>{type}</p>
                      <p className="text-[10px]" style={{ color: C.textSoft }}>
                        {formatMonth(previous.createdAt)} → {formatMonth(latest.createdAt)}
                      </p>
                    </div>
                    {comparingId === latest.id ? (
                      <Loader size={14} className="animate-spin" color={C.indigo} />
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M9 18l6-6-6-6" stroke={C.textSoft} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    )}
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right column — analysis or comparison */}
        <div className="lg:sticky lg:top-4 h-fit">
          <AnimatePresence mode="wait">
            {/* ADDED — comparison panel takes priority */}
            {activeComparison ? (
              <ComparisonPanel
                comparison={activeComparison.comparison}
                currentFile={activeComparison.current}
                previousFile={activeComparison.previous}
                onDismiss={() => setActiveComparison(null)}
                onTalkToNOVA={() => {
                  setActiveComparison(null);
                  onNavigateToChat?.();
                }}
              />
            ) : selectedFile?.result ? (
              <motion.div
                key={selectedFile.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-[40px] bg-white border border-slate-200 shadow-2xl shadow-indigo-600/5 overflow-hidden">
                {/* Banner */}
                <div className="h-24 p-6 flex items-end justify-between"
                  style={{ background: RISK_CONFIG[selectedFile.result.riskLevel].bg }}>
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 block"
                      style={{ color: RISK_CONFIG[selectedFile.result.riskLevel].color }}>
                      Pathology Insight
                    </span>
                    <h3 className="text-xl font-black"
                      style={{ color: RISK_CONFIG[selectedFile.result.riskLevel].color }}>
                      {selectedFile.result.type}
                    </h3>
                  </div>
                  <div className="px-4 py-1.5 rounded-full bg-white text-xs font-black shadow-sm"
                    style={{ color: RISK_CONFIG[selectedFile.result.riskLevel].color }}>
                    {RISK_CONFIG[selectedFile.result.riskLevel].label}
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      Diagnostic Findings
                    </h4>
                    <div className="space-y-3">
                      {selectedFile.result.findings.map((f, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                          <div className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                            <div className="w-1.5 h-1.5 rounded-full"
                              style={{ background: selectedFile.result ? RISK_CONFIG[selectedFile.result.riskLevel].color : "#94A3B8" }} />
                          </div>
                          <p className="text-xs font-semibold leading-relaxed text-slate-600">{f}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
                      NOVA Clinical Directives
                    </h4>
                    <div className="space-y-2">
                      {selectedFile.result.recommendations.map((r, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 text-xs font-bold text-slate-700">
                          <CheckCircle size={14} className="text-indigo-600 shrink-0 mt-0.5" />
                          {r}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-start gap-3">
                    <Shield size={16} className="text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] font-black text-rose-900/60 uppercase leading-loose">
                      Disclaimer: This AI analysis is intended for clinical triage only. Please cross-reference with your primary care provider.
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-colors">
                      Sync with Doctor
                    </button>
                    <button
                      onClick={() => setSelectedFile(null)}
                      className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors border border-slate-100">
                      <X size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] rounded-[40px] border-4 border-slate-50 border-dotted flex flex-col items-center justify-center p-12 text-center text-slate-300">
                {compareMode ? (
                  <>
                    <GitCompare size={60} className="mb-6 opacity-20" />
                    <p className="font-black text-sm uppercase tracking-[0.2em] opacity-30">
                      {!compareTarget ? "Select report one" : "Now select report two"}
                    </p>
                  </>
                ) : (
                  <>
                    <FileText size={60} className="mb-6 opacity-20" />
                    <p className="font-black text-sm uppercase tracking-[0.2em] opacity-30">
                      Select a document<br />for deep analysis
                    </p>
                  </>
                )}
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}