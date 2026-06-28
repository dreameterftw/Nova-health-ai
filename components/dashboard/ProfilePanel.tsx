"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth, UserProfile } from "@/contexts/AuthContext";
import {
  Shield, CreditCard, Heart, Phone, LogOut,
  ChevronRight, AlertCircle, Edit2, Save, X,
  Plus, Pill, Trash2, Check,
} from "lucide-react";

const C = {
  bg: "#F8F9FC",
  surface: "#FFFFFF",
  surface2: "#F1F3F8",
  border: "#E2E8F0",
  indigo: "#5B5EF4",
  indigoDark: "#4338CA",
  indigoLight: "#C7D2FE",
  text: "#0F172A",
  textMid: "#334155",
  textSoft: "#64748B",
  rose: "#F43F5E",
  teal: "#0D9488",
  green: "#10B981",
  gold: "#D97706",
  purple: "#7C3AED",
};

function initials(name?: string) {
  return (name || "U").split(" ").map(w => w[0] || "").join("").slice(0, 2).toUpperCase();
}

// ADDED — simple Indian phone validator
function isValidPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, "").replace(/^\+91/, "");
  return /^[6-9]\d{9}$/.test(cleaned);
}

function formatPhone(raw: string): string {
  const cleaned = raw.replace(/[^\d+]/g, "");
  if (!cleaned.startsWith("+")) return "+91" + cleaned.replace(/^91/, "");
  return cleaned;
}

// ADDED — confirm before destructive action
function ConfirmPopover({
  message,
  onConfirm,
  onCancel,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="absolute right-0 top-10 z-20 rounded-2xl p-3 shadow-xl w-52"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <p className="text-xs font-semibold mb-3" style={{ color: C.textMid }}>{message}</p>
      <div className="flex gap-2">
        <button onClick={onConfirm}
          className="flex-1 py-1.5 rounded-xl text-xs font-black text-white"
          style={{ background: C.rose }}>
          Remove
        </button>
        <button onClick={onCancel}
          className="flex-1 py-1.5 rounded-xl text-xs font-black"
          style={{ background: C.surface2, color: C.textSoft }}>
          Cancel
        </button>
      </div>
    </motion.div>
  );
}

// ADDED — inline medication tag list
function MedicationEditor({
  medications,
  onChange,
}: {
  medications: string[];
  onChange: (meds: string[]) => void;
}) {
  const [input, setInput] = useState("");

  const add = () => {
    const trimmed = input.trim();
    if (trimmed && !medications.includes(trimmed)) {
      onChange([...medications, trimmed]);
    }
    setInput("");
  };

  const remove = (med: string) => onChange(medications.filter(m => m !== med));

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {medications.map(med => (
          <span key={med}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
            style={{ background: `${C.purple}12`, color: C.purple, border: `1px solid ${C.purple}28` }}>
            <Pill size={10} />
            {med}
            <button onClick={() => remove(med)} className="ml-0.5 opacity-60 hover:opacity-100">
              <X size={9} />
            </button>
          </span>
        ))}
        {medications.length === 0 && (
          <p className="text-xs" style={{ color: C.textSoft }}>No medications added yet.</p>
        )}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); add(); } }}
          placeholder="Add medication name…"
          className="flex-1 rounded-xl px-3 py-2 text-xs outline-none"
          style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text }}
        />
        <motion.button whileTap={{ scale: 0.9 }} onClick={add}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#F5F3FF", border: `1px solid #C4B5FD` }}>
          <Plus size={13} color={C.purple} />
        </motion.button>
      </div>
    </div>
  );
}

