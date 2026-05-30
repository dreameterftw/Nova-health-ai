"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserProfile } from "@/contexts/AuthContext";
import { Shield, CreditCard, Heart, Phone, LogOut, ChevronRight, CheckCircle2, AlertCircle, Edit2, Save, X } from "lucide-react";

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
  rose: "#F43F5E",
  teal: "#14B8A6",
};

export function ProfilePanel() {
  const { user, logout, updateProfile } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [editData, setEditData] = useState<Partial<UserProfile>>(user || {});
  
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [exportDone, setExportDone] = useState(false);

  const familyMembers = user?.familyCircle || [];

  const handleSaveProfile = async () => {
    await updateProfile(editData);
    setIsEditing(false);
  };

  const addMember = async () => {
    if (newName.trim()) {
      const updated = [...familyMembers, {
        name: newName.trim(),
        relation: newRelation.trim() || "Family",
        phone: newPhone.trim() || "+91 "
      }];
      await updateProfile({ familyCircle: updated });
      setNewName(""); setNewRelation(""); setNewPhone(""); setShowAddFamily(false);
    }
  };

  const removeMember = async (index: number) => {
    const updated = familyMembers.filter((_, i) => i !== index);
    await updateProfile({ familyCircle: updated });
  };

  const handleExport = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      user: { name: user?.name, email: user?.email, ...user },
      appVersion: "NOVA v1.1 Premium",
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nova-health-export-${new Date().toISOString().split("T")[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  const initials = (name?: string) => (name || "User").split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      
      {/* ── Header Card ────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-[2.5rem] p-6 relative overflow-hidden text-white"
        style={{ background: `linear-gradient(135deg, ${C.indigoDark} 0%, ${C.indigo} 100%)`, boxShadow: "0 24px 60px rgba(91,94,244,0.3)" }}>
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl flex items-center justify-center text-2xl font-black bg-white/20 border border-white/30 backdrop-blur-md">
              {initials(user?.name)}
            </div>
            <div>
              <h2 className="text-xl font-black" style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>{user?.name}</h2>
              <p className="text-sm opacity-70">{user?.email}</p>
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setIsEditing(!isEditing)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 border border-white/20 transition-colors">
            {isEditing ? <X size={18} /> : <Edit2 size={18} />}
          </motion.button>
        </div>
      </motion.div>

      {/* ── Clinical Profile Section ───────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: C.textMid }}>
            <Shield size={14} className="text-indigo-500" />
            Clinical Profile
          </h3>
          {isEditing && (
            <motion.button initial={{ opacity: 0 }} animate={{ opacity: 1 }} onClick={handleSaveProfile}
              className="text-xs font-black px-3 py-1.5 rounded-full bg-emerald-500 text-white flex items-center gap-1">
              <Save size={12} /> Save
            </motion.button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Blood Group", key: "bloodGroup", icon: <Heart size={14} />, placeholder: "e.g. O+" },
            { label: "Blood Pressure", key: "bloodPressure", icon: <AlertCircle size={14} />, placeholder: "e.g. 120/80" },
            { label: "Height (cm)", key: "height", icon: <ChevronRight size={14} />, placeholder: "175", type: "number" },
            { label: "Weight (kg)", key: "weight", icon: <ChevronRight size={14} />, placeholder: "70", type: "number" },
          ].map((field) => (
            <div key={field.key} className="p-4 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-slate-400 capitalize">
                {field.icon}
                <span className="text-[10px] font-black tracking-wider">{field.label}</span>
              </div>
              {isEditing ? (
                <input
                  type={field.type || "text"}
                  className="w-full text-sm font-bold bg-slate-50 border-none p-1 rounded focus:ring-0"
                  value={ (editData as any)[field.key] || "" }
                  placeholder={field.placeholder}
                  onChange={(e) => setEditData({ ...editData, [field.key]: field.type === "number" ? parseFloat(e.target.value) : e.target.value })}
                />
              ) : (
                <p className="text-sm font-black" style={{ color: C.text }}>{ (user as any)?.[field.key] || "Not set" }</p>
              )}
            </div>
          ))}
        </div>
        
        {/* Large fields */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-slate-400">
            <AlertCircle size={14} className="text-rose-500" />
            <span className="text-[10px] font-black tracking-wider uppercase">Known Allergies & Medical Conditions</span>
          </div>
          {isEditing ? (
            <textarea
              className="w-full text-sm font-medium bg-slate-50 border-none p-2 rounded-xl h-20 resize-none"
              value={ editData.allergies?.join(", ") || "" }
              placeholder="List any allergies or chronic conditions..."
              onChange={(e) => setEditData({ ...editData, allergies: e.target.value.split(",").map(s => s.trim()).filter(s => s) })}
            />
          ) : (
            <p className="text-sm font-medium leading-relaxed" style={{ color: C.textMid }}>
              {user?.allergies?.length ? user.allergies.join(", ") : "None reported. Ensure your NOVA analysis results are accurate."}
            </p>
          )}
        </div>
      </section>

      {/* ── Family Circle ──────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2" style={{ color: C.textMid }}>
            <Phone size={14} className="text-emerald-500" />
            Family Circle
          </h3>
          <button onClick={() => setShowAddFamily(!showAddFamily)}
            className="text-[10px] font-black px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            {showAddFamily ? "Cancel" : "Add Member"}
          </button>
        </div>

        <div className="space-y-3">
          <AnimatePresence>
            {showAddFamily && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden">
                <div className="p-4 rounded-3xl bg-slate-50 border border-indigo-100 space-y-3 mb-3">
                  <div className="grid grid-cols-2 gap-2">
                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Name" className="p-2.5 text-xs rounded-xl border border-slate-200" />
                    <input value={newRelation} onChange={e => setNewRelation(e.target.value)} placeholder="Relation" className="p-2.5 text-xs rounded-xl border border-slate-200" />
                  </div>
                  <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Phone number (with +91)" className="w-full p-2.5 text-xs rounded-xl border border-slate-200" />
                  <button onClick={addMember} className="w-full py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black">
                    Link to NOVA SOS
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {familyMembers.length > 0 ? familyMembers.map((m, i) => (
            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-white border border-slate-200 transition-all hover:shadow-md">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black" 
                style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})` }}>
                {initials(m.name)}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-black" style={{ color: C.text }}>{m.name}</p>
                  <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-500">{m.relation}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">{m.phone}</p>
              </div>
              <button onClick={() => removeMember(i)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors">
                <X size={16} />
              </button>
            </div>
          )) : (
            <div className="p-8 text-center rounded-3xl border-2 border-dashed border-slate-200">
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No SOS contacts linked</p>
               <p className="text-[10px] text-slate-400 mt-1">Add family members to enable the emergency broadcast feature.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Actions & Compliance ───────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="px-1 text-[10px] font-black uppercase tracking-widest text-slate-400">Settings & Security</div>
        <div className="grid gap-2">
           <button onClick={handleExport} className="w-full p-4 rounded-3xl bg-white border border-slate-200 flex items-center justify-between group">
             <div className="flex items-center gap-3">
               <div className="w-8 h-8 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500"><CreditCard size={14}/></div>
               <span className="text-sm font-bold">{exportDone ? "Data Exporting..." : "Export Clinical Data"}</span>
             </div>
             <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
           </button>
           
           <button onClick={logout} className="w-full p-4 rounded-3xl bg-rose-50 border border-rose-100 flex items-center justify-between group">
             <div className="flex items-center gap-3 text-rose-600">
               <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center"><LogOut size={14}/></div>
               <span className="text-sm font-black">Secure Sign Out</span>
             </div>
             <ChevronRight size={16} className="text-rose-200" />
           </button>
        </div>
      </section>

      <div className="p-4 rounded-3xl text-center bg-slate-100 border border-slate-200">
        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">Privacy & Encryption</p>
        <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
          Your health records are stored in an AES-256 encrypted vault. ONLY you and your linked family circle can access this data during an SOS event.
        </p>
      </div>

    </div>
  );
}
