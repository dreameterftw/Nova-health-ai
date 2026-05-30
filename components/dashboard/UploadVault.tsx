"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, X, CheckCircle, Loader, FileText, Database, Shield } from "lucide-react";
import { db, auth } from "@/lib/firebase";
import { collection, query, getDocs, orderBy, where } from "firebase/firestore";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
};

type AnalysisResult = {
  type: string;
  findings: string[];
  riskLevel: "low" | "medium" | "high";
  recommendations: string[];
  firstAid?: string[];
};

type UploadedFile = {
  id: string;
  name: string;
  size: string;
  type: string;
  status: "uploading" | "analyzing" | "complete";
  result?: AnalysisResult;
  ext: string;
  url?: string;
  createdAt: any;
};

const RISK_CONFIG = {
  low: { color: "#166534", bg: "#F0FDF4", border: "#BBF7D0", label: "Low Risk" },
  medium: { color: "#92400E", bg: "#FFFBEB", border: "#FDE68A", label: "Moderate" },
  high: { color: "#9F1239", bg: "#FFF1F2", border: "#FECDD3", label: "High — Seek Care" },
};

export function UploadVault() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState<UploadedFile | null>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Load from Firestore
  useEffect(() => {
    async function loadVault() {
      const user = auth.currentUser;
      if (!user) {
        setIsInitialLoading(false);
        return;
      }

      try {
        const q = query(
          collection(db, "medicalVault"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const snapshot = await getDocs(q);
        const loadedFiles = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as UploadedFile[];
        setFiles(loadedFiles);
      } catch (e) {
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
      // 1. Upload through the secure server API so the Firebase service account stays private.
      const token = await user.getIdToken();
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', file.name);
      formData.append('type', tempFile.type);

      const response = await fetch('/api/vault/upload', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      const uploaded = await response.json();
      if (uploaded.error) {
        throw new Error(uploaded.error);
      }

      setFiles((prev) => prev.map((f) => f.id === fileId ? {
        ...f,
        id: uploaded.id,
        status: 'complete',
        result: uploaded.result,
        url: uploaded.url
      } : f));
    } catch (e) {
      setFiles((prev) => prev.filter(f => f.id !== fileId));
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

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4">
      {/* Header Section */}
      <div className="rounded-[40px] p-8 bg-white border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-3">
            <div className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest">
              Business Ready Deployment
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 leading-tight mb-2" style={{ fontFamily: "var(--font-outfit)" }}>
            Clinical Data Vault
          </h2>
          <p className="text-slate-500 text-sm leading-relaxed">
            All documents are encrypted and stored in your private clinical vault. Our AI analyzes your reports in real-time to provide actionable health insights.
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
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Upload & List */}
        <div className="space-y-4">
          <motion.div
            onDragEnter={() => setIsDragging(true)}
            onDragLeave={() => setIsDragging(false)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="relative rounded-[32px] border-2 border-dashed p-10 text-center cursor-pointer transition-all bg-slate-50/50 hover:bg-indigo-50/30 overflow-hidden"
            style={{ borderColor: isDragging ? "#6366f1" : "rgba(203, 213, 225, 0.4)" }}
          >
            <input type="file" multiple onChange={handleInput} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
            <div className="relative z-0 flex flex-col items-center gap-4">
              <div className="w-20 h-20 rounded-[32px] bg-white shadow-xl flex items-center justify-center border border-slate-100">
                <Upload size={32} className="text-indigo-600" />
              </div>
              <div>
                <p className="font-black text-slate-900" style={{ fontFamily: "var(--font-outfit)" }}>Click or Drag to Upload</p>
                <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Supports PDF, DICOM, Images</p>
              </div>
            </div>
            {isDragging && <div className="absolute inset-0 bg-indigo-600/10 backdrop-blur-[2px] pointer-events-none" />}
          </motion.div>

          <div className="space-y-3">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-2">Document History</h4>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
               {isInitialLoading ? (
                 <div className="flex flex-col items-center justify-center py-10 opacity-20">
                    <Loader size={30} className="animate-spin mb-2" />
                    <p className="text-xs font-black uppercase tracking-widest">Loading Vault...</p>
                 </div>
               ) : files.length > 0 ? (
                 <AnimatePresence>
                   {files.map((file) => (
                     <motion.div
                        key={file.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className={`p-4 rounded-2xl cursor-pointer transition-all border group ${
                          selectedFile?.id === file.id ? "bg-white border-indigo-200 shadow-lg shadow-indigo-600/5 ring-2 ring-indigo-600/5" : "bg-white border-slate-100 hover:border-indigo-100"
                        }`}
                        onClick={() => setSelectedFile(file.status === "complete" ? file : null)}
                     >
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
                              <FileText size={24} />
                           </div>
                           <div className="flex-1 min-w-0">
                              <h5 className="text-sm font-black text-slate-900 truncate">{file.name}</h5>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{file.size} · {file.type}</p>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              {file.status === "uploading" && <div className="flex items-center gap-1.5 text-[10px] font-black text-indigo-600 italic"><Loader size={10} className="animate-spin" /> SYNCING</div>}
                              {file.status === "analyzing" && <div className="flex items-center gap-1.5 text-[10px] font-black text-amber-500 italic"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" /> AI ANALYZING</div>}
                              {file.status === "complete" && <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">READY</div>}
                           </div>
                        </div>
                     </motion.div>
                   ))}
                 </AnimatePresence>
               ) : (
                 <div className="text-center py-12 rounded-[32px] bg-slate-50/50 border border-slate-100 border-dashed">
                    <Database size={40} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Vault is Empty</p>
                 </div>
               )}
            </div>
          </div>
        </div>

        {/* Right Column: Analysis Detail */}
        <div className="lg:sticky lg:top-4 h-fit">
          <AnimatePresence mode="wait">
            {selectedFile?.result ? (
              <motion.div
                key={selectedFile.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-[40px] bg-white border border-slate-200 shadow-2xl shadow-indigo-600/5 overflow-hidden"
              >
                {/* Visual Banner */}
                <div className={`h-24 p-6 flex items-end justify-between`} style={{ background: RISK_CONFIG[selectedFile.result.riskLevel].bg }}>
                   <div>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1 block" style={{ color: RISK_CONFIG[selectedFile.result.riskLevel].color }}>Pathology Insight</span>
                     <h3 className="text-xl font-black" style={{ color: RISK_CONFIG[selectedFile.result.riskLevel].color }}>{selectedFile.result.type}</h3>
                   </div>
                   <div className="px-4 py-1.5 rounded-full bg-white text-xs font-black shadow-sm" style={{ color: RISK_CONFIG[selectedFile.result.riskLevel].color }}>
                      {RISK_CONFIG[selectedFile.result.riskLevel].label}
                   </div>
                </div>

                <div className="p-8 space-y-6">
                  <div>
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Diagnostic Findings</h4>
                    <div className="space-y-3">
                      {selectedFile.result.findings.map((f, i) => (
                        <motion.div 
                          key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                          className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100"
                        >
                           <div className="w-5 h-5 rounded-lg bg-white shadow-sm flex items-center justify-center shrink-0 mt-0.5">
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: selectedFile.result ? RISK_CONFIG[selectedFile.result.riskLevel].color : '#94A3B8' }} />
                           </div>
                           <p className="text-xs font-semibold leading-relaxed text-slate-600">{f}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>

                  <div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">NOVA Clinical Directives</h4>
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
                      className="w-14 h-14 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-colors border border-slate-100"
                    >
                       <X size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="h-full min-h-[500px] rounded-[40px] border-4 border-slate-50 border-dotted flex flex-col items-center justify-center p-12 text-center text-slate-300">
                 <FileText size={60} className="mb-6 opacity-20" />
                 <p className="font-black text-sm uppercase tracking-[0.2em] opacity-30">Select a document<br/>for deep analysis</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
