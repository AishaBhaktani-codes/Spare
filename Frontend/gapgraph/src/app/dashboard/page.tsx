"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { user as dummyUser, existingSkills as staticSkills, skillGaps as staticGaps, analyticsData as staticAnalytics } from "@/lib/data";
import { useApp } from "@/lib/context";
import {
  Chart as ChartJS,
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Radar, Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  RadialLinearScale, PointElement, LineElement, Filler, Tooltip, Legend,
  ArcElement, CategoryScale, LinearScale, BarElement
);

const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", label: "Critical" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Medium" },
  low: { bg: "bg-emerald-400/10", text: "text-emerald-400", label: "Optional" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { analysisResult, isLoggedIn } = useApp();
  const [mounted, setMounted] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Dynamic Data Extraction
  const isDynamic = !!analysisResult;
  const existingSkills = isDynamic 
    ? (analysisResult.extractedSkills.resume.technical || []).map((s: any) => ({ name: s.skill, level: Math.round(s.confidence * 100) }))
    : staticSkills;

  const skillGaps = isDynamic
    ? (analysisResult.skillGaps || []).map((g: any) => {
        // Backend returns skillGaps as string[] of skill names
        const name = typeof g === 'string' ? g : (g.skill || g.name || g);
        const currentLevel = typeof g === 'object' ? Math.round((g.currentLevel || 0.1) * 100) : 15;
        const requiredLevel = typeof g === 'object' ? Math.round((g.requiredLevel || 0.85) * 100) : 85;
        const gapSize = typeof g === 'object' ? (g.gapSize || 0.5) : 0.5;
        return {
          name,
          currentLevel,
          requiredLevel,
          priority: gapSize > 0.4 ? "critical" as const : gapSize > 0.2 ? "medium" as const : "low" as const
        };
      })
    : staticGaps;

  // Derive simple counts
  const matchedCount = existingSkills.length;
  const criticalCount = skillGaps.filter((g: any) => g.priority === "critical").length;
  const targetScore = isDynamic ? Math.max(10, 100 - (criticalCount * 15)) : dummyUser.readinessScore;

  useEffect(() => {
    setTimeout(() => setMounted(true), 0);
    let frame = 0;
    const target = targetScore;
    const interval = setInterval(() => {
      frame += 2;
      if (frame >= target) {
        setAnimatedScore(target);
        clearInterval(interval);
      } else {
        setAnimatedScore(frame);
      }
    }, 20);
    return () => clearInterval(interval);
  }, []);

  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Chart Data
  const radarData = {
    labels: isDynamic ? skillGaps.map((g: any) => g.name).slice(0, 6) : staticAnalytics.radarChart.categories,
    datasets: [
      {
        label: "Your Level",
        data: isDynamic ? skillGaps.map((g: any) => g.currentLevel).slice(0, 6) : staticAnalytics.radarChart.userLevels,
        backgroundColor: "rgba(93, 230, 255, 0.15)",
        borderColor: "#5DE6FF",
        borderWidth: 2,
        pointBackgroundColor: "#5DE6FF",
        pointBorderColor: "#5DE6FF",
        pointRadius: 4,
      },
      {
        label: "Required Level",
        data: isDynamic ? skillGaps.map((g: any) => g.requiredLevel).slice(0, 6) : staticAnalytics.radarChart.requiredLevels,
        backgroundColor: "rgba(124, 58, 237, 0.1)",
        borderColor: "#7C3AED",
        borderWidth: 2,
        borderDash: [5, 5],
        pointBackgroundColor: "#7C3AED",
        pointBorderColor: "#7C3AED",
        pointRadius: 4,
      },
    ],
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        ticks: { display: false },
        grid: { color: "rgba(204, 195, 216, 0.08)" },
        angleLines: { color: "rgba(204, 195, 216, 0.08)" },
        pointLabels: { color: "#CCC3D8", font: { size: 11, family: "Manrope" } },
      },
    },
    plugins: { legend: { display: false } },
  };

  const coverageData = {
    labels: ["Matched", "Critical", "Partial", "Optional"],
    datasets: [{
      data: isDynamic 
        ? [matchedCount, criticalCount, skillGaps.length - criticalCount, 2]
        : [staticAnalytics.skillCoverage.matched, staticAnalytics.skillCoverage.critical, staticAnalytics.skillCoverage.partial, staticAnalytics.skillCoverage.optional],
      backgroundColor: ["#34D399", "#EF4444", "#FFAFD3", "#5DE6FF"],
      borderWidth: 0,
    }],
  };

  const coverageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: { legend: { display: false } },
  };

  const gapBarData = {
    labels: isDynamic ? skillGaps.map((g: any) => g.name) : staticGaps.map((g: any) => g.name),
    datasets: [
      {
        label: "Your Level",
        data: isDynamic ? skillGaps.map((g: any) => g.currentLevel) : staticGaps.map((g: any) => g.currentLevel),
        backgroundColor: "#5DE6FF",
        borderRadius: 4,
      },
      {
        label: "Required",
        data: isDynamic ? skillGaps.map((g: any) => g.requiredLevel) : staticGaps.map((g: any) => g.requiredLevel),
        backgroundColor: "rgba(124, 58, 237, 0.4)",
        borderRadius: 4,
      },
    ],
  };

  const gapBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: "y" as const,
    scales: {
      x: { max: 100, grid: { color: "rgba(204,195,216,0.05)" }, ticks: { color: "#6B6B8A" } },
      y: { grid: { display: false }, ticks: { color: "#CCC3D8", font: { size: 11 } } },
    },
    plugins: { legend: { labels: { color: "#CCC3D8", font: { size: 11 } } } },
  };

  const hoursData = {
    labels: isDynamic ? ["Core", "Advanced", "Specialized"] : Object.keys(staticAnalytics.trainingHours),
    datasets: [{
      data: isDynamic ? [15, 12, 8] : Object.values(staticAnalytics.trainingHours),
      backgroundColor: ["#7C3AED", "#EF4444", "#5DE6FF", "#34D399"],
      borderWidth: 0,
    }],
  };

  const hoursOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: { legend: { position: "bottom" as const, labels: { color: "#CCC3D8", font: { size: 11 }, padding: 16 } } },
  };

  const priorityCounts = isDynamic 
    ? { Critical: criticalCount, Medium: skillGaps.filter((g: any) => g.priority === "medium").length, Optional: skillGaps.filter((g: any) => g.priority === "low").length }
    : { Critical: 4, Medium: 2, Optional: 1 };
  const priorityBarData = {
    labels: Object.keys(priorityCounts),
    datasets: [{
      label: "Count",
      data: Object.values(priorityCounts),
      backgroundColor: ["#EF4444", "#FFD700", "#34D399"],
      borderRadius: 8,
    }],
  };

  const priorityBarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1, color: "#6B6B8A" }, grid: { color: "rgba(204,195,216,0.05)" } },
      x: { grid: { display: false }, ticks: { color: "#CCC3D8" } },
    },
    plugins: { legend: { display: false } },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-7xl mx-auto px-6 pt-12 pb-32"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-on-surface-variant text-sm cursor-pointer hover:text-primary transition-colors" onClick={() => router.push("/student-verification")}>
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            <span>Back to Student Verification</span>
          </div>
          <h1 className="text-4xl font-extrabold text-primary-container tracking-tight">
            Skill Gap Report / {dummyUser.targetRole}
          </h1>
          <p className="text-on-surface-variant">
            {isLoggedIn ? (
              <>Welcome back, <span className="text-secondary font-bold">{dummyUser.name}</span></>
            ) : (
              <>Viewing as Guest. <span className="text-secondary font-bold">Sign up</span> to save your progress.</>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          {!isLoggedIn && (
            <>
              <button onClick={() => router.push("/login")} className="px-6 py-3 rounded-xl border border-primary text-primary hover:bg-primary/10 transition-all text-sm font-bold flex items-center gap-2">
                Log In
              </button>
              <button onClick={() => router.push("/signup")} className="px-6 py-3 rounded-xl bg-primary text-white hover:bg-primary/90 transition-all text-sm font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                Sign Up
              </button>
            </>
          )}
          <button onClick={() => router.push("/student-verification")} className="px-6 py-3 rounded-xl border border-outline-variant hover:bg-surface-container-high transition-all text-sm font-semibold flex items-center gap-2 hidden md:flex">
            <span className="material-symbols-outlined text-sm">refresh</span>
            New Verification
          </button>
          <button onClick={() => router.push("/roadmap")} className="px-8 py-3 rounded-xl pulse-gradient text-white font-bold text-sm shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:scale-105 transition-all flex items-center gap-2">
            Roadmap
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Readiness Gauge */}
          <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 faint-grid opacity-10" />
            <h3 className="text-violet-400 font-bold text-lg mb-8 uppercase tracking-widest text-center">Ready For Hire</h3>
            <div className="relative w-56 h-56 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full gauge-gradient opacity-20" />
              <div className="absolute inset-4 rounded-full bg-surface-container-low z-10" />
              <svg className="w-full h-full -rotate-90 z-20" viewBox="0 0 100 100">
                <circle className="text-surface-container-highest" cx="50" cy="50" r="44" fill="transparent" stroke="currentColor" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r="44" fill="transparent"
                  stroke="url(#gaugeGrad)"
                  strokeWidth="8"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 0.5s ease" }}
                />
                <defs>
                  <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#7c3aed" />
                    <stop offset="50%" stopColor="#5de6ff" />
                    <stop offset="100%" stopColor="#34d399" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute z-30 flex flex-col items-center">
                <span className="text-5xl font-extrabold text-on-surface tracking-tighter font-mono">{animatedScore}%</span>
                <span className="text-success text-xs font-bold uppercase">Good Match</span>
              </div>
            </div>
            <div className="mt-8 text-center text-on-surface-variant text-sm px-4">
              Based on <span className="text-secondary font-bold">128 industry benchmarks</span> for Senior Software roles.
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Skills Matched" value={String(matchedCount)} color="success" icon="check_circle" />
            <StatCard label="Critical Gaps" value={String(criticalCount)} suffix="Urgent" color="critical" icon="warning" />
            <StatCard label="Training Hours" value={isDynamic ? "35" : "38"} suffix="Est." color="primary-fixed-dim" icon="schedule" />
            <StatCard label="AI Confidence" value={isDynamic ? "92%" : "94%"} color="secondary" icon="psychology" />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Skills You Have */}
          <div className="bg-surface-container rounded-xl p-6">
            <h4 className="text-violet-400 font-bold text-sm mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">check_circle</span>
              Skills You Have
            </h4>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {existingSkills.map((skill: any, i: number) => (
                <motion.div
                  key={`${skill.name}-${i}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={mounted ? { opacity: 1, x: 0 } : {}}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-1"
                >
                  <div className="flex justify-between text-sm">
                    <span className="text-on-surface font-medium">{skill.name}</span>
                    <span className="text-secondary font-bold font-mono">{skill.level}%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-primary-container to-secondary rounded-full"
                      initial={{ width: 0 }}
                      animate={mounted ? { width: `${skill.level}%` } : {}}
                      transition={{ duration: 0.8, delay: i * 0.1 }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Skills You Need */}
          <div className="bg-surface-container rounded-xl p-6">
            <h4 className="text-violet-400 font-bold text-sm mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">trending_up</span>
              Skills You Need
            </h4>
            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {skillGaps.map((gap: any, i: number) => {
                const p = priorityColors[gap.priority];
                return (
                  <motion.div
                    key={`${gap.name}-${i}`}
                    initial={{ opacity: 0, x: 20 }}
                    animate={mounted ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: i * 0.08 }}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-on-surface font-medium text-sm">{gap.name}</span>
                      <span className={`${p.bg} ${p.text} text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider`}>
                        {p.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                        <div
                          className="h-full bg-secondary rounded-full"
                          style={{ width: `${gap.currentLevel}%` }}
                        />
                      </div>
                      <span className="text-on-surface-variant text-xs font-mono w-12 text-right">
                        {gap.currentLevel}/{gap.requiredLevel}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Radar Chart */}
            <div className="bg-surface-container rounded-xl p-6">
              <h4 className="text-violet-400 font-bold text-sm mb-4 uppercase tracking-widest">Competency Radar</h4>
              <div style={{ position: "relative", height: "280px", width: "100%" }}>
                {mounted && <Radar data={radarData} options={radarOptions} />}
              </div>
              <div className="mt-4 flex gap-6 text-[10px] font-bold uppercase justify-center">
                <div className="flex items-center gap-2 text-secondary"><div className="w-2 h-2 bg-secondary rounded-full" /> Current</div>
                <div className="flex items-center gap-2 text-primary-container"><div className="w-2 h-2 bg-primary-container rounded-full" /> Required</div>
              </div>
            </div>

            {/* Skill Coverage Doughnut */}
            <div className="bg-surface-container rounded-xl p-6">
              <h4 className="text-violet-400 font-bold text-sm mb-4 uppercase tracking-widest">Skill Coverage</h4>
              <div style={{ position: "relative", height: "280px", width: "100%" }} className="flex items-center justify-center">
                {mounted && <Doughnut data={coverageData} options={coverageOptions} />}
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-on-surface font-mono">{isDynamic ? "81%" : "74%"}</span>
                  <span className="text-on-surface-variant text-xs">Coverage</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 justify-center text-[10px] font-bold uppercase">
                <div className="flex items-center gap-1 text-success"><div className="w-2 h-2 bg-success rounded-full" /> Matched</div>
                <div className="flex items-center gap-1 text-critical"><div className="w-2 h-2 bg-critical rounded-full" /> Critical</div>
                <div className="flex items-center gap-1 text-tertiary"><div className="w-2 h-2 bg-tertiary rounded-full" /> Partial</div>
                <div className="flex items-center gap-1 text-secondary"><div className="w-2 h-2 bg-secondary rounded-full" /> Optional</div>
              </div>
            </div>
          </div>

          {/* Gap Severity Bar Chart */}
          <div className="bg-surface-container rounded-xl p-6">
            <h4 className="text-violet-400 font-bold text-sm mb-4 uppercase tracking-widest">Gap Severity — Your Level vs Required</h4>
            <div style={{ position: "relative", height: "300px", width: "100%" }}>
              {mounted && <Bar data={gapBarData} options={gapBarOptions} />}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Training Hours Doughnut */}
            <div className="bg-surface-container rounded-xl p-6">
              <h4 className="text-violet-400 font-bold text-sm mb-4 uppercase tracking-widest">Training Hours by Category</h4>
              <div style={{ position: "relative", height: "250px", width: "100%" }}>
                {mounted && <Doughnut data={hoursData} options={hoursOptions} />}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-surface-container rounded-xl p-6">
              <h4 className="text-violet-400 font-bold text-sm mb-4 uppercase tracking-widest">Priority Distribution</h4>
              <div style={{ position: "relative", height: "250px", width: "100%" }}>
                {mounted && <Bar data={priorityBarData} options={priorityBarOptions} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-16 flex justify-between items-center text-on-surface-variant font-medium pt-8 border-t border-surface-container">
        <button onClick={() => router.push("/student-verification")} className="flex items-center gap-2 hover:text-primary transition-colors">
          <span className="material-symbols-outlined">west</span>
          Previous: Student Verification
        </button>
        <button onClick={() => router.push("/roadmap")} className="flex items-center gap-2 hover:text-primary transition-colors">
          Next: Learning Roadmap
          <span className="material-symbols-outlined">east</span>
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({ label, value, suffix, color, icon }: { label: string; value: string; suffix?: string; color: string; icon: string }) {
  return (
    <div className={`bg-surface-container p-5 rounded-xl border-b-2 border-${color}/30`}>
      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className={`text-2xl font-bold text-${color} font-mono`}>
          {value} {suffix && <span className="text-xs uppercase">{suffix}</span>}
        </h4>
        <span className={`material-symbols-outlined text-${color} opacity-50`}>{icon}</span>
      </div>
    </div>
  );
}
