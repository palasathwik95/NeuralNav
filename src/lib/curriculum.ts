export type Track = "frontend" | "backend" | "data" | "general";

export interface CatalogModule {
  id: string;
  title: string;
  track: Track;
  skillTags: string[]; // must match skill_scores.skill values where applicable
  difficulty: number; // 1 (easiest) - 5 (hardest)
  estimatedWeeks: number; // at a 5 hrs/week baseline pace
  prerequisites: string[]; // ids of modules that should come first
}

// This catalog is the single source of truth for what a generated path can
// contain. Keeping it a closed, curated list (rather than letting the model
// invent modules) is what keeps generated paths trustworthy — see
// src/lib/pathGenerator.ts and src/app/api/generate-path/route.ts.
export const CATALOG: CatalogModule[] = [
  // --- frontend ---
  { id: "fe-html-css", title: "HTML & CSS Foundations", track: "frontend", skillTags: ["HTML/CSS"], difficulty: 1, estimatedWeeks: 1, prerequisites: [] },
  { id: "fe-js-fundamentals", title: "JavaScript Fundamentals", track: "frontend", skillTags: ["JavaScript"], difficulty: 2, estimatedWeeks: 2, prerequisites: ["fe-html-css"] },
  { id: "fe-css-grid", title: "Responsive Layout & CSS Grid", track: "frontend", skillTags: ["HTML/CSS", "Design systems"], difficulty: 2, estimatedWeeks: 1, prerequisites: ["fe-html-css"] },
  { id: "fe-react-patterns", title: "Modern React Patterns", track: "frontend", skillTags: ["React"], difficulty: 3, estimatedWeeks: 2, prerequisites: ["fe-js-fundamentals"] },
  { id: "fe-state-management", title: "State Management Deep Dive", track: "frontend", skillTags: ["React"], difficulty: 3, estimatedWeeks: 2, prerequisites: ["fe-react-patterns"] },
  { id: "fe-accessibility", title: "Accessibility Foundations", track: "frontend", skillTags: ["Accessibility"], difficulty: 2, estimatedWeeks: 1, prerequisites: ["fe-html-css"] },
  { id: "fe-testing", title: "Testing React Applications", track: "frontend", skillTags: ["Testing"], difficulty: 3, estimatedWeeks: 1, prerequisites: ["fe-react-patterns"] },
  { id: "fe-design-systems", title: "Design Systems & Component Libraries", track: "frontend", skillTags: ["Design systems"], difficulty: 3, estimatedWeeks: 1, prerequisites: ["fe-css-grid"] },
  { id: "fe-capstone", title: "Frontend Capstone Project", track: "frontend", skillTags: ["React", "Testing"], difficulty: 4, estimatedWeeks: 3, prerequisites: ["fe-state-management", "fe-testing"] },

  // --- backend ---
  { id: "be-fundamentals", title: "Server-Side Programming Fundamentals", track: "backend", skillTags: ["Programming"], difficulty: 1, estimatedWeeks: 2, prerequisites: [] },
  { id: "be-rest-apis", title: "HTTP & REST API Basics", track: "backend", skillTags: ["APIs"], difficulty: 2, estimatedWeeks: 2, prerequisites: ["be-fundamentals"] },
  { id: "be-databases", title: "Databases & SQL Foundations", track: "backend", skillTags: ["Databases"], difficulty: 2, estimatedWeeks: 2, prerequisites: ["be-fundamentals"] },
  { id: "be-auth-security", title: "Authentication & Security Basics", track: "backend", skillTags: ["Security"], difficulty: 3, estimatedWeeks: 1, prerequisites: ["be-rest-apis"] },
  { id: "be-testing-docs", title: "API Testing & Documentation", track: "backend", skillTags: ["Testing"], difficulty: 3, estimatedWeeks: 1, prerequisites: ["be-rest-apis"] },
  { id: "be-capstone", title: "Backend Capstone Project", track: "backend", skillTags: ["APIs", "Databases"], difficulty: 4, estimatedWeeks: 3, prerequisites: ["be-auth-security", "be-databases"] },

  // --- data ---
  { id: "da-python", title: "Python & Data Fundamentals", track: "data", skillTags: ["Python"], difficulty: 1, estimatedWeeks: 2, prerequisites: [] },
  { id: "da-stats", title: "Statistics for Data Analysis", track: "data", skillTags: ["Statistics"], difficulty: 2, estimatedWeeks: 2, prerequisites: ["da-python"] },
  { id: "da-viz", title: "Data Visualization", track: "data", skillTags: ["Visualization"], difficulty: 2, estimatedWeeks: 1, prerequisites: ["da-python"] },
  { id: "da-ml-foundations", title: "Machine Learning Foundations", track: "data", skillTags: ["Machine Learning"], difficulty: 3, estimatedWeeks: 3, prerequisites: ["da-stats"] },
  { id: "da-model-eval", title: "Model Evaluation & Deployment", track: "data", skillTags: ["Machine Learning"], difficulty: 3, estimatedWeeks: 2, prerequisites: ["da-ml-foundations"] },
  { id: "da-capstone", title: "Data Capstone Project", track: "data", skillTags: ["Machine Learning", "Visualization"], difficulty: 4, estimatedWeeks: 3, prerequisites: ["da-model-eval", "da-viz"] },

  // --- general (mixed into every track) ---
  // Difficulty values are deliberately fractional so these land at sensible
  // points in the sequence: right at the start, and just before each
  // track's capstone (difficulty 4) — rather than wherever a plain
  // integer-difficulty sort would happen to drop them.
  { id: "gn-learning-how-to-learn", title: "Learning How to Learn", track: "general", skillTags: [], difficulty: 0.5, estimatedWeeks: 1, prerequisites: [] },
  { id: "gn-portfolio", title: "Portfolio & Personal Branding", track: "general", skillTags: [], difficulty: 3.5, estimatedWeeks: 1, prerequisites: [] },
  { id: "gn-communication", title: "Technical Communication", track: "general", skillTags: [], difficulty: 3.5, estimatedWeeks: 1, prerequisites: [] },
];
