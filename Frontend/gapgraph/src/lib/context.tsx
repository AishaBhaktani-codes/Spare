"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";

interface AppContextType {
  completedModules: Set<number>;
  toggleModule: (id: number) => void;
  overallProgress: number;
  selectedRole: string;
  setSelectedRole: (role: string) => void;
  uploadedFiles: { resume: File | null; jd: File | null };
  setUploadedFiles: (files: { resume: File | null; jd: File | null }) => void;
  isLoggedIn: boolean;
  userProfile: { name: string; email: string; role: string; id?: string } | null;
  login: (profile: { name: string; email: string; role: string; id?: string }) => void;
  logout: () => void;
  analysisResult: any;
  setAnalysisResult: (result: any) => void;
  studentAnalysis: any;
  setStudentAnalysis: (result: any) => void;
  studentVerification: any;
  setStudentVerification: (data: any) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [completedModules, setCompletedModules] = useState<Set<number>>(new Set());
  const [selectedRole, setSelectedRole] = useState("Software Engineer");
  const [uploadedFiles, setUploadedFiles] = useState<{ resume: File | null; jd: File | null }>({ resume: null, jd: null });
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState<{ name: string; email: string; role: string; id?: string } | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [studentAnalysis, setStudentAnalysis] = useState<any>(null);
  const [studentVerification, setStudentVerification] = useState<any>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load state from localStorage on mount
  useEffect(() => {
    try {
      const storedLogin = localStorage.getItem("gg_isLoggedIn");
      if (storedLogin) setIsLoggedIn(JSON.parse(storedLogin));

      const storedProfile = localStorage.getItem("gg_userProfile");
      if (storedProfile) setUserProfile(JSON.parse(storedProfile));

      const storedAnalysis = localStorage.getItem("gg_analysisResult");
      if (storedAnalysis) setAnalysisResult(JSON.parse(storedAnalysis));

      const storedStudentAnalysis = localStorage.getItem("gg_student_analysis");
      if (storedStudentAnalysis) setStudentAnalysis(JSON.parse(storedStudentAnalysis));

      const storedStudentVerif = localStorage.getItem("gg_student_verification");
      if (storedStudentVerif) setStudentVerification(JSON.parse(storedStudentVerif));

      const storedModules = localStorage.getItem("gg_completedModules");
      if (storedModules) setCompletedModules(new Set(JSON.parse(storedModules)));
    } catch (e) {
      console.error("Error loading state from localStorage", e);
    }
    setIsInitialized(true);
  }, []);

  // Save state to localStorage on changes
  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("gg_isLoggedIn", JSON.stringify(isLoggedIn));
    if (userProfile) {
      localStorage.setItem("gg_userProfile", JSON.stringify(userProfile));
    } else {
      localStorage.removeItem("gg_userProfile");
    }
  }, [isLoggedIn, userProfile, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (analysisResult) {
      localStorage.setItem("gg_analysisResult", JSON.stringify(analysisResult));
    } else {
      localStorage.removeItem("gg_analysisResult");
    }
  }, [analysisResult, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (studentAnalysis) {
      localStorage.setItem("gg_student_analysis", JSON.stringify(studentAnalysis));
    } else {
      localStorage.removeItem("gg_student_analysis");
    }
  }, [studentAnalysis, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    if (studentVerification) {
      localStorage.setItem("gg_student_verification", JSON.stringify(studentVerification));
    } else {
      localStorage.removeItem("gg_student_verification");
    }
  }, [studentVerification, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    localStorage.setItem("gg_completedModules", JSON.stringify(Array.from(completedModules)));
  }, [completedModules, isInitialized]);

  const totalModules = analysisResult?.learningPath?.nodes?.length || 7;
  const overallProgress = Math.round((completedModules.size / Math.max(1, totalModules)) * 100);

  const toggleModule = useCallback((id: number) => {
    setCompletedModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const login = (profile: { name: string; email: string; role: string; id?: string }) => {
    setIsLoggedIn(true);
    setUserProfile(profile);
  };
  const logout = () => {
    setIsLoggedIn(false);
    setUserProfile(null);
    setCompletedModules(new Set());
    setAnalysisResult(null);
    setStudentAnalysis(null);
    setStudentVerification(null);
    localStorage.removeItem("gg_student_analysis");
    localStorage.removeItem("gg_student_verification");
  };

  return (
    <AppContext.Provider
      value={{
        completedModules,
        toggleModule,
        overallProgress,
        selectedRole,
        setSelectedRole,
        uploadedFiles,
        setUploadedFiles,
        isLoggedIn,
        userProfile,
        login,
        logout,
        analysisResult,
        setAnalysisResult,
        studentAnalysis,
        setStudentAnalysis,
        studentVerification,
        setStudentVerification,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
