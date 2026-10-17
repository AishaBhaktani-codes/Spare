"use client";

import { useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useApp } from "@/lib/context";
import { useToast } from "@/components/Toast";
import { generateStudentRoadmap, DynamicModule } from "@/lib/roadmap-generator";

const typeIcons: Record<string, string> = {
  video: "play_circle",
  docs: "description",
  course: "school",
};

const typeColors: Record<string, string> = {
  video: "text-red-400",
  docs: "text-cyan-400",
  course: "text-secondary",
};

const typeLabels: Record<string, string> = {
  video: "Video Deep Dive",
  docs: "Documentation",
  course: "Applied Lab",
};

const priorityStyles: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", label: "Critical Priority" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Medium Priority" },
  low: { bg: "bg-emerald-400/10", text: "text-emerald-400", label: "Optional / Enrichment" },
};

export default function ModuleDetailPage() {
  const router = useRouter();
  const params = useParams();
  const moduleId = String(params.id);
  const { completedModules, toggleModule, studentAnalysis, studentVerification } = useApp();
  const { showToast } = useToast();
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [activeVideoId, setActiveVideoId] = useState<string | null>(null);

  // Generate dynamic roadmap based 100% on user input
  const { modules, fieldTitle, hasRealData } = useMemo(() => {
    return generateStudentRoadmap(studentAnalysis, studentVerification);
  }, [studentAnalysis, studentVerification]);

  const currentIndex = modules.findIndex((m) => String(m.id) === String(moduleId));
  const mod: DynamicModule | undefined =
    currentIndex >= 0 ? modules[currentIndex] : modules[Number(moduleId) - 1] || modules[0];

  if (!hasRealData || !mod) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-32 text-center space-y-4">
        <h1 className="text-3xl font-bold text-on-surface">No Active Module Found</h1>
        <p className="text-on-surface-variant text-sm max-w-md mx-auto">
          Modules are dynamically generated to bridge your verified skill gaps. Please complete the Student Verification workflow.
        </p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 px-6 py-2.5 rounded-xl pulse-gradient text-white text-xs font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] inline-flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">school</span>
          Go to Student Verification
        </button>
      </div>
    );
  }

  const isDone = completedModules.has(Number(mod.id));
  const p = priorityStyles[mod.priority] || priorityStyles.medium;

  const handleQuizAnswer = (index: number) => {
    if (quizSubmitted) return;
    setSelectedAnswer(index);
    setQuizSubmitted(true);
  };

  const handleMarkComplete = () => {
    toggleModule(Number(mod.id));
    if (!isDone) {
      showToast(`"${mod.title}" marked as complete!`);
      setTimeout(() => router.push("/roadmap"), 300);
    } else {
      showToast(`"${mod.title}" marked as incomplete.`);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="pb-32">
      {/* Hero Section */}
      <header className="max-w-7xl mx-auto px-6 pt-16 pb-12 faint-grid">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-8">
          <div className="max-w-3xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="flex items-end gap-1">
                <div className="w-1.5 h-4 bg-primary-container rounded-full" />
                <div className="w-1.5 h-6 bg-secondary rounded-full" />
                <div className="w-1.5 h-3 bg-success rounded-full" />
                <div className="w-1.5 h-5 bg-tertiary rounded-full" />
              </div>
              <span className="text-xs font-bold tracking-[0.2em] text-secondary uppercase">
                {mod.category} • {mod.phaseTitle}
              </span>
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold text-primary-container tracking-tight leading-tight mb-6">
              {mod.title}
            </h1>
            <p className="text-base md:text-lg text-on-surface-variant leading-relaxed mb-6">
              {mod.description}
            </p>
            <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 flex items-start gap-3">
              <span className="material-symbols-outlined text-cyan-400 text-lg mt-0.5">flag</span>
              <div>
                <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Action Step</p>
                <p className="text-xs text-on-surface-variant mt-0.5">{mod.actionStep}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-surface-container-low p-6 rounded-xl shadow-sm border-l-4 border-primary-container">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-primary-fixed-dim p-2 bg-surface-container rounded-lg">
                schedule
              </span>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">EST. BRIDGING HOURS</p>
                <p className="text-xl font-bold text-on-surface font-mono">{mod.hours} hrs</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl shadow-sm border-l-4 border-secondary">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-secondary p-2 bg-surface-container rounded-lg">
                speed
              </span>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">PRIORITY LEVEL</p>
                <p className={`text-xl font-bold ${p.text}`}>{p.label}</p>
              </div>
            </div>
          </div>
          <div className="bg-surface-container-low p-6 rounded-xl shadow-sm border-l-4 border-tertiary">
            <div className="flex items-center gap-4">
              <span className="material-symbols-outlined text-tertiary p-2 bg-surface-container rounded-lg">
                smart_display
              </span>
              <div>
                <p className="text-xs text-on-surface-variant font-medium">CURATED MODULES</p>
                <p className="text-xl font-bold text-on-surface font-mono">{mod.resources.length} Learning Nodes</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Embedded Video Player */}
      <AnimatePresence mode="wait">
        {activeVideoId && (
          <motion.section
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="max-w-5xl mx-auto px-6 mb-12"
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

      {/* Curated Materials */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-primary-container mb-8 flex items-center gap-3">
          <span className="w-8 h-[2px] bg-primary-container" />
          Curated Learning Resources for {mod.title}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {mod.resources.map((resource, i) => {
            const isYouTube = resource.url.includes("youtube.com/watch");
            const vId = isYouTube ? new URL(resource.url).searchParams.get("v") : null;

            return (
              <motion.div
                key={resource.title + i}
                onClick={() => (isYouTube && vId ? setActiveVideoId(vId) : window.open(resource.url, "_blank"))}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={`bg-surface-container rounded-xl p-6 flex flex-col justify-between hover:translate-y-[-4px] transition-all duration-300 group cursor-pointer ${
                  activeVideoId === vId ? "ring-2 ring-primary-container bg-surface-container-high" : ""
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className={`material-symbols-outlined text-3xl ${typeColors[resource.type || "video"]}`}
                      style={resource.type === "video" ? { fontVariationSettings: "'FILL' 1" } : {}}
                    >
                      {typeIcons[resource.type || "video"]}
                    </span>
                    <span className="text-xs text-on-surface-variant font-mono">{resource.duration}</span>
                  </div>
                  <p className={`text-[10px] font-bold ${typeColors[resource.type || "video"]} tracking-widest uppercase mb-2`}>
                    {typeLabels[resource.type || "video"]}
                  </p>
                  <h3 className="text-base font-bold text-on-surface mb-2 leading-tight">{resource.title}</h3>
                  <p className="text-xs text-on-surface-variant mb-4 flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs">source</span>
                    {resource.source}
                  </p>
                </div>
                <button className="text-primary-fixed-dim text-xs font-bold flex items-center gap-2 group/btn mt-4">
                  {isYouTube ? "Watch Lecture Inline" : "Open Resource in New Tab"}
                  <span className="material-symbols-outlined text-sm group-hover/btn:translate-x-1 transition-transform">
                    {isYouTube ? "play_circle" : "open_in_new"}
                  </span>
                </button>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Knowledge Check Quiz */}
      <section className="max-w-4xl mx-auto px-6 py-12 mb-12">
        <div className="bg-surface-container-low rounded-2xl p-8 relative overflow-hidden shadow-xl border border-primary/10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <h2 className="text-xl font-bold text-on-surface flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container">quiz</span>
              Domain Validation Check
            </h2>
            <div className="text-left sm:text-right w-full sm:w-auto">
              <p className="text-xs text-on-surface-variant font-bold tracking-widest uppercase mb-1">
                Status:{" "}
                {quizSubmitted
                  ? selectedAnswer === mod.quiz.correct
                    ? "Passed Validation ✓"
                    : "Needs Review"
                  : "Pending Validation"}
              </p>
              <div className="w-full sm:w-48 h-1.5 bg-surface-container-highest rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    quizSubmitted
                      ? selectedAnswer === mod.quiz.correct
                        ? "bg-success"
                        : "bg-error"
                      : "bg-primary-container/30"
                  } transition-all`}
                  style={{ width: quizSubmitted ? "100%" : "0%" }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start gap-4 mb-6 bg-surface-container p-4 rounded-xl">
              <span className="w-8 h-8 shrink-0 flex items-center justify-center bg-primary-container text-on-primary-container text-sm font-bold rounded-lg shadow-inner">
                Q
              </span>
              <p className="text-on-surface font-medium leading-relaxed pt-1 text-sm">{mod.quiz.question}</p>
            </div>
            <div className="ml-0 sm:ml-12 space-y-3">
              {mod.quiz.options.map((option: string, oi: number) => {
                let style =
                  "bg-surface-container hover:bg-surface-container-high hover:border-primary/30 border border-transparent cursor-pointer";
                let icon = "";
                if (quizSubmitted) {
                  if (oi === mod.quiz.correct) {
                    style = "bg-success/10 border border-success/30 shadow-[0_0_15px_rgba(52,211,153,0.1)]";
                    icon = "check_circle";
                  } else if (oi === selectedAnswer && oi !== mod.quiz.correct) {
                    style = "bg-error/10 border border-error/30";
                    icon = "cancel";
                  } else {
                    style = "bg-surface-container opacity-40 border-transparent grayscale";
                  }
                }
                return (
                  <button
                    key={oi}
                    onClick={() => handleQuizAnswer(oi)}
                    className={`w-full p-4 rounded-xl flex items-center justify-between text-left transition-all duration-300 ${style}`}
                    disabled={quizSubmitted}
                  >
                    <span
                      className={`text-xs sm:text-sm font-medium ${
                        quizSubmitted && oi === mod.quiz.correct
                          ? "text-success font-bold"
                          : quizSubmitted && oi === selectedAnswer
                          ? "text-error"
                          : "text-on-surface"
                      }`}
                    >
                      {option}
                    </span>
                    {quizSubmitted && icon && (
                      <span
                        className={`material-symbols-outlined shrink-0 ml-3 ${
                          oi === mod.quiz.correct ? "text-success" : "text-error"
                        }`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {icon}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            {quizSubmitted && selectedAnswer !== mod.quiz.correct && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="ml-0 sm:ml-12 text-xs text-on-error-container bg-error-container/20 p-4 border border-error/20 rounded-xl mt-4 flex gap-3 items-start"
              >
                <span className="material-symbols-outlined text-error shrink-0 mt-0.5">info</span>
                <div>
                  <p className="font-bold mb-1 text-error">Concept Clarification</p>
                  <p className="opacity-90 leading-relaxed">{mod.quiz.explanation}</p>
                </div>
              </motion.div>
            )}
            {quizSubmitted && selectedAnswer === mod.quiz.correct && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="ml-0 sm:ml-12 text-xs text-success bg-success/10 p-4 border border-success/20 rounded-xl mt-4 flex gap-3 items-center"
              >
                <span className="material-symbols-outlined text-success shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>
                  verified
                </span>
                <p className="font-bold">{mod.quiz.explanation}</p>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Navigation */}
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center py-6 text-on-surface-variant pb-24 border-t border-surface-container">
        {currentIndex > 0 ? (
          <button
            onClick={() => router.push(`/module/${modules[currentIndex - 1].id}`)}
            className="flex items-center gap-2 hover:text-primary transition-colors group"
          >
            <span className="material-symbols-outlined group-hover:-translate-x-1 transition-transform">arrow_back</span>
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
              Previous: {modules[currentIndex - 1].title}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider sm:hidden">Previous</span>
          </button>
        ) : (
          <div />
        )}
        {currentIndex < modules.length - 1 ? (
          <button
            onClick={() => router.push(`/module/${modules[currentIndex + 1].id}`)}
            className="flex items-center gap-2 hover:text-primary transition-colors group"
          >
            <span className="text-xs font-bold uppercase tracking-wider hidden sm:inline">
              Next: {modules[currentIndex + 1].title}
            </span>
            <span className="text-xs font-bold uppercase tracking-wider sm:hidden">Next</span>
            <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
          </button>
        ) : (
          <div />
        )}
      </div>

      {/* Floating Footer Action Bar */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-3rem)] max-w-2xl">
        <div className="bg-slate-900/90 backdrop-blur-xl rounded-2xl p-4 flex gap-4 items-center shadow-[0_-4px_24px_rgba(0,0,0,0.4)] border border-slate-800/50">
          <button
            onClick={() => router.push("/roadmap")}
            className="flex-1 px-6 py-3 bg-slate-800 text-slate-200 rounded-xl font-bold text-xs hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-base">undo</span>
            <span>Back to Roadmap</span>
          </button>
          <button
            onClick={handleMarkComplete}
            className={`flex-[1.5] px-6 py-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 ${
              isDone
                ? "bg-success/20 text-success border border-success/30"
                : "pulse-gradient text-white hover:brightness-110 shadow-[0_0_20px_rgba(124,58,237,0.3)]"
            }`}
          >
            <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
              {isDone ? "check_circle" : "task_alt"}
            </span>
            {isDone ? "Completed ✓" : "Mark as Complete"}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