// ADDED — family member row with inline edit support
function FamilyMemberRow({
  member,
  onRemove,
  onUpdate,
}: {
  member: { name: string; relation: string; phone: string };
  onRemove: () => void;
  onUpdate: (m: { name: string; relation: string; phone: string }) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(member);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [phoneError, setPhoneError] = useState("");

  const handleSave = () => {
    if (!isValidPhone(draft.phone)) {
      setPhoneError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setPhoneError("");
    onUpdate({ ...draft, phone: formatPhone(draft.phone) });
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="rounded-3xl p-4 space-y-2"
        style={{ background: "#EEF2FF", border: `1px solid ${C.indigoLight}` }}>
        <div className="grid grid-cols-2 gap-2">
          <input value={draft.name} onChange={e => setDraft(p => ({ ...p, name: e.target.value }))}
            placeholder="Name"
            className="p-2.5 text-xs rounded-xl outline-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
          <input value={draft.relation} onChange={e => setDraft(p => ({ ...p, relation: e.target.value }))}
            placeholder="Relation"
            className="p-2.5 text-xs rounded-xl outline-none"
            style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
        </div>
        <input value={draft.phone} onChange={e => { setDraft(p => ({ ...p, phone: e.target.value })); setPhoneError(""); }}
          placeholder="+91 98765 43210"
          className="w-full p-2.5 text-xs rounded-xl outline-none"
          style={{ background: C.surface, border: `1px solid ${phoneError ? C.rose : C.border}`, color: C.text }} />
        {phoneError && <p className="text-[10px]" style={{ color: C.rose }}>{phoneError}</p>}
        <div className="flex gap-2">
          <motion.button whileTap={{ scale: 0.96 }} onClick={handleSave}
            className="flex-1 py-2 rounded-xl text-xs font-black text-white"
            style={{ background: C.indigo }}>
            Save
          </motion.button>
          <button onClick={() => { setEditing(false); setDraft(member); }}
            className="flex-1 py-2 rounded-xl text-xs font-black"
            style={{ background: C.surface2, color: C.textSoft }}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center gap-3 p-4 rounded-3xl"
      style={{ background: C.surface, border: `1px solid ${C.border}` }}>
      <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-sm font-black flex-shrink-0"
        style={{ background: `linear-gradient(135deg, ${C.indigo}, ${C.indigoDark})` }}>
        {initials(member.name)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-black truncate" style={{ color: C.text }}>{member.name}</p>
          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full"
            style={{ background: "#EEF2FF", color: C.indigoDark }}>
            {member.relation}
          </span>
        </div>
        <p className="text-xs mt-0.5" style={{ color: C.textSoft }}>
          <a href={`tel:${member.phone}`} className="no-underline" style={{ color: C.teal }}>
            {member.phone}
          </a>
        </p>
      </div>
      <div className="flex gap-1.5 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => setEditing(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: C.surface2 }}>
          <Edit2 size={13} color={C.textSoft} />
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => setConfirmRemove(true)}
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: "#FFF1F2" }}>
          <Trash2 size={13} color={C.rose} />
        </motion.button>
      </div>
      {/* ADDED — confirm popover before remove */}
      <AnimatePresence>
        {confirmRemove && (
          <ConfirmPopover
            message={`Remove ${member.name} from your Family Circle?`}
            onConfirm={() => { setConfirmRemove(false); onRemove(); }}
            onCancel={() => setConfirmRemove(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export function ProfilePanel() {
  const { user, logout, updateProfile } = useAuth();

  // ADDED — sync editData whenever user changes (e.g. after save)
  const [editData, setEditData] = useState<Partial<UserProfile>>(user || {});
  useEffect(() => {
    if (user) setEditData(user);
  }, [user]);

  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsaved, setHasUnsaved] = useState(false);
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRelation, setNewRelation] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPhoneError, setNewPhoneError] = useState("");
  const [saving, setSaving] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  const familyMembers = user?.familyCircle || [];

  // ADDED — track unsaved changes
  const handleEditChange = useCallback((patch: Partial<UserProfile>) => {
    setEditData(prev => ({ ...prev, ...patch }));
    setHasUnsaved(true);
  }, []);

  const handleSaveProfile = async () => {
    setSaving(true);
    await updateProfile(editData);
    setSaving(false);
    setIsEditing(false);
    setHasUnsaved(false);
  };

  const handleCancelEdit = () => {
    if (hasUnsaved) {
      if (!window.confirm("Discard unsaved changes?")) return;
    }
    setEditData(user || {});
    setIsEditing(false);
    setHasUnsaved(false);
  };

  const addMember = async () => {
    if (!newName.trim()) return;
    if (!isValidPhone(newPhone)) {
      setNewPhoneError("Enter a valid 10-digit Indian mobile number.");
      return;
    }
    setNewPhoneError("");
    const updated = [
      ...familyMembers,
      { name: newName.trim(), relation: newRelation.trim() || "Family", phone: formatPhone(newPhone) },
    ];
    await updateProfile({ familyCircle: updated });
    setNewName(""); setNewRelation(""); setNewPhone("");
    setShowAddFamily(false);
  };

  const removeMember = async (index: number) => {
    const updated = familyMembers.filter((_, i) => i !== index);
    await updateProfile({ familyCircle: updated });
  };

  const updateMember = async (index: number, m: { name: string; relation: string; phone: string }) => {
    const updated = familyMembers.map((existing, i) => i === index ? m : existing);
    await updateProfile({ familyCircle: updated });
  };

  // ADDED — sanitised export
  const handleExport = () => {
    const sanitised = {
      exportedAt: new Date().toISOString(),
      name: user?.name,
      email: user?.email,
      bloodGroup: user?.bloodGroup,
      bloodPressure: user?.bloodPressure,
      height: user?.height,
      weight: user?.weight,
      allergies: user?.allergies,
      medications: user?.medications,
      familyCircle: (user?.familyCircle || []).map(m => ({
        name: m.name,
        relation: m.relation,
        phone: m.phone,
      })),
      appVersion: "NOVA v1.1",
    };
    const blob = new Blob([JSON.stringify(sanitised, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `nova-health-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  };

  return (
    <div className="space-y-5 max-w-2xl mx-auto pb-12">

      {/* ── Header card ── */}
      <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl p-5 relative overflow-hidden text-white"
        style={{
          background: `linear-gradient(135deg, ${C.indigoDark} 0%, ${C.indigo} 100%)`,
          boxShadow: "0 24px 60px rgba(91,94,244,0.28)",
        }}>
        <div className="absolute top-0 right-0 w-48 h-48 rounded-full pointer-events-none"
          style={{ background: "rgba(255,255,255,0.05)", filter: "blur(40px)", transform: "translate(30%, -30%)" }} />

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black"
              style={{ background: "rgba(255,255,255,0.18)", border: "1.5px solid rgba(255,255,255,0.28)" }}>
              {initials(user?.name)}
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight"
                style={{ fontFamily: "var(--font-outfit, sans-serif)" }}>
                {user?.name}
              </h2>
              <p className="text-xs opacity-70">{user?.email}</p>
              {/* ADDED — medication count pill */}
              {(user?.medications?.length ?? 0) > 0 && (
                <div className="mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black"
                  style={{ background: "rgba(255,255,255,0.15)", color: "rgba(255,255,255,0.85)" }}>
                  <Pill size={9} />
                  {user!.medications!.length} medication{user!.medications!.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          </div>
          <motion.button whileTap={{ scale: 0.95 }}
            onClick={() => isEditing ? handleCancelEdit() : setIsEditing(true)}
            className="w-9 h-9 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.22)" }}>
            {isEditing ? <X size={16} /> : <Edit2 size={16} />}
          </motion.button>
        </div>
      </motion.div>

      {/* ADDED — unsaved changes banner */}
      <AnimatePresence>
        {hasUnsaved && isEditing && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="rounded-2xl px-4 py-3 flex items-center justify-between gap-3"
            style={{ background: "#FFFBEB", border: "1px solid #FDE68A" }}>
            <p className="text-xs font-bold" style={{ color: C.gold }}>Unsaved changes</p>
            <div className="flex gap-2">
              <motion.button whileTap={{ scale: 0.96 }} onClick={handleSaveProfile}
                disabled={saving}
                className="px-3 py-1.5 rounded-full text-xs font-black text-white flex items-center gap-1 disabled:opacity-50"
                style={{ background: C.green }}>
                {saving ? "Saving…" : <><Check size={11} /> Save</>}
              </motion.button>
              <button onClick={handleCancelEdit}
                className="px-3 py-1.5 rounded-full text-xs font-black"
                style={{ background: C.surface2, color: C.textSoft }}>
                Discard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Clinical profile ── */}
      <section className="space-y-3">
        <div className="flex items-center gap-2 px-1">
          <Shield size={13} color={C.indigo} />
          <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSoft }}>
            Clinical Profile
          </h3>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Blood Group", key: "bloodGroup", icon: <Heart size={13} />, placeholder: "e.g. O+" },
            { label: "Blood Pressure", key: "bloodPressure", icon: <AlertCircle size={13} />, placeholder: "e.g. 120/80" },
            { label: "Height (cm)", key: "height", icon: <ChevronRight size={13} />, placeholder: "175", type: "number" },
            { label: "Weight (kg)", key: "weight", icon: <ChevronRight size={13} />, placeholder: "70", type: "number" },
          ].map(field => (
            <div key={field.key} className="p-4 rounded-2xl"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <div className="flex items-center gap-1.5 mb-2" style={{ color: C.textSoft }}>
                {field.icon}
                <span className="text-[9px] font-black uppercase tracking-wider">{field.label}</span>
              </div>
              {isEditing ? (
                <input
                  type={field.type || "text"}
                  className="w-full text-sm font-bold outline-none rounded-lg px-2 py-1"
                  style={{ background: C.surface2, color: C.text, border: `1px solid ${C.border}` }}
                  value={(editData as any)[field.key] || ""}
                  placeholder={field.placeholder}
                  onChange={e => handleEditChange({
                    [field.key]: field.type === "number"
                      ? parseFloat(e.target.value) || undefined
                      : e.target.value,
                  })}
                />
              ) : (
                <p className="text-sm font-black" style={{ color: (user as any)?.[field.key] ? C.text : C.textSoft }}>
                  {(user as any)?.[field.key] || "Not set"}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Allergies */}
        <div className="p-4 rounded-2xl"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-1.5 mb-2">
            <AlertCircle size={13} color={C.rose} />
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: C.textSoft }}>
              Allergies & Conditions
            </span>
          </div>
          {isEditing ? (
            <textarea
              className="w-full text-sm outline-none rounded-xl px-3 py-2 resize-none"
              style={{ background: C.surface2, border: `1px solid ${C.border}`, color: C.text, fontFamily: "inherit" }}
              rows={2}
              value={editData.allergies?.join(", ") || ""}
              placeholder="List allergies or chronic conditions, comma-separated"
              onChange={e => handleEditChange({
                allergies: e.target.value.split(",").map(s => s.trim()).filter(Boolean),
              })}
            />
          ) : (
            <p className="text-sm leading-relaxed" style={{ color: user?.allergies?.length ? C.textMid : C.textSoft }}>
              {user?.allergies?.length ? user.allergies.join(", ") : "None reported"}
            </p>
          )}
        </div>

        {/* ADDED — medications field */}
        <div className="p-4 rounded-2xl"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-1.5 mb-3">
            <Pill size={13} color={C.purple} />
            <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: C.textSoft }}>
              Current Medications
            </span>
          </div>
          {isEditing ? (
            <MedicationEditor
              medications={editData.medications || []}
              onChange={meds => handleEditChange({ medications: meds })}
            />
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {user?.medications?.length ? (
                user.medications.map(med => (
                  <span key={med}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
                    style={{ background: `${C.purple}12`, color: C.purple, border: `1px solid ${C.purple}28` }}>
                    <Pill size={9} /> {med}
                  </span>
                ))
              ) : (
                <p className="text-sm" style={{ color: C.textSoft }}>None recorded</p>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── Family Circle ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <Phone size={13} color={C.green} />
            <h3 className="text-[10px] font-black uppercase tracking-widest" style={{ color: C.textSoft }}>
              Family Circle
            </h3>
          </div>
          <motion.button whileTap={{ scale: 0.94 }}
            onClick={() => { setShowAddFamily(v => !v); setNewPhoneError(""); }}
            className="text-[10px] font-black px-3 py-1.5 rounded-full flex items-center gap-1"
            style={{
              background: showAddFamily ? C.surface2 : "#EEF2FF",
              color: showAddFamily ? C.textSoft : C.indigo,
              border: `1px solid ${showAddFamily ? C.border : C.indigoLight}`,
            }}>
            {showAddFamily ? <X size={10} /> : <Plus size={10} />}
            {showAddFamily ? "Cancel" : "Add"}
          </motion.button>
        </div>

        {/* Add member form */}
        <AnimatePresence>
          {showAddFamily && (
            <motion.div
              initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
              <div className="p-4 rounded-2xl space-y-2 mb-1"
                style={{ background: "#EEF2FF", border: `1px solid ${C.indigoLight}` }}>
                <div className="grid grid-cols-2 gap-2">
                  <input value={newName} onChange={e => setNewName(e.target.value)}
                    placeholder="Full name"
                    className="p-2.5 text-xs rounded-xl outline-none"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
                  <input value={newRelation} onChange={e => setNewRelation(e.target.value)}
                    placeholder="e.g. Mother, Partner"
                    className="p-2.5 text-xs rounded-xl outline-none"
                    style={{ background: C.surface, border: `1px solid ${C.border}`, color: C.text }} />
                </div>
                {/* ADDED — phone with format hint and validation */}
                <div>
                  <input value={newPhone} onChange={e => { setNewPhone(e.target.value); setNewPhoneError(""); }}
                    placeholder="+91 98765 43210 — 10-digit mobile number"
                    className="w-full p-2.5 text-xs rounded-xl outline-none"
                    style={{
                      background: C.surface,
                      border: `1px solid ${newPhoneError ? C.rose : C.border}`,
                      color: C.text,
                    }} />
                  {newPhoneError && (
                    <p className="text-[10px] mt-1 px-1" style={{ color: C.rose }}>{newPhoneError}</p>
                  )}
                </div>
                <motion.button whileTap={{ scale: 0.97 }} onClick={addMember}
                  className="w-full py-2.5 rounded-xl text-xs font-black text-white"
                  style={{ background: C.indigo }}>
                  Link to NOVA SOS
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Member list */}
        {familyMembers.length > 0 ? (
          <div className="space-y-2">
            {familyMembers.map((m, i) => (
              <FamilyMemberRow
                key={`${m.name}-${i}`}
                member={m}
                onRemove={() => removeMember(i)}
                onUpdate={(updated) => updateMember(i, updated)}
              />
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-2xl"
            style={{ background: C.surface2, border: `2px dashed ${C.border}` }}>
            <div className="text-3xl mb-3">👥</div>
            <p className="text-sm font-black" style={{ color: C.text }}>Add someone who has your back.</p>
            <p className="text-xs mt-2 leading-relaxed" style={{ color: C.textSoft }}>
              They'll be the first to know if you tap SOS. They never get access to your health data.
            </p>
            <div className="mt-4 rounded-xl p-3 text-left"
              style={{ background: C.surface, border: `1px solid ${C.border}` }}>
              <p className="text-[9px] font-black uppercase tracking-widest mb-2" style={{ color: C.textSoft }}>
                Notified only when
              </p>
              <ul className="space-y-1 text-[11px] font-semibold leading-relaxed" style={{ color: C.textMid }}>
                <li>· You tap the SOS button yourself</li>
                <li>· You choose to send an alert after NOVA flags a concern</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* ── Settings & Security ── */}
      <section className="space-y-2">
        <p className="text-[10px] font-black uppercase tracking-widest px-1"
          style={{ color: C.textSoft }}>
          Settings & Security
        </p>

        <motion.button whileTap={{ scale: 0.98 }} onClick={handleExport}
          className="w-full p-4 rounded-2xl flex items-center justify-between"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#EEF2FF" }}>
              <CreditCard size={14} color={C.indigo} />
            </div>
            <span className="text-sm font-bold" style={{ color: C.text }}>
              {exportDone ? "Exported ✓" : "Export Clinical Data"}
            </span>
          </div>
          <ChevronRight size={16} color={C.textSoft} />
        </motion.button>

        <a href="/privacy"
          className="w-full p-4 rounded-2xl flex items-center justify-between no-underline block"
          style={{ background: C.surface, border: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: C.surface2 }}>
              <Shield size={14} color={C.textSoft} />
            </div>
            <span className="text-sm font-bold" style={{ color: C.text }}>Privacy, in plain English</span>
          </div>
          <ChevronRight size={16} color={C.textSoft} />
        </a>

        <motion.button whileTap={{ scale: 0.98 }} onClick={logout}
          className="w-full p-4 rounded-2xl flex items-center justify-between"
          style={{ background: "#FFF1F2", border: "1px solid #FECDD3" }}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: "#FFE4E6" }}>
              <LogOut size={14} color={C.rose} />
            </div>
            <span className="text-sm font-black" style={{ color: C.rose }}>Secure Sign Out</span>
          </div>
          <ChevronRight size={16} color="#FECDD3" />
        </motion.button>
      </section>

      <div className="rounded-2xl p-4 text-center"
        style={{ background: C.surface2, border: `1px solid ${C.border}` }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: C.textSoft }}>
          Privacy & Encryption
        </p>
        <p className="text-[10px] leading-relaxed" style={{ color: C.textSoft }}>
          Your health records stay in your private account. Family Circle is for urgent contact support only —
          they never get access to your vault, chat, or HealthPulse history.
        </p>
      </div>
    </div>
  );
}