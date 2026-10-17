"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
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
  RadialLinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
  ArcElement,
  CategoryScale,
  LinearScale,
  BarElement
);

interface SkillGapItem {
  name: string;
  currentLevel: number;
  requiredLevel: number;
  priority: "critical" | "medium" | "low";
  reason?: string;
  nextStep?: string;
}

const priorityColors: Record<string, { bg: string; text: string; label: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", label: "Critical" },
  medium: { bg: "bg-amber-500/10", text: "text-amber-400", label: "Medium" },
  low: { bg: "bg-emerald-400/10", text: "text-emerald-400", label: "Optional" },
};

export default function DashboardPage() {
  const router = useRouter();
  const { studentAnalysis, studentVerification, userProfile, isLoggedIn, setStudentAnalysis } = useApp();
  const [mounted, setMounted] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  // Check if real student data exists
  const hasData = Boolean(
    studentAnalysis ||
      (studentVerification && studentVerification.ratings && Object.keys(studentVerification.ratings).length > 0)
  );

  // Field of interest / specialization
  const targetField =
    studentAnalysis?.interpretedField ||
    studentAnalysis?.fieldOfInterest ||
    studentVerification?.interpretedField ||
    studentVerification?.fieldOfInterest ||
    "Selected Field of Study";

  const studentName =
    userProfile?.name ||
    studentAnalysis?.marksheet?.studentName ||
    (isLoggedIn ? "Student Scholar" : "Guest Student");

  const pursuitHierarchy =
    studentAnalysis?.pursuitPath?.length
      ? studentAnalysis.pursuitPath.join(" › ")
      : studentVerification?.path?.length
      ? studentVerification.path.join(" › ")
      : "Verified Pursuit";

  // Derive all rated skills from user input
  const allRatings: Array<{ skill: string; rating: number }> = useMemo(() => {
    if (studentAnalysis?.ratings && Array.isArray(studentAnalysis.ratings)) {
      return studentAnalysis.ratings;
    }
    if (studentVerification?.ratings) {
      return Object.entries(studentVerification.ratings).map(([skill, r]) => ({
        skill,
        rating: Number(r),
      }));
    }
    return [];
  }, [studentAnalysis, studentVerification]);

  // Existing skills (Mastered / Proficient: rating >= 7)
  const existingSkills = useMemo(() => {
    return allRatings
      .filter((s) => s.rating >= 7)
      .map((s) => ({
        name: s.skill,
        level: Math.round((s.rating / 10) * 100),
      }));
  }, [allRatings]);

  // Skills needed / gaps (rating < 7 or from studentAnalysis.gaps)
  const skillGaps: SkillGapItem[] = useMemo(() => {
    if (studentAnalysis?.gaps && Array.isArray(studentAnalysis.gaps) && studentAnalysis.gaps.length > 0) {
      return studentAnalysis.gaps.map((g: any) => ({
        name: g.skill,
        currentLevel: Math.round((g.rating || 3) * 10),
        requiredLevel: g.priority === "critical" ? 85 : g.priority === "medium" ? 80 : 75,
        priority: (["critical", "medium", "low"].includes(g.priority) ? g.priority : "medium") as
          | "critical"
          | "medium"
          | "low",
        reason: g.reason,
        nextStep: g.nextStep,
      }));
    }

    return allRatings
      .filter((s) => s.rating < 7)
      .map((s) => {
        const priority = (s.rating <= 3 ? "critical" : s.rating <= 5 ? "medium" : "low") as
          | "critical"
          | "medium"
          | "low";
        return {
          name: s.skill,
          currentLevel: Math.round(s.rating * 10),
          requiredLevel: priority === "critical" ? 85 : 80,
          priority,
          reason: `Self-assessed level is ${s.rating}/10. Needs focused development for ${targetField}.`,
          nextStep: "Complete structured learning module and applied practice.",
        };
      });
  }, [studentAnalysis, allRatings, targetField]);

  // Calculate dynamic readiness score
  const avgRating = useMemo(() => {
    if (typeof studentAnalysis?.averageRating === "number") return studentAnalysis.averageRating;
    if (allRatings.length > 0) {
      const sum = allRatings.reduce((acc, cur) => acc + cur.rating, 0);
      return Math.round((sum / allRatings.length) * 10) / 10;
    }
    return 7;
  }, [studentAnalysis, allRatings]);

  const marksheetPct = studentAnalysis?.marksheet?.percentage;
  const targetScore = useMemo(() => {
    if (!hasData) return 0;
    if (marksheetPct) {
      return Math.round((avgRating / 10) * 65 + (marksheetPct / 100) * 35);
    }
    return Math.round((avgRating / 10) * 100);
  }, [hasData, avgRating, marksheetPct]);

  useEffect(() => {
    setMounted(true);
    let frame = 0;
    const target = targetScore;
    if (target === 0) {
      setAnimatedScore(0);
      return;
    }
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
  }, [targetScore]);

  const circumference = 2 * Math.PI * 44;
  const offset = circumference - (animatedScore / 100) * circumference;

  // Radar chart: User's actual rated skills (up to 8)
  const radarItems = useMemo(() => {
    if (allRatings.length > 0) {
      return allRatings.slice(0, 8);
    }
    return [];
  }, [allRatings]);

  const radarData = {
    labels: radarItems.map((s) => s.skill),
    datasets: [
      {
        label: "Your Level",
        data: radarItems.map((s) => s.rating * 10),
        backgroundColor: "rgba(93, 230, 255, 0.15)",
        borderColor: "#5DE6FF",
        borderWidth: 2,
        pointBackgroundColor: "#5DE6FF",
        pointBorderColor: "#5DE6FF",
        pointRadius: 4,
      },
      {
        label: "Target Benchmark",
        data: radarItems.map(() => 85),
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
        pointLabels: { color: "#CCC3D8", font: { size: 10, family: "Manrope" } },
      },
    },
    plugins: { legend: { display: false } },
  };

  // Skill coverage calculation
  const matchedCount = existingSkills.length;
  const criticalCount = skillGaps.filter((g) => g.priority === "critical").length;
  const mediumCount = skillGaps.filter((g) => g.priority === "medium").length;
  const optionalCount = skillGaps.filter((g) => g.priority === "low").length;
  const totalSkillsCount = Math.max(1, allRatings.length);
  const coveragePercentage = Math.round((matchedCount / totalSkillsCount) * 100);

  const coverageData = {
    labels: ["Mastered", "Critical Gaps", "Developing", "Optional"],
    datasets: [
      {
        data: [matchedCount, criticalCount, mediumCount, optionalCount],
        backgroundColor: ["#34D399", "#EF4444", "#FFAFD3", "#5DE6FF"],
        borderWidth: 0,
      },
    ],
  };

  const coverageOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "70%",
    plugins: { legend: { display: false } },
  };

  // Gap Severity Bar Chart: User's actual gap skills
  const gapBarData = {
    labels: skillGaps.map((g) => g.name),
    datasets: [
      {
        label: "Your Level",
        data: skillGaps.map((g) => g.currentLevel),
        backgroundColor: "#5DE6FF",
        borderRadius: 4,
      },
      {
        label: "Required Benchmark",
        data: skillGaps.map((g) => g.requiredLevel),
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
      y: { grid: { display: false }, ticks: { color: "#CCC3D8", font: { size: 10 } } },
    },
    plugins: { legend: { labels: { color: "#CCC3D8", font: { size: 11 } } } },
  };

  // Training hours by phase
  const criticalHours = criticalCount * 6;
  const mediumHours = mediumCount * 4;
  const optionalHours = optionalCount * 2;
  const totalEstimatedHours = criticalHours + mediumHours + optionalHours;

  const hoursData = {
    labels: ["Critical Gaps", "Medium Priority", "Foundational"],
    datasets: [
      {
        data: [criticalHours || 1, mediumHours || 1, optionalHours || 1],
        backgroundColor: ["#EF4444", "#FFAFD3", "#5DE6FF"],
        borderWidth: 0,
      },
    ],
  };

  const hoursOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "60%",
    plugins: {
      legend: { position: "bottom" as const, labels: { color: "#CCC3D8", font: { size: 11 }, padding: 12 } },
    },
  };

  const priorityCounts = { Critical: criticalCount, Medium: mediumCount, Optional: optionalCount };
  const priorityBarData = {
    labels: Object.keys(priorityCounts),
    datasets: [
      {
        label: "Count",
        data: Object.values(priorityCounts),
        backgroundColor: ["#EF4444", "#FFD700", "#34D399"],
        borderRadius: 8,
      },
    ],
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

  // If no user data exists yet, render an empty state prompting them to start verification
  if (!hasData) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-4xl mx-auto px-6 pt-16 pb-32 text-center space-y-6"
      >
        <div className="w-20 h-20 mx-auto rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary shadow-[0_0_30px_rgba(124,58,237,0.2)]">
          <span className="material-symbols-outlined text-4xl">analytics</span>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight">
            No Student Verification Data Found
          </h1>
          <p className="text-on-surface-variant text-sm max-w-lg mx-auto">
            Your skill gap analysis is generated dynamically from your chosen pursuit pathway, field of interest, and self-rated competencies.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-surface-container border border-outline-variant/20 max-w-md mx-auto text-left space-y-3">
          <p className="text-xs font-bold text-on-surface uppercase tracking-wider">Required Steps to Generate Report:</p>
          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">1</span>
            <span>Select what you are pursuing (Higher Secondary, Degree, Stream)</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">2</span>
            <span>Enter your field of interest to get AI-generated domain skills</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-on-surface-variant">
            <span className="w-5 h-5 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-[10px]">3</span>
            <span>Rate your expertise in each domain skill out of 10</span>
          </div>
        </div>

        <div className="pt-2 flex justify-center gap-4">
          <button
            onClick={() => router.push("/")}
            className="px-8 py-3 rounded-xl pulse-gradient text-white font-bold text-sm shadow-[0_0_20px_rgba(124,58,237,0.4)] hover:scale-105 transition-all flex items-center gap-2"
          >
            <span>Start Student Verification</span>
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
        <div className="space-y-2">
          <div
            className="flex items-center gap-2 text-on-surface-variant text-sm cursor-pointer hover:text-primary transition-colors"
            onClick={() => router.push("/")}
          >
            <span className="material-symbols-outlined text-xs">arrow_back</span>
            <span>Back to Student Verification</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight">
            Skill Gap Report / {targetField}
          </h1>
          <p className="text-on-surface-variant text-sm">
            {isLoggedIn ? (
              <>
                Academic Dossier for <span className="text-secondary font-bold">{studentName}</span> •{" "}
                <span className="text-primary">{pursuitHierarchy}</span>
              </>
            ) : (
              <>
                Active Evaluation for <span className="text-secondary font-bold">{studentName}</span> •{" "}
                <span className="text-primary">{pursuitHierarchy}</span>
              </>
            )}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-5 py-2.5 rounded-xl border border-outline-variant hover:bg-surface-container-high transition-all text-xs font-semibold flex items-center gap-2 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">edit_note</span>
            Re-evaluate Skills
          </button>
          <button
            onClick={() => router.push("/roadmap")}
            className="px-6 py-2.5 rounded-xl pulse-gradient text-white font-bold text-xs shadow-[0_0_15px_rgba(124,58,237,0.4)] hover:scale-105 transition-all flex items-center gap-2"
          >
            View My Roadmap
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-12 gap-8">
        {/* Left Column */}
        <div className="col-span-12 lg:col-span-4 flex flex-col gap-8">
          {/* Readiness Gauge */}
          <div className="bg-surface-container-low rounded-xl p-8 flex flex-col items-center justify-center relative overflow-hidden border border-outline-variant/15">
            <div className="absolute inset-0 faint-grid opacity-10" />
            <h3 className="text-violet-400 font-bold text-xs mb-8 uppercase tracking-widest text-center">
              Field Readiness Score
            </h3>
            <div className="relative w-56 h-56 flex items-center justify-center">
              <div className="absolute inset-0 rounded-full gauge-gradient opacity-20" />
              <div className="absolute inset-4 rounded-full bg-surface-container-low z-10" />
              <svg className="w-full h-full -rotate-90 z-20" viewBox="0 0 100 100">
                <circle
                  className="text-surface-container-highest"
                  cx="50"
                  cy="50"
                  r="44"
                  fill="transparent"
                  stroke="currentColor"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="transparent"
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
                <span className="text-5xl font-extrabold text-on-surface tracking-tighter font-mono">
                  {animatedScore}%
                </span>
                <span className="text-success text-xs font-bold uppercase mt-1">
                  {animatedScore >= 80 ? "High Mastery" : animatedScore >= 60 ? "Solid Foundation" : "Growth Path"}
                </span>
              </div>
            </div>
            <div className="mt-8 text-center text-on-surface-variant text-xs px-4">
              Calibrated from your <span className="text-secondary font-bold">{allRatings.length} rated competencies</span>
              {marksheetPct ? ` & ${marksheetPct}% marksheet aggregate` : ""} in {targetField}.
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="Skills Mastered" value={String(matchedCount)} color="success" icon="check_circle" />
            <StatCard label="Critical Gaps" value={String(criticalCount)} suffix="Urgent" color="critical" icon="warning" />
            <StatCard
              label="Bridging Hours"
              value={String(totalEstimatedHours)}
              suffix="Est."
              color="primary-fixed-dim"
              icon="schedule"
            />
            <StatCard
              label="Avg Expertise"
              value={`${avgRating}/10`}
              color="secondary"
              icon="psychology"
            />
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 lg:col-span-8 space-y-8">
          {/* Skills You Have (Mastered Competencies) */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/15">
            <h4 className="text-violet-400 font-bold text-xs mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-emerald-400">check_circle</span>
              Skills You Have ({existingSkills.length} Mastered)
            </h4>
            {existingSkills.length > 0 ? (
              <div className="space-y-4">
                {existingSkills.map((skill, i) => (
                  <motion.div
                    key={skill.name}
                    initial={{ opacity: 0, x: -20 }}
                    animate={mounted ? { opacity: 1, x: 0 } : {}}
                    transition={{ delay: i * 0.08 }}
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
                        transition={{ duration: 0.8, delay: i * 0.08 }}
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic">
                All rated skills currently require development. See prioritized bridging gaps below.
              </p>
            )}
          </div>

          {/* Skills You Need (Gaps) */}
          <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/15">
            <h4 className="text-violet-400 font-bold text-xs mb-6 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-cyan-400">trending_up</span>
              Skills You Need to Bridge ({skillGaps.length} Identified)
            </h4>
            {skillGaps.length > 0 ? (
              <div className="space-y-4">
                {skillGaps.map((gap, i) => {
                  const p = priorityColors[gap.priority];
                  return (
                    <motion.div
                      key={gap.name}
                      initial={{ opacity: 0, x: 20 }}
                      animate={mounted ? { opacity: 1, x: 0 } : {}}
                      transition={{ delay: i * 0.06 }}
                      className="flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <span className="text-on-surface font-medium text-sm">{gap.name}</span>
                        <span
                          className={`${p.bg} ${p.text} text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-wider`}
                        >
                          {p.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-2 bg-surface-container-lowest rounded-full overflow-hidden">
                          <div className="h-full bg-secondary rounded-full" style={{ width: `${gap.currentLevel}%` }} />
                        </div>
                        <span className="text-on-surface-variant text-xs font-mono w-16 text-right">
                          {gap.currentLevel}% / {gap.requiredLevel}%
                        </span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-emerald-400 font-semibold">
                Outstanding! No critical skill gaps detected. You meet all target benchmarks.
              </p>
            )}
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Radar Chart */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/15">
              <h4 className="text-violet-400 font-bold text-xs mb-4 uppercase tracking-widest">
                Domain Competency Radar
              </h4>
              <div style={{ position: "relative", height: "280px", width: "100%" }}>
                {mounted && <Radar data={radarData} options={radarOptions} />}
              </div>
              <div className="mt-4 flex gap-6 text-[10px] font-bold uppercase justify-center">
                <div className="flex items-center gap-2 text-secondary">
                  <div className="w-2 h-2 bg-secondary rounded-full" /> Your Rating
                </div>
                <div className="flex items-center gap-2 text-primary-container">
                  <div className="w-2 h-2 bg-primary-container rounded-full" /> Required Benchmark
                </div>
              </div>
            </div>

            {/* Skill Coverage Doughnut */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/15">
              <h4 className="text-violet-400 font-bold text-xs mb-4 uppercase tracking-widest">
                Competency Distribution
              </h4>
              <div
                style={{ position: "relative", height: "280px", width: "100%" }}
                className="flex items-center justify-center"
              >
                {mounted && <Doughnut data={coverageData} options={coverageOptions} />}
                <div className="absolute flex flex-col items-center">
                  <span className="text-3xl font-extrabold text-on-surface font-mono">{coveragePercentage}%</span>
                  <span className="text-on-surface-variant text-xs">Mastered</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 justify-center text-[10px] font-bold uppercase">
                <div className="flex items-center gap-1 text-success">
                  <div className="w-2 h-2 bg-success rounded-full" /> Mastered ({matchedCount})
                </div>
                <div className="flex items-center gap-1 text-red-400">
                  <div className="w-2 h-2 bg-red-400 rounded-full" /> Critical ({criticalCount})
                </div>
                <div className="flex items-center gap-1 text-tertiary">
                  <div className="w-2 h-2 bg-tertiary rounded-full" /> Developing ({mediumCount})
                </div>
                <div className="flex items-center gap-1 text-secondary">
                  <div className="w-2 h-2 bg-secondary rounded-full" /> Optional ({optionalCount})
                </div>
              </div>
            </div>
          </div>

          {/* Gap Severity Bar Chart */}
          {skillGaps.length > 0 && (
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/15">
              <h4 className="text-violet-400 font-bold text-xs mb-4 uppercase tracking-widest">
                Gap Severity — Your Level vs Benchmark
              </h4>
              <div style={{ position: "relative", height: "300px", width: "100%" }}>
                {mounted && <Bar data={gapBarData} options={gapBarOptions} />}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Training Hours Doughnut */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/15">
              <h4 className="text-violet-400 font-bold text-xs mb-4 uppercase tracking-widest">
                Estimated Bridging Hours
              </h4>
              <div style={{ position: "relative", height: "250px", width: "100%" }}>
                {mounted && <Doughnut data={hoursData} options={hoursOptions} />}
              </div>
            </div>

            {/* Priority Distribution */}
            <div className="bg-surface-container rounded-xl p-6 border border-outline-variant/15">
              <h4 className="text-violet-400 font-bold text-xs mb-4 uppercase tracking-widest">
                Priority Distribution
              </h4>
              <div style={{ position: "relative", height: "250px", width: "100%" }}>
                {mounted && <Bar data={priorityBarData} options={priorityBarOptions} />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="mt-16 flex justify-between items-center text-on-surface-variant font-medium pt-8 border-t border-surface-container">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold"
        >
          <span className="material-symbols-outlined text-sm">west</span>
          Previous: Student Verification
        </button>
        <button
          onClick={() => router.push("/roadmap")}
          className="flex items-center gap-2 hover:text-primary transition-colors text-xs font-bold"
        >
          Next: Learning Roadmap
          <span className="material-symbols-outlined text-sm">east</span>
        </button>
      </div>
    </motion.div>
  );
}

function StatCard({
  label,
  value,
  suffix,
  color,
  icon,
}: {
  label: string;
  value: string;
  suffix?: string;
  color: string;
  icon: string;
}) {
  return (
    <div className={`bg-surface-container p-5 rounded-xl border border-outline-variant/15`}>
      <p className="text-[10px] text-on-surface-variant font-bold uppercase tracking-wider mb-2">{label}</p>
      <div className="flex items-end justify-between">
        <h4 className={`text-2xl font-bold text-${color} font-mono`}>
          {value} {suffix && <span className="text-xs uppercase ml-1">{suffix}</span>}
        </h4>
        <span className={`material-symbols-outlined text-${color} opacity-60 text-xl`}>{icon}</span>
      </div>
    </div>
  );
}
