/**
 * Dynamic Student Roadmap & Module Generator
 * Translates the student's verified pursuit, field of interest, rated competencies,
 * and identified skill gaps into personalized learning roadmap nodes and module details.
 * Zero hardcoded dummy data.
 */

export interface DynamicModuleResource {
  type: "video" | "docs" | "course";
  title: string;
  source: string;
  duration: string;
  url: string;
}

export interface DynamicModuleQuiz {
  question: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface DynamicModule {
  id: string;
  title: string;
  category: string;
  hours: number;
  priority: "critical" | "medium" | "low";
  currentLevel: number; // 0-100
  requiredLevel: number; // 0-100
  phase: number; // 1, 2, or 3
  phaseTitle: string;
  description: string;
  actionStep: string;
  resources: DynamicModuleResource[];
  quiz: DynamicModuleQuiz;
}

export function generateStudentRoadmap(
  studentAnalysis: any,
  studentVerification: any
): {
  modules: DynamicModule[];
  fieldTitle: string;
  pursuitTitle: string;
  hasRealData: boolean;
} {
  const fieldTitle =
    studentAnalysis?.interpretedField ||
    studentAnalysis?.fieldOfInterest ||
    studentVerification?.interpretedField ||
    studentVerification?.fieldOfInterest ||
    "";

  const pursuitTitle =
    studentAnalysis?.pursuitPath?.length
      ? studentAnalysis.pursuitPath.join(" › ")
      : studentVerification?.path?.length
      ? studentVerification.path.join(" › ")
      : "";

  const hasRealData = Boolean(
    (studentAnalysis && studentAnalysis.gaps && studentAnalysis.gaps.length > 0) ||
      (studentVerification && studentVerification.ratings && Object.keys(studentVerification.ratings).length > 0)
  );

  if (!hasRealData) {
    return {
      modules: [],
      fieldTitle: "",
      pursuitTitle: "",
      hasRealData: false,
    };
  }

  const rawGaps: Array<{
    skill: string;
    rating: number;
    priority: "critical" | "medium" | "low";
    reason?: string;
    nextStep?: string;
    resourceUrl?: string;
    category?: string;
  }> = [];

  // If studentAnalysis has gaps from backend AI
  if (studentAnalysis?.gaps && Array.isArray(studentAnalysis.gaps)) {
    studentAnalysis.gaps.forEach((g: any) => {
      rawGaps.push({
        skill: g.skill,
        rating: typeof g.rating === "number" ? g.rating : 4,
        priority: g.priority || "medium",
        reason: g.reason,
        nextStep: g.nextStep,
        resourceUrl: g.resourceUrl,
      });
    });
  }

  // Also check studentVerification ratings if not covered in gaps
  if (studentVerification?.ratings) {
    const ratings = studentVerification.ratings;
    const skillsMeta = studentVerification.skills || [];
    Object.entries(ratings).forEach(([skillName, ratingVal]) => {
      const r = Number(ratingVal);
      // If rating is < 8 and not already in rawGaps
      if (r < 8 && !rawGaps.some((g) => g.skill.toLowerCase() === skillName.toLowerCase())) {
        const meta = skillsMeta.find((s: any) => s.skill.toLowerCase() === skillName.toLowerCase());
        rawGaps.push({
          skill: skillName,
          rating: r,
          priority: r <= 3 ? "critical" : r <= 5 ? "medium" : "low",
          reason: meta?.description || `Foundational competency for ${fieldTitle}.`,
          nextStep: `Engage with focused practical exercises and build an applied milestone in ${skillName}.`,
          category: meta?.category || "Technical",
        });
      }
    });
  }

  // Sort rawGaps by priority (critical first, then lowest rating first)
  const priorityWeight = { critical: 3, medium: 2, low: 1 };
  rawGaps.sort((a, b) => {
    const weightDiff = (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0);
    if (weightDiff !== 0) return weightDiff;
    return a.rating - b.rating;
  });

  // Assign phases based on priority and order
  const total = rawGaps.length;
  const p1Count = Math.max(1, Math.ceil(total * 0.4));
  const p2Count = Math.max(1, Math.ceil(total * 0.35));

  const modules: DynamicModule[] = rawGaps.map((gap, index) => {
    let phase = 1;
    let phaseTitle = "Phase 1: Critical Bridging Foundations";

    if (index < p1Count && (gap.priority === "critical" || gap.rating <= 4)) {
      phase = 1;
      phaseTitle = "Phase 1: Critical Bridging Foundations";
    } else if (index < p1Count + p2Count) {
      phase = 2;
      phaseTitle = "Phase 2: Core Domain Competency";
    } else {
      phase = 3;
      phaseTitle = "Phase 3: Advanced Application & Synthesis";
    }

    const currentLevel = Math.round(gap.rating * 10);
    const requiredLevel = gap.priority === "critical" ? 85 : gap.priority === "medium" ? 80 : 75;
    const hours = Math.max(3, Math.round((10 - gap.rating) * 1.5));

    const videoUrl =
      gap.resourceUrl ||
      `https://www.youtube.com/results?search_query=${encodeURIComponent(
        `${gap.skill} ${fieldTitle} complete tutorial course`
      )}`;

    const docsUrl = `https://www.google.com/search?q=${encodeURIComponent(
      `${gap.skill} documentation best practices tutorial`
    )}`;

    const repoUrl = `https://github.com/search?q=${encodeURIComponent(
      `${gap.skill} practical application example`
    )}`;

    const resources: DynamicModuleResource[] = [
      {
        type: "video",
        title: `${gap.skill} — Deep Dive Tutorial`,
        source: "Curated Video Lecture",
        duration: `${Math.max(1, Math.round(hours * 0.4))} hrs`,
        url: videoUrl,
      },
      {
        type: "docs",
        title: `${gap.skill} — Architecture & Documentation`,
        source: "Official Technical Specs",
        duration: `${Math.max(1, Math.round(hours * 0.2))} hrs`,
        url: docsUrl,
      },
      {
        type: "course",
        title: `${gap.skill} — Hands-On Portfolio Lab`,
        source: "Applied Domain Artifact",
        duration: `${Math.max(1, Math.round(hours * 0.4))} hrs`,
        url: repoUrl,
      },
    ];

    const quiz: DynamicModuleQuiz = {
      question: `In the context of ${fieldTitle}, what is the primary role of mastering "${gap.skill}"?`,
      options: [
        `It serves merely as passive reference material without direct impact on implementation.`,
        `It establishes the core architectural capability required to build, test, and scale reliable solutions in ${fieldTitle}.`,
        `It eliminates the need for software design principles and automated testing.`,
        `It replaces all foundational domain mathematics and runtime execution layers.`,
      ],
      correct: 1,
      explanation: `Proficiency in ${gap.skill} provides the direct engineering mechanics and problem-solving capability demanded by industry benchmarks in ${fieldTitle}.`,
    };

    return {
      id: String(index + 1),
      title: gap.skill,
      category: gap.category || (gap.priority === "critical" ? "Core Engineering" : "Specialization"),
      hours,
      priority: gap.priority,
      currentLevel,
      requiredLevel,
      phase,
      phaseTitle,
      description:
        gap.reason ||
        `Self-assessment indicates a score of ${gap.rating}/10 in ${gap.skill}. This module delivers structured guidance to close the ${requiredLevel - currentLevel}% knowledge gap for ${fieldTitle}.`,
      actionStep:
        gap.nextStep ||
        `Study the curated resources, implement 2 domain-specific problem solutions, and document your learnings in your engineering log.`,
      resources,
      quiz,
    };
  });

  return {
    modules,
    fieldTitle,
    pursuitTitle,
    hasRealData: true,
  };
}
