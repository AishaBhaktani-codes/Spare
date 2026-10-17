"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { useApp } from "@/lib/context";
import { roleOptions } from "@/lib/data";

// Fallback sample data to preview a complete student dossier if user hasn't uploaded yet
const SAMPLE_STUDENT_ANALYSIS = {
  marksheet: {
    filename: "Class_XII_CBSE_Science_Marksheet.pdf",
    studentName: "Aarav Sharma",
    board: "CBSE (Central Board of Secondary Education)",
    examLevel: "Class XII Senior Secondary (Science Stream)",
    percentage: 88.6,
    subjects: [
      { subject: "Mathematics", marksObtained: 94, maxMarks: 100, grade: "A1" },
      { subject: "Computer Science", marksObtained: 96, maxMarks: 100, grade: "A1" },
      { subject: "Physics", marksObtained: 84, maxMarks: 100, grade: "A2" },
      { subject: "Chemistry", marksObtained: 81, maxMarks: 100, grade: "B1" },
      { subject: "English Core", marksObtained: 88, maxMarks: 100, grade: "A2" },
    ],
  },
  pursuitPath: ["Higher Secondary (11th & 12th)", "Science (PCM)", "Engineering / B.Tech", "Computer Science & Engineering"],
  fieldOfInterest: "Full-Stack Web Development & Artificial Intelligence",
  interpretedField: "Full-Stack Web Engineering & Intelligent Systems",
  fieldAnalysis:
    "Grounded in senior secondary STEM foundations with exceptional scores in Mathematics (94%) and Computer Science (96%). High readiness for modern software engineering paradigms and algorithmic problem solving.",
  averageRating: 7.3,
  ratings: [
    { skill: "Data Structures & Algorithms", rating: 8 },
    { skill: "Mathematics & Discrete Logic", rating: 9 },
    { skill: "JavaScript & Modern Web Tech", rating: 7 },
    { skill: "Backend APIs & Database Architecture", rating: 5 },
    { skill: "Git & Version Control", rating: 8 },
    { skill: "System Architecture Basics", rating: 4 },
    { skill: "Object-Oriented Programming", rating: 9 },
    { skill: "Analytical Problem Solving", rating: 9 },
  ],
  strengths: [
    {
      skill: "Object-Oriented Programming & Logic",
      rating: 9,
      reason: "Near-perfect 96% academic record in Computer Science combined with strong conceptual OOP fluency.",
    },
    {
      skill: "Discrete Mathematics & Quantitative Reasoning",
      rating: 9,
      reason: "94% score in Senior Secondary Mathematics indicates outstanding aptitude for complex computational logic.",
    },
    {
      skill: "Git & Version Control Workflows",
      rating: 8,
      reason: "Solid practical mastery in commit hygiene, branch management, and collaborative development.",
    },
  ],
  gaps: [
    {
      skill: "Backend APIs & Database Architecture",
      rating: 5,
      priority: "critical" as const,
      reason: "Essential for full-stack engineering; requires hands-on experience building relational schemas and REST/GraphQL microservices.",
      nextStep: "Complete hands-on Node.js/PostgreSQL REST API module with CRUD operations and authentication.",
      resourceUrl: "https://www.youtube.com/results?search_query=node+js+express+postgresql+rest+api+tutorial",
    },
    {
      skill: "System Architecture Basics",
      rating: 4,
      priority: "critical" as const,
      reason: "Vital for designing scalable client-server topologies, caching layers, and load distribution.",
      nextStep: "Study client-server caching, CDN distribution, and database index fundamentals.",
      resourceUrl: "https://www.youtube.com/results?search_query=system+design+basics+for+beginners",
    },
    {
      skill: "JavaScript & Modern Web Frameworks",
      rating: 7,
      priority: "medium" as const,
      reason: "Proficient syntax grasp but needs advanced state management, asynchronous concurrency, and Next.js familiarity.",
      nextStep: "Build 2 end-to-end full stack web applications with modern state and API integrations.",
      resourceUrl: "https://www.youtube.com/results?search_query=full+stack+nextjs+react+tutorial",
    },
  ],
  marksheetInsights: [
    "Distinction-grade performance in quantitative subjects (94% Math, 96% CS) demonstrates rapid potential for software engineering.",
    "Strong technical aptitude indicates ready eligibility for competitive engineering & computer science pathways.",
    "Targeted practical upskilling in distributed backend architectures will bridge academic theory to production-grade engineering.",
  ],
  summary:
    "Student exhibits stellar academic foundations in computing and mathematics with an 88.6% aggregate. The primary growth opportunity lies in transitioning theoretical proficiency into real-world production systems and database design.",
  recommendedNextSteps: [
    "Complete Phase 1 backend API engineering modules on the learning roadmap.",
    "Deploy a functional full-stack project demonstrating relational database integration.",
    "Review system architecture concepts such as load balancing and caching.",
  ],
};

