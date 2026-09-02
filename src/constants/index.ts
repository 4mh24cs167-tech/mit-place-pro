// ═══════════════════════════════════════════
// UdyogaMITra — Constants & Mock Data
// ═══════════════════════════════════════════

export const DEPARTMENTS = [
  "CSE",
  "ISE",
  "ECE",
  "EEE",
  "MECH",
  "CIVIL",
  "AIML",
  "AIDS",
  "MBA",
  "MCA",
] as const;

export const SECTORS = [
  "Information Technology",
  "Finance & Banking",
  "Manufacturing",
  "Healthcare",
  "Consulting",
  "E-Commerce",
  "Automotive",
  "Telecom",
  "Education",
  "Energy",
  "Real Estate",
  "Media & Entertainment",
  "Other",
] as const;

export const ROUND_TYPES = [
  { value: "written", label: "Written / Aptitude" },
  { value: "technical", label: "Technical Round" },
  { value: "HR", label: "HR Round" },
  { value: "GD", label: "Group Discussion" },
  { value: "coding", label: "Coding Round" },
] as const;

export const WORK_MODES = [
  { value: "on-site", label: "On-Site" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
] as const;

export const TURNOVER_RANGES = [
  "< 1 Cr",
  "1 - 10 Cr",
  "10 - 100 Cr",
  "100 - 500 Cr",
  "500 Cr+",
] as const;

export const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"] as const;

export const GENDERS = ["Male", "Female", "Prefer not to say"] as const;

export const BOARDS = [
  "CBSE",
  "ICSE",
  "Karnataka State Board",
  "Maharashtra State Board",
  "Other State Board",
] as const;

export const STREAMS = ["Science", "Commerce", "Arts"] as const;

export const PROFICIENCY_LEVELS = [
  "Basic",
  "Conversational",
  "Fluent",
  "Native",
] as const;

// All data is fetched from the live API — no mock data.

export const SKILL_SUGGESTIONS = [
  "JavaScript", "TypeScript", "Python", "Java", "C++", "C", "Go", "Rust",
  "React", "Angular", "Vue.js", "Next.js", "Node.js", "Express.js", "NestJS",
  "Spring Boot", "Django", "Flask", "FastAPI", "Ruby on Rails",
  "HTML", "CSS", "Tailwind CSS", "SASS", "Bootstrap",
  "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch",
  "AWS", "Azure", "GCP", "Docker", "Kubernetes",
  "Git", "CI/CD", "Jenkins", "GitHub Actions",
  "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
  "TensorFlow", "PyTorch", "Scikit-learn", "Pandas", "NumPy",
  "SQL", "NoSQL", "GraphQL", "REST API", "gRPC",
  "Data Structures", "Algorithms", "System Design",
  "Linux", "Networking", "Cybersecurity",
  "Figma", "UI/UX Design", "Adobe XD",
  "Communication", "Leadership", "Teamwork", "Problem Solving",
  "MATLAB", "VLSI", "Embedded C", "Arduino", "IoT",
  "AutoCAD", "SolidWorks", "CATIA", "3D Printing",
];
