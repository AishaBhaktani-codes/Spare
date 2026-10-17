"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { useToast } from "@/components/Toast";
import { generateStudentRoadmap, DynamicModule } from "@/lib/roadmap-generator";

const priorityColors: Record<string, { bg: string; text: string; label: string; border: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", label: "Critical", border: "border-red-400" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Medium", border: "border-amber-400" },
  low: { bg: "bg-emerald-400/10", text: "text-emerald-400", label: "Optional", border: "border-emerald-400" },
};

const phaseBorders = ["border-[#FBBF24]", "border-primary-container", "border-secondary"];

export default function RoadmapPage() {
  const router = useRouter();
  const { completedModules, overallProgress, toggleModule, studentAnalysis, studentVerification } = useApp();
  const { showToast } = useToast();
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Generate dynamic roadmap based 100% on user input
  const { modules, fieldTitle, pursuitTitle, hasRealData } = useMemo(() => {
    return generateStudentRoadmap(studentAnalysis, studentVerification);
  }, [studentAnalysis, studentVerification]);

  // Dynamic hour calculations per phase
  const p1Hours = modules.filter((m) => m.phase === 1).reduce((sum, m) => sum + m.hours, 0) || 6;
  const p2Hours = modules.filter((m) => m.phase === 2).reduce((sum, m) => sum + m.hours, 0) || 4;
  const p3Hours = modules.filter((m) => m.phase === 3).reduce((sum, m) => sum + m.hours, 0) || 2;
  const maxHours = Math.max(p1Hours, p2Hours, p3Hours, 1);

  // Dynamic Base Readiness based on number of missing skills
  const baseReadiness = Math.max(25, 100 - modules.filter((m) => m.priority === "critical").length * 15);
  const readiness = Math.min(100, Math.round(baseReadiness + overallProgress * ((100 - baseReadiness) / 100)));

  const phases = [
    { num: 1, title: "Phase 1: Critical Bridging Foundations", subtitle: "Immediate Priority" },
    { num: 2, title: "Phase 2: Core Domain Competency", subtitle: "Practical Mastery" },
    { num: 3, title: "Phase 3: Advanced Application & Synthesis", subtitle: "Portfolio Integration" },
  ];

  if (!hasRealData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-6 pt-16 pb-32 text-center space-y-6"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-secondary/10 border border-secondary/20 flex items-center justify-center text-secondary shadow-[0_0_30px_rgba(6,182,212,0.2)]">
          <span className="material-symbols-outlined text-4xl">route</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight">
            No Active Learning Roadmap Found
          </h1>
          <p className="text-on-surface-variant text-sm max-w-lg mx-auto">
            Your customized learning roadmap is dynamically generated from your rated skill gaps, field of interest, and marksheet performance.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/20 max-w-md mx-auto text-left space-y-3">
          <p className="text-xs font-bold text-on-surface uppercase tracking-wider">How Your Roadmap is Generated:</p>
          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
            <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary font-bold flex items-center justify-center text-[10px]">1</span>
            <span>Verify what you are pursuing</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
            <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary font-bold flex items-center justify-center text-[10px]">2</span>
            <span>Enter your field of interest to extract domain skills</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
            <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary font-bold flex items-center justify-center text-[10px]">3</span>
            <span>Rate each competency out of 10 to map critical gaps into learning phases</span>
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-xl pulse-gradient text-white font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105 transition-all flex items-center gap-2"
          >
            <span>Begin Student Verification</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 pt-12 pb-32"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-4">
        <div>
          <div className="flex items-center gap-2 text-on-surface-variant text-xs mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-secondary/10 text-secondary border border-secondary/20 font-bold uppercase tracking-wider">
              AI Personalized Pathway
            </span>
            <span>• {pursuitTitle}</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight mb-2">
            Learning Roadmap: {fieldTitle}
          </h1>
          <p className="text-on-surface-variant text-sm max-w-xl">
            Custom engineered roadmap targeting {modules.length} prioritized bridging competencies derived from your verified skill ratings.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard")}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-primary font-semibold hover:bg-primary/10 transition-all text-xs"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span> Gap Analysis
          </button>
          <button
            onClick={() => {
              showToast("Roadmap updated with latest verification data.");
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-outline-variant text-on-surface-variant font-semibold hover:bg-surface-container-high transition-all text-xs"
          >
            <span className="material-symbols-outlined text-sm">refresh</span> Re-sync
          </button>
          <button
            onClick={() => showToast("Exporting your personalized curriculum...")}
            className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-container text-on-primary-container font-bold shadow-lg shadow-primary-container/20 hover:scale-[1.02] transition-transform text-xs"
          >
            <span className="material-symbols-outlined text-sm">picture_as_pdf</span> Export Plan
          </button>
        </div>
      </div>

      {/* High-Level Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-12">
        {/* Overall Progress */}
        <div className="md:col-span-4 bg-surface-container rounded-xl p-6 faint-grid relative overflow-hidden border border-outline-variant/15">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-on-surface-variant uppercase text-[10px] font-bold tracking-[0.2em]">Overall Progress</h3>
            <span className="text-2xl font-black text-secondary font-mono">{overallProgress}%</span>
          </div>
          <div className="w-full h-3 bg-surface-container-lowest rounded-full overflow-hidden border border-outline-variant/10">
            <motion.div
              className="h-full pulse-gradient shadow-[0_0_12px_rgba(124,58,237,0.4)]"
              initial={{ width: 0 }}
              animate={{ width: `${overallProgress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="mt-4 text-xs text-on-surface-variant italic">
            {completedModules.size} of {modules.length} modules completed
          </p>
        </div>

        {/* Readiness Gauge */}
        <div className="md:col-span-3 bg-surface-container-low rounded-xl p-6 flex flex-col items-center justify-center text-center border border-outline-variant/15">
          <div className="relative w-28 h-28 flex items-center justify-center mb-2">
            <svg className="absolute inset-0 w-28 h-28 -rotate-90">
              <circle cx="56" cy="56" r="50" fill="transparent" stroke="#25293A" strokeWidth="8" />
              <circle
                cx="56"
                cy="56"
                r="50"
                fill="transparent"
                stroke="#7c3aed"
                strokeWidth="8"
                strokeDasharray="314"
                strokeDashoffset={314 - (314 * readiness) / 100}
                strokeLinecap="round"
                className="drop-shadow-[0_0_8px_rgba(124,58,237,0.5)]"
              />
            </svg>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-primary font-mono">{readiness}%</span>
              <span className="text-[8px] uppercase tracking-tighter text-on-surface-variant">Live Readiness</span>
            </div>
          </div>
          <p className="text-[10px] text-on-surface-variant font-medium">Calibrated for {fieldTitle}</p>
        </div>

        {/* Training Hours Chart */}
        <div className="md:col-span-5 bg-surface-container rounded-xl p-6 faint-grid border border-outline-variant/15">
          <h3 className="text-on-surface-variant uppercase text-[10px] font-bold tracking-[0.2em] mb-6">
            Bridging Hours per Phase
          </h3>
          <div className="flex items-end justify-between h-24 gap-3 px-2">
            {[
              { label: "Phase 1: Critical", hours: p1Hours, color: "#EF4444" },
              { label: "Phase 2: Core", hours: p2Hours, color: "#FBBF24" },
              { label: "Phase 3: Advanced", hours: p3Hours, color: "#34D399" },
            ].map((bar) => {
              const heightPct = Math.max(10, Math.round((bar.hours / maxHours) * 100));
              return (
                <div key={bar.label} className="flex flex-col items-center flex-1 gap-1">
                  <span className="text-[10px] font-mono text-on-surface-variant">{bar.hours}h</span>
                  <div
                    className="w-full rounded-t-lg transition-all"
                    style={{ height: `${heightPct}%`, background: bar.color, boxShadow: `0 0 15px ${bar.color}40` }}
                  />
                  <span className="text-[8px] text-on-surface-variant truncate w-full text-center mt-1">
                    {bar.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Embedded Video Player */}
      <AnimatePresence mode="wait">
        {activeVideoId && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-12"
          >
            <div className="bg-[#000] rounded-2xl overflow-hidden shadow-2xl relative pt-[56.25%] border border-surface-container-highest">
              <div className="absolute top-0 right-0 z-10 p-4">
                <button
                  onClick={() => setActiveVideoId(null)}
                  className="w-10 h-10 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-colors border border-white/10"
                >
                  <span className="material-symbols-outlined">close</span>
                </button>
              </div>
              <iframe
                src={`https://www.youtube.com/embed/${activeVideoId}?autoplay=1&rel=0`}
                title="YouTube video player"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 w-full h-full border-0"
              />
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Roadmap Phases */}
      <div className="space-y-16">
        {phases.map((phase, pi) => {
          const phaseModules = modules.filter((m) => m.phase === phase.num);
          if (phaseModules.length === 0) return null;

          return (
            <section key={phase.num}>
              <div className="flex items-center gap-4 mb-8">
                <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-primary/20" />
                <h2 className="text-xl font-bold text-primary flex items-center gap-3">
                  <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm border border-primary/20">
                    {String(phase.num).padStart(2, "0")}
                  </span>
                  {phase.title}
                  <span className="text-on-surface-variant text-xs font-normal ml-2">({phase.subtitle})</span>
                </h2>
                <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-primary/20" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {phaseModules.map((mod: DynamicModule, mi: number) => {
                  const isDone = completedModules.has(Number(mod.id));
                  const p = priorityColors[mod.priority] || priorityColors.medium;

                  return (
                    <motion.div
                      key={mod.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: mi * 0.08 }}
                      className={`bg-surface-container rounded-xl p-5 border-l-4 ${
                        phaseBorders[pi] || "border-primary"
                      } flex flex-col justify-between group hover:bg-surface-container-high transition-all shadow-md`}
                    >
                      <div>
                        {/* Status Bar */}
                        <div className="flex justify-between items-start mb-4">
                          <div className="w-10 h-10 bg-primary-container/20 rounded-lg flex items-center justify-center text-primary">
                            <span className="material-symbols-outlined text-sm">
                              {mod.priority === "critical"
                                ? "warning"
                                : mod.category === "Academic"
                                ? "menu_book"
                                : "code"}
                            </span>
                          </div>
                          {/* Complete Checkbox */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleModule(Number(mod.id));
                            }}
                            className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                              isDone
                                ? "border-success bg-emerald-500/20"
                                : "border-outline-variant hover:border-primary-container"
                            }`}
                          >
                            {isDone && (
                              <span
                                className="material-symbols-outlined text-[14px] text-emerald-400 font-bold"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                              >
                                check
                              </span>
                            )}
                          </button>
                        </div>

                        <h4
                          className={`font-bold text-base text-on-surface mb-1 cursor-pointer hover:text-cyan-400 transition-colors ${
                            isDone ? "line-through opacity-60" : ""
                          }`}
                          onClick={() => router.push(`/module/${mod.id}`)}
                        >
                          {mod.title}
                        </h4>

                        <div className="flex items-center gap-3 mb-3">
                          <span className="text-[10px] text-on-surface-variant font-mono">{mod.hours} Hours</span>
                          <span
                            className={`${p.bg} ${p.text} text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider`}
                          >
                            {p.label}
                          </span>
                        </div>

                        <p className="text-xs text-on-surface-variant line-clamp-2 mb-4 leading-relaxed">
                          {mod.description}
                        </p>
                      </div>

                      {/* Curated Resources */}
                      <div className="space-y-2 pt-2 border-t border-outline-variant/10">
                        {mod.resources.slice(0, 2).map((r) => (
                          <a
                            key={r.title}
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="w-full py-2 bg-surface-container-lowest hover:bg-surface-container-highest rounded-lg text-[10px] font-medium transition-colors text-left px-3 flex items-center justify-between group/res"
                          >
                            <span className="truncate pr-2 text-on-surface">{r.title}</span>
                            <span className="material-symbols-outlined text-[12px] text-red-400">smart_display</span>
                          </a>
                        ))}
                        <button
                          onClick={() => router.push(`/module/${mod.id}`)}
                          className="w-full py-1.5 text-center text-xs font-bold text-cyan-400 hover:underline pt-1 flex items-center justify-center gap-1"
                        >
                          <span>Open Module & Quiz</span>
                          <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>

      {/* Bottom Navigation */}
      <div className="mt-20 flex items-center justify-between border-t border-outline-variant/10 pt-8">
        <button onClick={() => router.push("/dashboard")} className="flex flex-col items-start group">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1">Previous Screen</span>
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">
              chevron_left
            </span>
            Gap Analysis
          </div>
        </button>
        <button onClick={() => router.push("/module/1")} className="flex flex-col items-end group">
          <span className="text-[10px] uppercase tracking-widest text-on-surface-variant mb-1 text-right">
            Next Screen
          </span>
          <div className="flex items-center gap-2 text-primary font-bold text-sm">
            Module Detail
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
              chevron_right
            </span>
          </div>
        </button>
      </div>
    </motion.div>
  );
}