export default function ProfilePage() {
  const router = useRouter();
  const {
    isLoggedIn,
    logout,
    selectedRole,
    setSelectedRole,
    userProfile,
    studentAnalysis: liveStudentAnalysis,
    studentVerification,
    setStudentAnalysis,
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showSample, setShowSample] = useState(false);
  const [activeTab, setActiveTab] = useState<"dossier" | "marksheet" | "skills" | "gaps">("dossier");

  // Determine current effective student data
  const studentAnalysis = useMemo(() => {
    if (liveStudentAnalysis) return liveStudentAnalysis;
    if (showSample) return SAMPLE_STUDENT_ANALYSIS;
    return null;
  }, [liveStudentAnalysis, showSample]);

  // Determine student name from marksheet or userProfile or default
  const studentName =
    userProfile?.name ||
    studentAnalysis?.marksheet?.studentName ||
    (studentVerification ? "Student Scholar" : "Student Candidate");

  const [formData, setFormData] = useState({
    name: studentName,
    institution: "Delhi Public School / Apex Engineering Institute",
    targetRole: selectedRole || "Software Engineer",
    fieldOfInterest: studentAnalysis?.fieldOfInterest || studentVerification?.fieldOfInterest || "Computer Science & Engineering",
    email: userProfile?.email || "student@gapgraph.io",
    phone: "+91 98765 43210",
  });

  useEffect(() => {
    if (studentAnalysis?.marksheet?.studentName && !userProfile?.name) {
      setFormData((prev) => ({ ...prev, name: studentAnalysis.marksheet.studentName || prev.name }));
    }
  }, [studentAnalysis, userProfile]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedRole(formData.targetRole);
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setProfileImage(url);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Helper to load sample student data for review
  const handleLoadSample = () => {
    setShowSample(true);
    setStudentAnalysis(SAMPLE_STUDENT_ANALYSIS);
  };

  // Group rated skills if available from studentAnalysis or studentVerification
  const ratedSkillsList = useMemo(() => {
    if (studentAnalysis?.ratings) {
      return studentAnalysis.ratings;
    }
    if (studentVerification?.ratings) {
      return Object.entries(studentVerification.ratings).map(([skill, rating]) => ({
        skill,
        rating: Number(rating),
      }));
    }
    return [];
  }, [studentAnalysis, studentVerification]);

  // Calculate average rating
  const avgRating = useMemo(() => {
    if (studentAnalysis?.averageRating) return studentAnalysis.averageRating;
    if (ratedSkillsList.length > 0) {
      const total = ratedSkillsList.reduce((acc: number, cur: any) => acc + (cur.rating || 0), 0);
      return Math.round((total / ratedSkillsList.length) * 10) / 10;
    }
    return null;
  }, [studentAnalysis, ratedSkillsList]);

  // Pursuit path representation
  const pursuitStages = useMemo(() => {
    if (studentAnalysis?.pursuitPath?.length) return studentAnalysis.pursuitPath;
    if (studentVerification?.path?.length) return studentVerification.path;
    return [];
  }, [studentAnalysis, studentVerification]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-32 space-y-8"
    >
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Verified Academic Dossier • Active on Device
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-primary-container tracking-tight">
            Student Intelligence Profile
          </h1>
          <p className="text-on-surface-variant text-sm mt-1">
            Verified academic performance records, Groq AI discipline analysis, and competency diagnostics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2.5 rounded-xl border border-outline-variant/40 hover:bg-surface-container-high transition-all text-xs font-semibold flex items-center gap-2 text-on-surface"
          >
            <span className="material-symbols-outlined text-sm">school</span>
            Update Verification
          </button>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2.5 bg-error-container/10 text-error rounded-xl hover:bg-error-container/30 transition-colors text-xs font-bold"
            >
              <span className="material-symbols-outlined text-sm">logout</span>
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="px-4 py-2.5 rounded-xl pulse-gradient text-white text-xs font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">login</span>
              Sign In to Cloud Sync
            </Link>
          )}
        </div>
      </div>

      {/* Main Grid: Student Identity & Top Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Student Dossier Identity Card */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 relative overflow-hidden text-center flex flex-col items-center border border-outline-variant/20 shadow-lg">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-br from-primary-container/40 via-secondary/20 to-transparent" />
            <div
              className={`w-24 h-24 rounded-full bg-surface-container-highest border-4 border-surface-container z-10 flex items-center justify-center text-3xl font-extrabold text-primary-container shadow-xl mt-6 relative overflow-hidden group ${
                isEditing ? "cursor-pointer" : ""
              }`}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                formData.name
                  .split(" ")
                  .map((n: string) => n[0])
                  .slice(0, 2)
                  .join("")
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                </div>
              )}
            </div>

            <h2 className="text-xl font-bold text-on-surface mt-4 relative z-10">{formData.name}</h2>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary/10 border border-secondary/20 text-secondary text-xs font-semibold mt-1 relative z-10">
              <span className="material-symbols-outlined text-xs">verified</span>
              {formData.targetRole}
            </div>
            <p className="text-on-surface-variant text-xs mt-2 relative z-10 line-clamp-1">{formData.institution}</p>

            <div className="w-full mt-6 pt-5 border-t border-outline-variant/15 flex flex-col gap-2.5 text-left text-xs">
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary">mail</span>
                  Email
                </span>
                <span className="text-on-surface font-medium truncate max-w-[150px]">{formData.email}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-primary">call</span>
                  Contact
                </span>
                <span className="text-on-surface font-medium">{formData.phone}</span>
              </div>
              <div className="flex justify-between items-center text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-xs text-emerald-400">cloud_done</span>
                  Device Storage
                </span>
                <span className="text-emerald-400 font-bold">Synchronized</span>
              </div>
            </div>

            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mt-6 w-full py-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high text-on-surface font-bold text-xs transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">{isEditing ? "close" : "edit"}</span>
              {isEditing ? "Cancel Edit" : "Edit Personal Info"}
            </button>
          </div>

          {/* Quick Marksheet Info Card */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 space-y-4">
            <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">assignment</span>
              Verified Marksheet File
            </h3>

            {studentAnalysis?.marksheet?.filename || studentVerification?.savedMarksheetName ? (
              <div className="p-3.5 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-emerald-400 text-2xl mt-0.5">description</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-on-surface truncate">
                      {studentAnalysis?.marksheet?.filename || studentVerification?.savedMarksheetName}
                    </p>
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">
                      Authenticated Document
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-outline-variant/10 text-xs space-y-1 text-on-surface-variant">
                  <div className="flex justify-between">
                    <span>Board:</span>
                    <span className="font-semibold text-on-surface">
                      {studentAnalysis?.marksheet?.board || "Recognized Board"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Aggregate Score:</span>
                    <span className="font-bold text-secondary">
                      {studentAnalysis?.marksheet?.percentage ? `${studentAnalysis.marksheet.percentage}%` : "Evaluated"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-container-low border border-dashed border-outline-variant/30 text-center space-y-2">
                <span className="material-symbols-outlined text-on-surface-variant text-2xl">upload_file</span>
                <p className="text-xs text-on-surface-variant">No marksheet file uploaded yet.</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-xs font-bold"
                >
                  Upload Marksheet
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Personal Edit Form OR Overview */}
        <div className="lg:col-span-8 space-y-6">
          {isEditing ? (
            <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/20 shadow-lg">
              <h3 className="text-lg font-bold text-on-surface mb-6 flex items-center gap-2">
                <span className="material-symbols-outlined text-primary">edit_note</span>
                Edit Student Information
              </h3>
              <form onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary-container"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Email Address</label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary-container"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Institution / School</label>
                    <input
                      type="text"
                      value={formData.institution}
                      onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary-container"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-on-surface-variant uppercase">Phone Number</label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary-container"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-on-surface-variant uppercase">Target Career Role</label>
                  <select
                    value={formData.targetRole}
                    onChange={(e) => setFormData({ ...formData, targetRole: e.target.value })}
                    className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-2.5 text-sm text-on-surface focus:border-primary-container"
                  >
                    {roleOptions.map((role) => (
                      <option key={role} value={role}>
                        {role}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/10">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="px-5 py-2 rounded-xl border border-outline-variant text-on-surface-variant text-xs font-bold hover:bg-surface-container-high"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all flex items-center gap-1.5"
                  >
                    <span className="material-symbols-outlined text-sm">check</span>
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Key Metric Highlights Card */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Marksheet Aggregate
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-secondary font-mono">
                  {studentAnalysis?.marksheet?.percentage ?? "--"}
                </span>
                <span className="text-sm font-bold text-secondary">%</span>
              </div>
              <span className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                <span className="material-symbols-outlined text-xs">verified</span> Verified Score
              </span>
            </div>

            <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Expertise Rating
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-cyan-400 font-mono">
                  {avgRating !== null ? avgRating : "--"}
                </span>
                <span className="text-sm font-bold text-cyan-400">/10</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1">
                {ratedSkillsList.length} skills evaluated
              </span>
            </div>

            <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Key Strengths
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-emerald-400 font-mono">
                  {studentAnalysis?.strengths?.length ?? (ratedSkillsList.filter((s: any) => s.rating >= 7).length || "--")}
                </span>
                <span className="text-xs font-semibold text-emerald-400">Mastered</span>
              </div>
              <span className="text-[11px] text-on-surface-variant mt-1">Rating ≥ 7 / 10</span>
            </div>

            <div className="bg-surface-container p-5 rounded-2xl border border-outline-variant/20 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-on-surface-variant uppercase tracking-wider">
                Critical Bridging Gaps
              </span>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-red-400 font-mono">
                  {studentAnalysis?.gaps?.filter((g: any) => g.priority === "critical").length ??
                    (ratedSkillsList.filter((s: any) => s.rating < 6).length || "--")}
                </span>
                <span className="text-xs font-semibold text-red-400">Urgent</span>
              </div>
              <span className="text-[11px] text-red-400/90 mt-1">Priority focus</span>
            </div>
          </div>

          {/* Pursuit Pathway & Verified Discipline */}
          <div className="bg-surface-container rounded-2xl p-6 border border-outline-variant/20 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-violet-400 uppercase tracking-widest flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">route</span>
                Pursuing Pathway & Discipline
              </h3>
              <span className="text-[10px] uppercase font-bold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full border border-cyan-400/20">
                Groq AI Verified
              </span>
            </div>

            {pursuitStages.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {pursuitStages.map((stage: string, idx: number) => (
                    <div key={idx} className="flex items-center gap-2">
                      {idx > 0 && (
                        <span className="material-symbols-outlined text-xs text-outline-variant">chevron_right</span>
                      )}
                      <span className="px-3 py-1.5 rounded-xl bg-surface-container-low border border-primary/20 text-xs font-bold text-primary flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {stage}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-on-surface uppercase">Specialization Discipline:</span>
                    <span className="text-sm font-extrabold text-secondary">
                      {studentAnalysis?.interpretedField || studentAnalysis?.fieldOfInterest || studentVerification?.interpretedField || studentVerification?.fieldOfInterest || "Computer Science"}
                    </span>
                  </div>
                  {(studentAnalysis?.fieldAnalysis || studentVerification?.fieldAnalysis) && (
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      {studentAnalysis?.fieldAnalysis || studentVerification?.fieldAnalysis}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-surface-container-low text-center space-y-2">
                <p className="text-xs text-on-surface-variant">No pursuit pathway recorded on this device yet.</p>
                <button
                  onClick={() => router.push("/")}
                  className="px-4 py-1.5 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all inline-block"
                >
                  Start Verification
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs for Detailed Student Sections */}
      <div className="flex border-b border-outline-variant/20 gap-2 sm:gap-4 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab("dossier")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "dossier"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-sm">dashboard</span>
          Academic Performance & Marksheet
        </button>
        <button
          onClick={() => setActiveTab("skills")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "skills"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-sm">bar_chart</span>
          Skills Diagnostic ({ratedSkillsList.length})
        </button>
        <button
          onClick={() => setActiveTab("gaps")}
          className={`px-4 py-2 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
            activeTab === "gaps"
              ? "border-cyan-400 text-cyan-400"
              : "border-transparent text-on-surface-variant hover:text-on-surface"
          }`}
        >
          <span className="material-symbols-outlined text-sm">trending_up</span>
          Strengths & Critical Improvements
        </button>
      </div>

      {/* Tab 1: Academic Marksheet Evaluation Details */}
      {activeTab === "dossier" && (
        <div className="space-y-6">
          {studentAnalysis?.marksheet?.subjects?.length ? (
            <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/20 shadow-lg space-y-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-4">
                <div>
                  <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-secondary">verified</span>
                    Official Marksheet Performance Records
                  </h3>
                  <p className="text-xs text-on-surface-variant mt-0.5">
                    Evaluated for: {studentAnalysis.marksheet.board || "Academic Board"} • Level:{" "}
                    {studentAnalysis.marksheet.examLevel || "Senior Secondary Examination"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-[10px] uppercase font-bold text-on-surface-variant">Cumulative Aggregate</p>
                    <p className="text-2xl font-black text-secondary font-mono">
                      {studentAnalysis.marksheet.percentage}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Evaluated Subjects Table */}
              <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-container-high text-on-surface-variant font-bold uppercase tracking-wider text-[10px] border-b border-outline-variant/20">
                    <tr>
                      <th className="py-3 px-4">Subject</th>
                      <th className="py-3 px-4 text-center">Marks Obtained</th>
                      <th className="py-3 px-4 text-center">Maximum Marks</th>
                      <th className="py-3 px-4">Performance Score</th>
                      <th className="py-3 px-4 text-center">Grade / Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-outline-variant/10">
                    {studentAnalysis.marksheet.subjects.map((sub: any, i: number) => {
                      const pct =
                        sub.marksObtained && sub.maxMarks
                          ? Math.round((sub.marksObtained / sub.maxMarks) * 100)
                          : null;
                      return (
                        <tr key={i} className="hover:bg-surface-container-high/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-on-surface flex items-center gap-2">
                            <span className="material-symbols-outlined text-xs text-primary">menu_book</span>
                            {sub.subject}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-sm text-on-surface">
                            {sub.marksObtained ?? "--"}
                          </td>
                          <td className="py-3.5 px-4 text-center font-mono text-on-surface-variant">
                            {sub.maxMarks ?? 100}
                          </td>
                          <td className="py-3.5 px-4 min-w-[140px]">
                            {pct !== null ? (
                              <div className="space-y-1">
                                <div className="flex justify-between text-[10px]">
                                  <span className="font-mono text-secondary font-bold">{pct}%</span>
                                </div>
                                <div className="h-2 w-full bg-surface-container-lowest rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      pct >= 85 ? "bg-emerald-400" : pct >= 70 ? "bg-cyan-400" : "bg-amber-400"
                                    }`}
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-on-surface-variant">Evaluated</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold uppercase ${
                                sub.grade?.startsWith("A")
                                  ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                                  : sub.grade?.startsWith("B")
                                  ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                                  : "bg-surface-container-highest text-on-surface"
                              }`}
                            >
                              {sub.grade || "PASSED"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Marksheet AI Insights */}
              {studentAnalysis.marksheetInsights?.length > 0 && (
                <div className="p-5 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-3">
                  <h4 className="text-xs font-bold text-on-surface uppercase tracking-wider flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-secondary">psychology</span>
                    Academic Rationale & Intelligence Insights
                  </h4>
                  <ul className="space-y-2 text-xs text-on-surface-variant">
                    {studentAnalysis.marksheetInsights.map((insight: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-2.5">
                        <span className="material-symbols-outlined text-xs text-emerald-400 mt-0.5">check_circle</span>
                        <span className="leading-relaxed">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-surface-container rounded-2xl p-8 border border-outline-variant/20 text-center space-y-4">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">assignment_late</span>
              <div>
                <h3 className="text-base font-bold text-on-surface">No Marksheet Evaluated Yet</h3>
                <p className="text-xs text-on-surface-variant max-w-md mx-auto mt-1">
                  Upload your Class 10/12/Diploma or College marksheet PDF during verification to unlock detailed subject-wise breakdown, aggregate scores, and AI insights.
                </p>
              </div>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => router.push("/")}
                  className="px-5 py-2.5 rounded-xl pulse-gradient text-white text-xs font-bold hover:scale-105 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]"
                >
                  Upload Marksheet Now
                </button>
                {!showSample && (
                  <button
                    onClick={handleLoadSample}
                    className="px-5 py-2.5 rounded-xl border border-outline-variant/30 hover:bg-surface-container-high text-xs font-bold text-on-surface transition-all"
                  >
                    View Sample Student Dossier
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: All Rated Skills Diagnostic */}
      {activeTab === "skills" && (
        <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/20 shadow-lg space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-outline-variant/15 pb-4">
            <div>
              <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                <span className="material-symbols-outlined text-cyan-400">bar_chart</span>
                Domain Competency & Expertise Diagnostic
              </h3>
              <p className="text-xs text-on-surface-variant mt-0.5">
                Every skill evaluated specifically for your pursuit and field of interest, rated out of 10.
              </p>
            </div>
            {avgRating !== null && (
              <div className="px-3.5 py-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 text-xs font-bold">
                Overall Average: {avgRating} / 10
              </div>
            )}
          </div>

          {ratedSkillsList.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ratedSkillsList.map((item: any, i: number) => {
                const rating = item.rating;
                const isMastered = rating >= 8;
                const isProficient = rating >= 6 && rating < 8;
                const isDeveloping = rating < 6;

                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-2 hover:border-outline-variant/40 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm text-on-surface">{item.skill}</span>
                      <span
                        className={`font-mono text-sm font-extrabold px-2 py-0.5 rounded-md ${
                          isMastered
                            ? "bg-emerald-400/10 text-emerald-400 border border-emerald-400/20"
                            : isProficient
                            ? "bg-cyan-400/10 text-cyan-400 border border-cyan-400/20"
                            : "bg-red-500/10 text-red-400 border border-red-500/20"
                        }`}
                      >
                        {rating} / 10
                      </span>
                    </div>

                    {/* 10-bar visual rating meter */}
                    <div className="flex items-center gap-1 pt-1">
                      {Array.from({ length: 10 }).map((_, barIdx) => (
                        <div
                          key={barIdx}
                          className={`h-2 flex-1 rounded-sm transition-all ${
                            barIdx < rating
                              ? isMastered
                                ? "bg-emerald-400"
                                : isProficient
                                ? "bg-cyan-400"
                                : "bg-red-400"
                              : "bg-surface-container-highest opacity-40"
                          }`}
                        />
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-on-surface-variant pt-1">
                      <span className="uppercase font-semibold">
                        {isMastered ? "Mastery Level" : isProficient ? "Proficient" : "Growth Area"}
                      </span>
                      <span>{Math.round((rating / 10) * 100)}% Proficiency</span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-surface-container-low border border-dashed border-outline-variant/30 space-y-3">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">tune</span>
              <p className="text-xs text-on-surface-variant">No skills rated yet on this device.</p>
              <button
                onClick={() => router.push("/")}
                className="px-5 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all inline-block"
              >
                Rate Your Skills in Verification
              </button>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Strengths & Critical Improvements */}
      {activeTab === "gaps" && (
        <div className="space-y-6">
          {/* Strengths Grid */}
          <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/20 shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-emerald-400">workspace_premium</span>
              Identified Core Strengths
            </h3>
            <p className="text-xs text-on-surface-variant">
              Competencies where you demonstrated top-tier capability, supported by marksheet scores and verified expertise.
            </p>

            {studentAnalysis?.strengths?.length ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {studentAnalysis.strengths.map((str: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-surface-container-low border border-emerald-400/20 space-y-2 relative overflow-hidden"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-on-surface">{str.skill}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-400 font-mono text-xs font-extrabold border border-emerald-400/20">
                        {str.rating}/10
                      </span>
                    </div>
                    <p className="text-xs text-on-surface-variant leading-relaxed">{str.reason}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-4">
                Run complete verification with marksheet to generate detailed strength mapping.
              </p>
            )}
          </div>

          {/* Critical Gaps & Next Steps */}
          <div className="bg-surface-container rounded-2xl p-6 sm:p-8 border border-outline-variant/20 shadow-lg space-y-4">
            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-red-400">warning</span>
              Targeted Skill Bridging Roadmap
            </h3>
            <p className="text-xs text-on-surface-variant">
              Specific knowledge gaps identified between your current level and industry requirements for your field.
            </p>

            {studentAnalysis?.gaps?.length ? (
              <div className="space-y-3 pt-2">
                {studentAnalysis.gaps.map((gap: any, i: number) => (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-on-surface">{gap.skill}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                            gap.priority === "critical"
                              ? "bg-red-500/15 text-red-400 border border-red-500/30"
                              : "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {gap.priority}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-on-surface-variant">
                        Current Level: {gap.rating} / 10
                      </span>
                    </div>

                    <p className="text-xs text-on-surface-variant leading-relaxed">{gap.reason}</p>

                    <div className="pt-2 border-t border-outline-variant/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="text-xs text-cyan-400 font-semibold flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-xs">arrow_forward</span>
                        {gap.nextStep}
                      </div>
                      {gap.resourceUrl && (
                        <a
                          href={gap.resourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 rounded-lg bg-surface-container-high hover:bg-surface-container-highest border border-outline-variant/30 text-primary text-xs font-bold flex items-center gap-1.5 transition-colors whitespace-nowrap"
                        >
                          <span className="material-symbols-outlined text-xs">smart_display</span>
                          Start Learning
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-on-surface-variant italic py-4">
                Run complete verification to view targeted improvements.
              </p>
            )}

            {/* Recommended Next Steps */}
            {studentAnalysis?.recommendedNextSteps?.length > 0 && (
              <div className="mt-6 p-5 rounded-xl bg-surface-container-low border border-outline-variant/15 space-y-3">
                <h4 className="text-xs font-bold text-secondary uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">flag</span>
                  Prescribed Actions to Complete
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {studentAnalysis.recommendedNextSteps.map((step: string, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-surface-container border border-outline-variant/10 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-secondary/20 text-secondary text-xs font-bold flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-on-surface font-medium leading-relaxed">{step}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Bottom Action Footer */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-6 border-t border-outline-variant/15 text-xs text-on-surface-variant">
        <span>Student Dossier • ID: STU-{Math.abs(formData.name.split("").reduce((a: number, b: string) => a + b.charCodeAt(0), 1000))}</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/roadmap")}
            className="px-5 py-2.5 rounded-xl pulse-gradient text-white font-bold text-xs hover:scale-105 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)] flex items-center gap-2"
          >
            <span>Launch Learning Roadmap</span>
            <span className="material-symbols-outlined text-sm">arrow_forward</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
