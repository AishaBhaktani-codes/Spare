"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface RequiredSkill {
  skill: string;
  category: string;
  description: string;
}

interface Analysis {
  marksheet: {
    filename: string;
    studentName: string | null;
    board: string | null;
    examLevel: string | null;
    subjects: Array<{ subject: string; marksObtained: number | null; maxMarks: number | null; grade: string | null }>;
    percentage: number | null;
  };
  pursuitPath: string[];
  fieldOfInterest: string;
  ratings: Array<{ skill: string; rating: number }>;
  averageRating: number;
  strengths: Array<{ skill: string; rating: number; reason: string }>;
  gaps: Array<{ skill: string; rating: number; priority: "critical" | "medium" | "low"; reason: string; nextStep: string; resourceUrl: string }>;
  marksheetInsights: string[];
  summary: string;
  recommendedNextSteps: string[];
}

const priorityStyles: Record<string, string> = {
  critical: "bg-red-500/10 text-red-400 border-red-500/30",
  medium: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  low: "bg-emerald-400/10 text-emerald-400 border-emerald-400/30",
};

async function postJSON<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data as T;
}

export default function StudentVerificationPage() {
  const { setStudentAnalysis, setStudentVerification } = useApp();

  // ---- Multi-level pursuit selection ----
  const [path, setPath] = useState<string[]>([]);
  const [options, setOptions] = useState<string[]>([]);
  const [isFinal, setIsFinal] = useState(false);
  const [optionsLoading, setOptionsLoading] = useState(false);
  const [customOption, setCustomOption] = useState("");

  // ---- Field of interest + skills ----
  const [fieldOfInterest, setFieldOfInterest] = useState("");
  const [interpretedField, setInterpretedField] = useState<string | null>(null);
  const [fieldAnalysis, setFieldAnalysis] = useState<string | null>(null);
  const [skills, setSkills] = useState<RequiredSkill[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  // ---- Marksheet + analysis ----
  const [marksheet, setMarksheet] = useState<File | null>(null);
  const [savedMarksheetName, setSavedMarksheetName] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [isRestored, setIsRestored] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const showError = (msg: string) => {
    setError(msg);
    setTimeout(() => setError(null), 6000);
  };

  // Fetch the next level of options whenever the path changes
  const loadOptions = async (newPath: string[]) => {
    setOptionsLoading(true);
    setOptions([]);
    setIsFinal(false);
    try {
      const res = await postJSON<{ options: string[]; isFinal: boolean }>("/api/student/pursuit-options", { path: newPath });
      setOptions(res.options);
      setIsFinal(res.isFinal);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setOptionsLoading(false);
    }
  };

  // Restore state from localStorage on mount (preserves state across browser refreshes)
  useEffect(() => {
    try {
      const savedVerif = localStorage.getItem("gg_student_verification");
      const savedAnalysis = localStorage.getItem("gg_student_analysis");

      let hasSavedPath = false;
      if (savedVerif) {
        const parsed = JSON.parse(savedVerif);
        if (Array.isArray(parsed.path) && parsed.path.length > 0) {
          setPath(parsed.path);
          setIsFinal(Boolean(parsed.isFinal));
          hasSavedPath = true;
          if (Array.isArray(parsed.options) && parsed.options.length > 0) {
            setOptions(parsed.options);
          } else if (!parsed.isFinal) {
            loadOptions(parsed.path);
          }
        }
        if (parsed.fieldOfInterest) setFieldOfInterest(parsed.fieldOfInterest);
        if (parsed.interpretedField) setInterpretedField(parsed.interpretedField);
        if (parsed.fieldAnalysis) setFieldAnalysis(parsed.fieldAnalysis);
        if (Array.isArray(parsed.skills) && parsed.skills.length > 0) setSkills(parsed.skills);
        if (parsed.ratings) setRatings(parsed.ratings);
        if (parsed.savedMarksheetName) setSavedMarksheetName(parsed.savedMarksheetName);
      }

      if (savedAnalysis) {
        const parsedAnalysis = JSON.parse(savedAnalysis);
        setAnalysis(parsedAnalysis);
      }

      if (!hasSavedPath) {
        loadOptions([]);
      }
    } catch (e) {
      console.error("Error restoring verification state from storage", e);
      loadOptions([]);
    }
    setIsRestored(true);
  }, []);

  // Persist student verification inputs to localStorage
  useEffect(() => {
    if (!isRestored) return;
    const stateToSave = {
      path,
      isFinal,
      options,
      fieldOfInterest,
      interpretedField,
      fieldAnalysis,
      skills,
      ratings,
      savedMarksheetName: marksheet?.name || savedMarksheetName,
    };
    try {
      localStorage.setItem("gg_student_verification", JSON.stringify(stateToSave));
      setStudentVerification(stateToSave);
    } catch (e) {
      console.error("Error saving state to localStorage", e);
    }
  }, [path, isFinal, options, fieldOfInterest, interpretedField, fieldAnalysis, skills, ratings, marksheet, savedMarksheetName, isRestored]);

  // Persist analysis results to localStorage and global context
  useEffect(() => {
    if (!isRestored) return;
    if (analysis) {
      try {
        localStorage.setItem("gg_student_analysis", JSON.stringify(analysis));
        setStudentAnalysis(analysis);
      } catch (e) {
        console.error("Error saving analysis to localStorage", e);
      }
    }
  }, [analysis, isRestored]);

  // Clear device storage and reset to a fresh verification
  const handleResetVerification = () => {
    if (typeof window !== "undefined") {
      const confirmReset = window.confirm("Start a new verification? This will clear your current entries on this device.");
      if (!confirmReset) return;
    }
    localStorage.removeItem("gg_student_verification");
    localStorage.removeItem("gg_student_analysis");
    setPath([]);
    setIsFinal(false);
    setOptions([]);
    setFieldOfInterest("");
    setInterpretedField(null);
    setFieldAnalysis(null);
    setSkills([]);
    setRatings({});
    setMarksheet(null);
    setSavedMarksheetName(null);
    setAnalysis(null);
    setStudentAnalysis(null);
    setStudentVerification(null);
    loadOptions([]);
  };

  // Any change to the path or field invalidates skills, ratings and results
  const resetDownstream = () => {
    setSkills([]);
    setInterpretedField(null);
    setFieldAnalysis(null);
    setRatings({});
    setAnalysis(null);
  };

  const selectOption = (option: string) => {
    const value = option.trim();
    if (!value) return;
    const newPath = [...path, value];
    setPath(newPath);
    setCustomOption("");
    resetDownstream();
    loadOptions(newPath);
  };

  const goToLevel = (index: number) => {
    // index = -1 resets to the top level
    const newPath = path.slice(0, index + 1);
    setPath(newPath);
    resetDownstream();
    loadOptions(newPath);
  };

  const loadSkills = async () => {
    if (!path.length) return showError("Select what you are pursuing first.");
    if (!fieldOfInterest.trim()) return showError("Enter your field of interest.");
    setSkillsLoading(true);
    setAnalysis(null);
    try {
      const res = await postJSON<{
        skills: RequiredSkill[];
        interpretedField?: string;
        fieldAnalysis?: string;
      }>("/api/student/skills", {
        path,
        fieldOfInterest: fieldOfInterest.trim(),
      });
      setSkills(res.skills || []);
      setInterpretedField(res.interpretedField || null);
      setFieldAnalysis(res.fieldAnalysis || null);
      setRatings({});
    } catch (e: any) {
      showError(e.message);
    } finally {
      setSkillsLoading(false);
    }
  };

  const ratedCount = skills.filter((s) => ratings[s.skill] !== undefined).length;
  const allRated = skills.length > 0 && ratedCount === skills.length;

  const runAnalysis = async () => {
    if (!marksheet && !savedMarksheetName) return showError("Upload your marksheet (PDF).");
    if (!allRated) return showError(`Rate all skills first (${ratedCount}/${skills.length} rated).`);

    setAnalyzing(true);
    try {
      const form = new FormData();
      if (marksheet) {
        form.append("marksheet", marksheet);
      } else {
        // Create an empty dummy pdf blob if re-analyzing with cached name or require file
        form.append("marksheet", new Blob([""], { type: "application/pdf" }), savedMarksheetName || "marksheet.pdf");
      }
      form.append("pursuitPath", JSON.stringify(path));
      form.append("fieldOfInterest", (interpretedField || fieldOfInterest).trim());
      form.append("ratings", JSON.stringify(skills.map((s) => ({ skill: s.skill, rating: ratings[s.skill] }))));

      const res = await fetch(`${API_URL}/api/student/analyze`, { method: "POST", body: form });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Analysis failed");
      setAnalysis(data);
      if (marksheet) setSavedMarksheetName(marksheet.name);
      localStorage.setItem("gg_student_analysis", JSON.stringify(data));
      setStudentAnalysis(data);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e: any) {
      showError(e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  // Group skills by category for display
  const grouped = skills.reduce<Record<string, RequiredSkill[]>>((acc, s) => {
    (acc[s.category] ||= []).push(s);
    return acc;
  }, {});

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="max-w-5xl mx-auto px-6 py-12 pb-32 space-y-10">
      {error && (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] bg-red-500/90 backdrop-blur-md text-white px-6 py-3 rounded-xl shadow-xl flex items-center gap-3 max-w-lg">
          <span className="material-symbols-outlined">error</span>
          <span className="text-sm font-medium">{error}</span>
          <button onClick={() => setError(null)} className="ml-auto">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-4xl md:text-5xl font-extrabold text-primary-container tracking-tight">Student Skill Verification</h1>
            {isRestored && (path.length > 0 || analysis) && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Saved on Device
              </span>
            )}
          </div>
          <p className="text-on-surface-variant max-w-2xl mt-1">
            Tell us what you are pursuing and what you are interested in, rate your skills, and upload your marksheet. Everything below is generated for your exact path.
          </p>
        </div>
        {(path.length > 0 || skills.length > 0 || analysis) && (
          <button
            onClick={handleResetVerification}
            className="px-4 py-2 rounded-xl border border-outline-variant/30 text-on-surface-variant hover:text-error hover:border-error/40 text-xs font-bold transition-all flex items-center gap-2 self-start md:self-center bg-surface-container hover:bg-error/10"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Start Fresh
          </button>
        )}
      </header>

      {/* ===== STEP 1: What are you pursuing (multi-level, AI-generated per level) ===== */}
      <section className="bg-surface-container rounded-2xl p-6 space-y-5 border border-outline-variant/20">
        <StepTitle num={1} title="What are you pursuing?" done={isFinal && path.length > 0} />

        {/* Breadcrumb of selected levels */}
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={() => goToLevel(-1)} className="text-xs font-semibold text-on-surface-variant hover:text-secondary transition-colors">
            Start
          </button>
          {path.map((p, i) => (
            <span key={`${p}-${i}`} className="flex items-center gap-2">
              <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>
              <button
                onClick={() => goToLevel(i)}
                title="Change from this level"
                className="px-3 py-1 rounded-lg bg-primary-container/20 text-primary text-xs font-semibold border border-primary-container/40 hover:border-secondary transition-all"
              >
                {p}
              </button>
            </span>
          ))}
        </div>

        {optionsLoading ? (
          <div className="flex items-center gap-3 text-sm text-on-surface-variant py-4">
            <span className="w-4 h-4 rounded-full border-2 border-secondary border-t-transparent animate-spin" />
            Loading options…
          </div>
        ) : isFinal ? (
          <p className="text-sm text-success flex items-center gap-2">
            <span className="material-symbols-outlined text-base">check_circle</span>
            Path selected. Click any level above to change it.
          </p>
        ) : (
          <div className="space-y-4">
            {options.length > 0 && <p className="text-xs uppercase tracking-widest text-on-surface-variant font-bold">Level {path.length + 1}</p>}
            <div className="flex flex-wrap gap-3">
              {options.map((opt) => (
                <button
                  key={opt}
                  onClick={() => selectOption(opt)}
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-surface-container-low text-on-surface border border-outline-variant/30 hover:border-primary-container hover:bg-primary-container/10 transition-all"
                >
                  {opt}
                </button>
              ))}
            </div>
            <div className="flex gap-2 max-w-md">
              <input
                value={customOption}
                onChange={(e) => setCustomOption(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && selectOption(customOption)}
                placeholder="Not listed? Type your own"
                className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-secondary"
              />
              <button
                onClick={() => selectOption(customOption)}
                disabled={!customOption.trim()}
                className="px-4 py-2 rounded-xl bg-primary-container text-on-primary-container text-sm font-bold disabled:opacity-40"
              >
                Add
              </button>
            </div>
            {path.length > 0 && (
              <button onClick={() => setIsFinal(true)} className="text-xs text-secondary hover:underline">
                This is specific enough, stop here →
              </button>
            )}
          </div>
        )}
      </section>

      {/* ===== STEP 2: Field of interest ===== */}
      <section className={`bg-surface-container rounded-2xl p-6 space-y-4 border border-outline-variant/20 transition-opacity ${path.length ? "" : "opacity-50 pointer-events-none"}`}>
        <StepTitle num={2} title="Field of interest" done={skills.length > 0} />
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={fieldOfInterest}
            onChange={(e) => {
              setFieldOfInterest(e.target.value);
              if (skills.length) resetDownstream();
            }}
            onKeyDown={(e) => e.key === "Enter" && loadSkills()}
            placeholder="e.g. Artificial Intelligence, Medicine, Investment Banking, Game Design…"
            className="flex-1 bg-surface-container-lowest border border-outline-variant/30 rounded-xl px-4 py-3 text-sm text-on-surface focus:outline-none focus:border-secondary"
          />
          <button
            onClick={loadSkills}
            disabled={skillsLoading || !fieldOfInterest.trim() || !path.length}
            className="pulse-gradient px-6 py-3 rounded-xl text-on-primary-container font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {skillsLoading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Checking with Groq AI…
              </>
            ) : (
              "Get skills to rate"
            )}
          </button>
        </div>

        {interpretedField && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4 bg-primary-container/10 border border-primary-container/30 space-y-1.5"
          >
            <div className="flex items-center gap-2 text-xs font-bold text-secondary uppercase tracking-wider">
              <span className="material-symbols-outlined text-sm">auto_awesome</span>
              Groq AI Verified Discipline
            </div>
            <div className="text-base font-semibold text-on-surface flex items-center gap-2 flex-wrap">
              <span>{interpretedField}</span>
              {interpretedField.toLowerCase() !== fieldOfInterest.trim().toLowerCase() && (
                <span className="text-xs text-on-surface-variant font-normal">
                  (interpreted from &quot;{fieldOfInterest}&quot;)
                </span>
              )}
            </div>
            {fieldAnalysis && (
              <p className="text-xs text-on-surface-variant leading-relaxed">
                {fieldAnalysis}
              </p>
            )}
          </motion.div>
        )}
      </section>

      {/* ===== STEP 3: Rate every skill out of 10 ===== */}
      <AnimatePresence>
        {skills.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface-container rounded-2xl p-6 space-y-6 border border-outline-variant/20">
            <div className="flex justify-between items-center">
              <StepTitle num={3} title={`Rate your expertise in ${interpretedField || fieldOfInterest} (0–10)`} done={allRated} />
              <span className="text-xs font-mono text-on-surface-variant">
                {ratedCount}/{skills.length} rated
              </span>
            </div>

            {Object.entries(grouped).map(([category, list]) => (
              <div key={category} className="space-y-3">
                <h4 className="text-xs uppercase tracking-widest text-secondary font-bold">{category}</h4>
                {list.map((s) => (
                  <RatingRow
                    key={s.skill}
                    skill={s}
                    value={ratings[s.skill]}
                    onChange={(v) => setRatings((prev) => ({ ...prev, [s.skill]: v }))}
                  />
                ))}
              </div>
            ))}
          </motion.section>
        )}
      </AnimatePresence>

      {/* ===== STEP 4: Marksheet + Analyze ===== */}
      {skills.length > 0 && (
        <section className="bg-surface-container rounded-2xl p-6 space-y-5 border border-outline-variant/20">
          <StepTitle num={4} title="Upload your marksheet" done={!!marksheet || !!savedMarksheetName} />
          <div
            onClick={() => fileRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const f = e.dataTransfer.files[0];
              if (f) handleFile(f);
            }}
            className="flex flex-col items-center justify-center h-40 bg-[#111827] border-2 border-dashed border-primary-container/40 rounded-xl hover:border-secondary transition-all cursor-pointer"
          >
            <input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
            {marksheet ? (
              <>
                <span className="material-symbols-outlined text-success text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                  check_circle
                </span>
                <p className="text-success font-semibold text-sm">{marksheet.name}</p>
                <p className="text-on-surface-variant text-xs mt-1">Click to replace</p>
              </>
            ) : savedMarksheetName ? (
              <>
                <span className="material-symbols-outlined text-secondary text-4xl mb-2" style={{ fontVariationSettings: "'FILL' 1" }}>
                  task
                </span>
                <p className="text-secondary font-semibold text-sm">{savedMarksheetName}</p>
                <p className="text-on-surface-variant text-xs mt-1">Saved on this device • Click to replace file</p>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-primary text-4xl mb-2">upload_file</span>
                <p className="text-on-surface font-semibold">Marksheet (PDF)</p>
                <p className="text-on-surface-variant text-xs mt-1">Drag and drop or click to upload</p>
              </>
            )}
          </div>

          <div className="flex justify-end">
            <button
              onClick={runAnalysis}
              disabled={analyzing || !marksheet || !allRated}
              className="pulse-gradient px-10 py-4 rounded-xl text-on-primary-container font-extrabold text-lg shadow-[0_0_30px_rgba(124,58,237,0.3)] hover:scale-[1.02] transition-all flex items-center gap-3 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {analyzing ? (
                <>
                  <span className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Analyzing…
                </>
              ) : (
                <>
                  Analyze <span className="material-symbols-outlined">analytics</span>
                </>
              )}
            </button>
          </div>
        </section>
      )}

      {/* ===== RESULTS ===== */}
      {analysis && (
        <motion.div ref={resultsRef} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 border border-primary-container/30 space-y-3">
            <h2 className="text-2xl font-extrabold text-on-surface">Your Analysis</h2>
            <p className="text-xs text-on-surface-variant">
              {analysis.pursuitPath.join(" › ")} · Interest: <span className="text-secondary">{analysis.fieldOfInterest}</span>
            </p>
            <p className="text-on-surface leading-relaxed">{analysis.summary}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Stat label="Marksheet percentage" value={analysis.marksheet.percentage !== null ? `${analysis.marksheet.percentage}%` : "N/A"} />
            <Stat label="Average self-rating" value={`${analysis.averageRating}/10`} />
            <Stat label="Skills needing work" value={String(analysis.gaps.length)} />
          </div>

          {/* Marksheet subjects */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 space-y-4">
            <h3 className="font-bold text-on-surface">
              Marksheet{" "}
              <span className="text-xs text-on-surface-variant font-normal">
                {[analysis.marksheet.studentName, analysis.marksheet.board, analysis.marksheet.examLevel].filter(Boolean).join(" · ")}
              </span>
            </h3>
            <div className="space-y-2">
              {analysis.marksheet.subjects.map((s) => {
                const pct = s.marksObtained !== null && s.maxMarks ? Math.round((s.marksObtained / s.maxMarks) * 100) : null;
                return (
                  <div key={s.subject} className="flex items-center gap-4">
                    <span className="w-40 text-sm text-on-surface truncate">{s.subject}</span>
                    <div className="flex-1 h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                      <div className="h-full pulse-gradient" style={{ width: `${pct ?? 0}%` }} />
                    </div>
                    <span className="w-24 text-right text-xs font-mono text-on-surface-variant">
                      {s.marksObtained ?? "?"}/{s.maxMarks ?? "?"}
                      {s.grade ? ` (${s.grade})` : ""}
                    </span>
                  </div>
                );
              })}
            </div>
            {analysis.marksheetInsights.length > 0 && (
              <ul className="pt-2 space-y-1.5 text-sm text-on-surface-variant list-disc list-inside">
                {analysis.marksheetInsights.map((i, idx) => (
                  <li key={idx}>{i}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Strengths */}
            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 space-y-3">
              <h3 className="font-bold text-emerald-400 flex items-center gap-2">
                <span className="material-symbols-outlined">trending_up</span> Strengths
              </h3>
              {analysis.strengths.length === 0 && <p className="text-sm text-on-surface-variant">No clear strengths identified yet.</p>}
              {analysis.strengths.map((s) => (
                <div key={s.skill} className="bg-surface-container-low rounded-xl p-3 border-l-2 border-emerald-400">
                  <div className="flex justify-between">
                    <span className="text-sm font-bold text-on-surface">{s.skill}</span>
                    <span className="text-xs font-mono text-emerald-400">{s.rating}/10</span>
                  </div>
                  <p className="text-xs text-on-surface-variant mt-1">{s.reason}</p>
                </div>
              ))}
            </div>

            {/* Gaps */}
            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 space-y-3">
              <h3 className="font-bold text-amber-400 flex items-center gap-2">
                <span className="material-symbols-outlined">build</span> Skills to improve
              </h3>
              {analysis.gaps.length === 0 && <p className="text-sm text-on-surface-variant">No gaps identified.</p>}
              {analysis.gaps.map((g) => (
                <div key={g.skill} className="bg-surface-container-low rounded-xl p-3 space-y-1.5">
                  <div className="flex justify-between items-center gap-2">
                    <span className="text-sm font-bold text-on-surface">{g.skill}</span>
                    <span className="flex items-center gap-2">
                      <span className="text-xs font-mono text-on-surface-variant">{g.rating}/10</span>
                      <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${priorityStyles[g.priority]}`}>{g.priority}</span>
                    </span>
                  </div>
                  <p className="text-xs text-on-surface-variant">{g.reason}</p>
                  <p className="text-xs text-on-surface">
                    <span className="text-secondary font-semibold">Next: </span>
                    {g.nextStep}
                  </p>
                  <a href={g.resourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:text-secondary">
                    <span className="material-symbols-outlined text-sm text-red-400">play_circle</span> Find tutorials
                  </a>
                </div>
              ))}
            </div>
          </div>

          {analysis.recommendedNextSteps.length > 0 && (
            <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 space-y-3">
              <h3 className="font-bold text-on-surface">Recommended next steps</h3>
              <ol className="space-y-2">
                {analysis.recommendedNextSteps.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-on-surface-variant">
                    <span className="w-6 h-6 shrink-0 rounded-full bg-primary-container/30 text-primary text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );

  function handleFile(f: File) {
    if (!f.name.toLowerCase().endsWith(".pdf")) {
      showError("Only PDF marksheets are supported.");
      return;
    }
    setMarksheet(f);
    setAnalysis(null);
  }
}

function StepTitle({ num, title, done }: { num: number; title: string; done?: boolean }) {
  return (
    <h3 className="flex items-center gap-3 text-lg font-bold text-on-surface">
      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${done ? "bg-success/20 text-success" : "bg-primary-container text-on-primary-container"}`}>
        {done ? <span className="material-symbols-outlined text-sm">check</span> : num}
      </span>
      {title}
    </h3>
  );
}

function RatingRow({ skill, value, onChange }: { skill: RequiredSkill; value: number | undefined; onChange: (v: number) => void }) {
  return (
    <div className="bg-surface-container-low rounded-xl p-4 space-y-3">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-sm font-semibold text-on-surface">{skill.skill}</p>
          {skill.description && <p className="text-xs text-on-surface-variant mt-0.5">{skill.description}</p>}
        </div>
        <span className={`text-lg font-black font-mono shrink-0 ${value === undefined ? "text-outline" : "text-secondary"}`}>
          {value === undefined ? "–" : value}
          <span className="text-xs text-on-surface-variant">/10</span>
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: 11 }, (_, n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-8 rounded-md text-xs font-bold transition-all ${
              value !== undefined && n <= value ? "pulse-gradient text-white" : "bg-surface-container-highest text-on-surface-variant hover:bg-surface-bright"
            } ${value === n ? "ring-2 ring-secondary" : ""}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-container rounded-2xl p-5 border border-outline-variant/20">
      <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold">{label}</p>
      <p className="text-3xl font-black text-secondary font-mono mt-1">{value}</p>
    </div>
  );
}
