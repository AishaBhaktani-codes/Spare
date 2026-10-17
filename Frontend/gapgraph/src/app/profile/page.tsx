"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/context";
import { user as mockUser, roleOptions } from "@/lib/data";
import { motion } from "framer-motion";
import { useRef } from "react";

export default function ProfilePage() {
  const router = useRouter();
  const { isLoggedIn, logout, selectedRole, setSelectedRole, userProfile, uploadedFiles, analysisResult, studentAnalysis, studentVerification } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: userProfile?.name || mockUser.name,
    company: "GapGraph User",
    role: selectedRole,
    experience: mockUser.experience,
    email: userProfile?.email || "hello@gapgraph.io", 
    phone: "Not provided"
  });

  // Redirect if not logged in
  if (!isLoggedIn) {
     if (typeof window !== "undefined") router.push("/login");
     return null;
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSelectedRole(formData.role);
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto px-6 pt-12 pb-32"
    >
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-4xl font-extrabold text-primary-container tracking-tight">
          Profile Settings
        </h1>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 bg-error-container/10 text-error rounded-xl hover:bg-error-container/30 transition-colors text-sm font-bold"
        >
          <span className="material-symbols-outlined text-sm">logout</span>
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card Summary */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-surface-container rounded-2xl p-6 relative overflow-hidden text-center flex flex-col items-center">
            <div className="absolute top-0 w-full h-24 bg-gradient-to-br from-primary-container/40 to-secondary/20" />
            <div 
              className={`w-24 h-24 rounded-full bg-surface-container-highest border-4 border-surface-container z-10 flex items-center justify-center text-4xl font-extrabold text-primary-container shadow-xl mt-8 relative overflow-hidden group ${isEditing ? 'cursor-pointer' : ''}`}
              onClick={() => isEditing && fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handlePhotoUpload} />
              {profileImage ? (
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                formData.name.split(" ").map((n: string) => n[0]).join("")
              )}
              {isEditing && (
                <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-white text-xl">photo_camera</span>
                </div>
              )}
            </div>
            <h2 className="text-xl font-bold text-on-surface mt-4 relative z-10">{formData.name}</h2>
            <p className="text-secondary text-sm font-medium relative z-10">{formData.role}</p>
            <p className="text-on-surface-variant text-xs mt-1 relative z-10">{formData.company} • {formData.experience}</p>
            
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="mt-6 w-full pulse-gradient py-2 rounded-xl text-on-primary-container font-bold text-sm shadow-[0_0_15px_rgba(124,58,237,0.3)] hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-sm">{isEditing ? "close" : "edit"}</span>
              {isEditing ? "Cancel Edit" : "Edit Profile"}
            </button>
          </div>

          <div className="bg-surface-container-low p-6 rounded-2xl border border-outline-variant/10">
            <h3 className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-4">Academic & Career Records</h3>
            <div className="space-y-3">
              {(studentAnalysis?.marksheet?.filename || studentVerification?.savedMarksheetName) ? (
                 <div className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-xl">
                   <span className="material-symbols-outlined text-success">task</span>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-on-surface truncate">{studentAnalysis?.marksheet?.filename || studentVerification?.savedMarksheetName}</p>
                     <p className="text-[10px] text-emerald-400 uppercase font-semibold">Verified Marksheet</p>
                   </div>
                 </div>
              ) : null}
              {(studentAnalysis?.pursuitPath || studentVerification?.path) ? (
                 <div className="flex items-center gap-3 p-3 bg-surface-container-highest rounded-xl">
                   <span className="material-symbols-outlined text-secondary">school</span>
                   <div className="flex-1 min-w-0">
                     <p className="text-sm font-bold text-on-surface truncate">
                       {(studentAnalysis?.pursuitPath || studentVerification?.path).slice(-1)[0]}
                     </p>
                     <p className="text-[10px] text-on-surface-variant uppercase">Current Pursuit</p>
                   </div>
                 </div>
              ) : null}
              {!(studentAnalysis || studentVerification || uploadedFiles?.resume || analysisResult) && (
                <p className="text-xs text-on-surface-variant">No verification data on this device yet.</p>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Settings Form */}
        <div className="md:col-span-2 bg-surface-container rounded-2xl p-8 relative overflow-hidden">
          <div className="absolute inset-0 faint-grid opacity-10 pointer-events-none" />
          <h3 className="text-violet-400 font-bold text-lg mb-6 uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">manage_accounts</span>
            Personal Information
          </h3>

          <form onSubmit={handleSave} className="space-y-6 relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  required
                  disabled={!isEditing}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Work Email</label>
                <input
                  type="email"
                  required
                  disabled={!isEditing}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Phone Number</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Current Company</label>
                <input
                  type="text"
                  disabled={!isEditing}
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-on-surface uppercase tracking-wider">Target Job Role</label>
              <select
                disabled={!isEditing}
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="w-full bg-surface-container-low border border-outline-variant/30 rounded-xl px-4 py-3 text-on-surface focus:border-primary-container/60 transition-colors disabled:opacity-60 disabled:cursor-not-allowed appearance-none"
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {isEditing && (
              <div className="pt-4 flex justify-end gap-3 border-t border-outline-variant/10">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-6 py-2.5 rounded-xl border border-outline-variant text-on-surface-variant font-bold text-sm hover:bg-surface-container-high transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-2.5 rounded-xl bg-success text-slate-900 font-extrabold text-sm hover:brightness-110 shadow-[0_0_15px_rgba(52,211,153,0.3)] hover:scale-105 transition-all flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Student Verification & Improvements Section */}
        <div className="col-span-1 md:col-span-3 bg-surface-container rounded-2xl p-8 relative overflow-hidden border border-outline-variant/20">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-outline-variant/15">
            <div>
              <h3 className="text-xl font-bold text-primary-container flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary">verified</span>
                Verified Academic Pathway & Skill Improvements
              </h3>
              <p className="text-xs text-on-surface-variant mt-1">
                Saved on this device: Track your academic performance and prioritized skill bridging.
              </p>
            </div>
            <button
              onClick={() => router.push("/student-verification")}
              className="px-5 py-2.5 rounded-xl pulse-gradient text-on-primary-container font-bold text-xs flex items-center gap-2 hover:scale-105 transition-all shadow-[0_0_15px_rgba(124,58,237,0.3)]"
            >
              <span className="material-symbols-outlined text-sm">open_in_new</span>
              {studentAnalysis ? "Review Full Verification" : "Start Verification"}
            </button>
          </div>

          {studentAnalysis ? (
            <div className="space-y-6">
              {/* Summary Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Marksheet Aggregate</p>
                  <p className="text-2xl font-black text-secondary mt-1">{studentAnalysis.marksheet?.percentage ?? "N/A"}%</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Average Expertise</p>
                  <p className="text-2xl font-black text-cyan-400 mt-1">{studentAnalysis.averageRating}/10</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Strengths</p>
                  <p className="text-2xl font-black text-emerald-400 mt-1">{studentAnalysis.strengths?.length || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20">
                  <p className="text-xs text-on-surface-variant uppercase tracking-wider font-semibold">Critical Gaps</p>
                  <p className="text-2xl font-black text-red-400 mt-1">
                    {studentAnalysis.gaps?.filter((g: any) => g.priority === "critical").length || 0}
                  </p>
                </div>
              </div>

              {/* Pathway details */}
              <div className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-2">
                <p className="text-xs text-on-surface-variant uppercase font-bold tracking-wider">Pursuing Pathway</p>
                <div className="text-sm font-semibold text-on-surface flex items-center gap-2 flex-wrap">
                  {studentAnalysis.pursuitPath?.map((p: string, i: number) => (
                    <span key={i} className="flex items-center gap-2">
                      {i > 0 && <span className="material-symbols-outlined text-xs text-outline">chevron_right</span>}
                      <span className="px-2.5 py-1 rounded-lg bg-primary-container/20 text-primary text-xs font-semibold">{p}</span>
                    </span>
                  ))}
                </div>
                <p className="text-xs text-on-surface-variant mt-2">
                  <span className="font-semibold text-secondary">Verified Discipline:</span>{" "}
                  {studentAnalysis.interpretedField || studentAnalysis.fieldOfInterest}
                </p>
              </div>

              {/* Priority Skill Improvements */}
              {studentAnalysis.gaps?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-on-surface uppercase tracking-wider">Targeted Skill Improvements</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {studentAnalysis.gaps.slice(0, 4).map((g: any, i: number) => (
                      <div key={i} className="p-4 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-on-surface">{g.skill}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${g.priority === "critical" ? "bg-red-500/10 text-red-400 border border-red-500/30" : "bg-amber-500/10 text-amber-400 border border-amber-500/30"}`}>
                            {g.priority}
                          </span>
                        </div>
                        <p className="text-xs text-on-surface-variant line-clamp-2">{g.reason}</p>
                        <p className="text-xs text-cyan-400 font-semibold">{g.nextStep}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : studentVerification?.path?.length ? (
            <div className="p-6 rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
              <p className="text-sm text-on-surface font-semibold">Active verification in progress on this device:</p>
              <div className="flex items-center gap-2 flex-wrap">
                {studentVerification.path.map((p: string, i: number) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-primary-container/20 text-primary text-xs font-semibold">{p}</span>
                ))}
              </div>
              {studentVerification.fieldOfInterest && (
                <p className="text-xs text-on-surface-variant">Field: <span className="font-semibold text-secondary">{studentVerification.interpretedField || studentVerification.fieldOfInterest}</span></p>
              )}
              <p className="text-xs text-on-surface-variant">{Object.keys(studentVerification.ratings || {}).length} skills rated so far.</p>
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-surface-container-low border border-outline-variant/20 space-y-3">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">school</span>
              <p className="text-sm text-on-surface-variant">No student verification recorded on this device yet.</p>
              <button
                onClick={() => router.push("/student-verification")}
                className="px-6 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary/90 transition-all inline-block"
              >
                Start Your Verification
              </button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
