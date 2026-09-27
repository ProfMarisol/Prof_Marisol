export type UserRole = 'teacher' | 'student';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  password?: string;
  avatar?: string;
  gradeGroup?: string;
}

export type ExerciseType = 
  | 'multiple-choice'
  | 'true-false'
  | 'fill-blank'
  | 'short-answer'
  | 'open-question';

export interface ExerciseItem {
  id: string;
  type: ExerciseType;
  prompt: string;
  instructions?: string;
  options?: string[]; // for multiple choice
  correctAnswer: string | number | boolean | string[]; // depending on type
  explanation?: string;
  points: number;
  hint?: string;
}

export interface ModulePage {
  id: string;
  title: string;
  slug: string;
  subject: string;
  description: string;
  estimatedMinutes: number;
  difficulty: 'básico' | 'intermedio' | 'avanzado';
  isPublished: boolean;
  author: string;
  createdAt: string;
  updatedAt?: string;
  theoryMarkdown?: string;
  externalUrl?: string; // Optional custom external HTML URL (e.g., ./pages/ejercicio-canvas.html)
  htmlContent?: string; // Direct HTML file uploaded by teacher
  htmlFileName?: string; // Name of uploaded HTML file (e.g., ejercicio.html)
  exercises: ExerciseItem[];
}

export interface StudentSubmission {
  id: string;
  studentId: string;
  studentName: string;
  moduleId: string;
  moduleTitle: string;
  answers: Record<string, any>;
  score: number;
  maxScore: number;
  percentage: number;
  submittedAt: string;
  feedback?: string;
}

export interface GitHubSyncConfig {
  owner: string;
  repo: string;
  branch: string;
  filePath: string;
  token?: string;
  autoSync: boolean;
  lastSyncedAt?: string;
}

export interface AppDatabasePayload {
  app: string;
  version: string;
  lastUpdated: string;
  users: User[];
  modules: ModulePage[];
  submissions: StudentSubmission[];
}

export type ViewState = 
  | { type: 'dashboard' }
  | { type: 'module-runner'; moduleId: string }
  | { type: 'module-editor'; moduleId?: string }
  | { type: 'submissions' }
  | { type: 'students-manager' }
  | { type: 'teachers-manager' }
  | { type: 'github-sync' };
