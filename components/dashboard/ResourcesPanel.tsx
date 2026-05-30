"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, ExternalLink, Phone, Shield, Heart, BookOpen, Flag, MapPin, ChevronRight } from "lucide-react";

interface Resource {
  name: string;
  desc: string;
  url?: string;
  phone?: string;
  badge: string;
}

interface Category {
  title: string;
  icon: React.ReactElement;
  bg: string;
  color: string;
  border: string;
  resources: Resource[];
}

const RESOURCE_CATEGORIES: Category[] = [
  {
    title: "Crisis Support",
    icon: <Heart size={16} />,
    bg: "#FFF1F2",
    color: "#F43F5E",
    border: "#FECDD3",
    resources: [
      { name: "iCall Helpline", desc: "Psychosocial support by TISS Mumbai", phone: "9152987821", badge: "NGO" },
      { name: "Sanjivini Society", desc: "Mental health counseling & crisis intervention", phone: "01124311918", badge: "Free" },
      { name: "Vandrevala Foundation", desc: "24/7 mental wellness support", phone: "9999666555", badge: "24/7" },
    ],
  },
  {
    title: "Clinical Services",
    icon: <Shield size={16} />,
    bg: "#F0FDFA",
    color: "#14B8A6",
    border: "#CCFBF1",
    resources: [
      { name: "Ayushman Bharat", desc: "National Digital Health Mission (ABDM)", url: "https://healthid.ndhm.gov.in/", badge: "Govt" },
      { name: "eSanjeevani", desc: "National Tele-consultation Service", url: "https://esanjeevaniopd.in/", badge: "Govt" },
      { name: "National Help", desc: "Centralized Emergency Number", phone: "112", badge: "SOS" },
    ],
  },
  {
    title: "Nearby Analytics",
    icon: <MapPin size={16} />,
    bg: "#EFF6FF",
    color: "#3B82F6",
    border: "#DBEAFE",
    resources: [
      { name: "Nearest Hospital", desc: "Automatic search via Google Maps", url: "https://www.google.com/maps/search/hospital+near+me", badge: "Map" },
      { name: "Blood Banks", desc: "Verified inventory in your region", url: "https://www.eraktkosh.in/", badge: "Live" },
    ],
  },
];

export function ResourcesPanel() {
  const [search, setSearch] = useState("");
  const [activeCat, setActiveCat] = useState<string | null>(null);

  const filtered = RESOURCE_CATEGORIES
    .filter(c => !activeCat || c.title === activeCat)
    .map(cat => ({
      ...cat,
      resources: cat.resources.filter(r =>
        !search.trim() ||
        r.name.toLowerCase().includes(search.toLowerCase()) ||
        r.desc.toLowerCase().includes(search.toLowerCase())
      ),
    }))
    .filter(c => c.resources.length > 0);

  return (
    <div className="space-y-6 max-w-2xl mx-auto pb-12">
      
      {/* ── Search & Filter ───────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search verified resources..."
            className="w-full pl-12 pr-4 py-4 rounded-[1.5rem] bg-white border border-slate-200 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all text-sm font-medium"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveCat(null)}
            className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${!activeCat ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-200'}`}>
            Public
          </button>
          {RESOURCE_CATEGORIES.map(cat => (
            <button key={cat.title} onClick={() => setActiveCat(cat.title)}
              className={`px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeCat === cat.title ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white text-slate-400 border border-slate-200'}`}>
              {cat.title}
            </button>
          ))}
        </div>
      </div>

      {/* ── Resource List ─────────────────────────────────────────────── */}
      <div className="space-y-8">
        {filtered.map((cat, ci) => (
          <motion.div key={cat.title} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.1 }}>
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: cat.bg, color: cat.color }}>
                {cat.icon}
              </div>
              <h3 className="text-xs font-black uppercase tracking-[0.15em]" style={{ color: cat.color }}>{cat.title}</h3>
            </div>

            <div className="grid gap-3">
              {cat.resources.map((r, ri) => (
                <div key={ri} className="p-4 rounded-[1.5rem] bg-white border border-slate-200 group hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-50/50 transition-all">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-black text-slate-900 truncate">{r.name}</p>
                        <span className="text-[8px] font-black px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 uppercase">{r.badge}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">{r.desc}</p>
                    </div>
                    <div className="flex gap-2">
                      {r.phone && (
                        <a href={`tel:${r.phone}`} className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center hover:bg-emerald-100 transition-colors">
                          <Phone size={14} />
                        </a>
                      )}
                      {r.url && (
                        <a href={r.url} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors">
                          <ExternalLink size={14} />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Compliance Banner ─────────────────────────────────────────── */}
      <div className="p-6 rounded-[2.5rem] bg-indigo-950 text-white relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10"><Flag size={48} /></div>
         <div className="relative z-10">
           <h4 className="text-sm font-black mb-2 flex items-center gap-2">
             <Shield size={16} className="text-indigo-400" />
             Verified by NOVA
           </h4>
           <p className="text-[10px] leading-relaxed text-indigo-200 font-medium">
             All clinical resources in this list are verified part of the <strong>Ayushman Bharat Digital Mission (ABDM)</strong> or recognized NGOs in India. NOVA does not provide medical advice.
           </p>
         </div>
      </div>

    </div>
  );
}
