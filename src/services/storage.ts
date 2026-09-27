import { ModulePage, StudentSubmission, User } from '../types';
import { INITIAL_MODULES, INITIAL_SUBMISSIONS, INITIAL_USERS } from '../data/initialData';

const STORAGE_KEYS = {
  CURRENT_USER: 'aulavirtual_current_user',
  USERS: 'aulavirtual_users',
  MODULES: 'aulavirtual_modules',
  SUBMISSIONS: 'aulavirtual_submissions',
};

// In-memory fallback if localStorage is disabled or throws SecurityError
const memoryStore: Record<string, string> = {};

function safeGet(key: string): string | null {
  try {
    const val = localStorage.getItem(key);
    return val !== null ? val : (memoryStore[key] ?? null);
  } catch {
    return memoryStore[key] ?? null;
  }
}

function safeSet(key: string, value: string): void {
  memoryStore[key] = value;
  try {
    localStorage.setItem(key, value);
  } catch {
    // In-memory fallback active
  }
}

function safeRemove(key: string): void {
  delete memoryStore[key];
  try {
    localStorage.removeItem(key);
  } catch {
    // In-memory fallback active
  }
}

export const storageService = {
  // Authentication
  getCurrentUser(): User | null {
    try {
      const stored = safeGet(STORAGE_KEYS.CURRENT_USER);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  },

  setCurrentUser(user: User | null): void {
    try {
      if (user) {
        safeSet(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
      } else {
        safeRemove(STORAGE_KEYS.CURRENT_USER);
      }
    } catch {
      // Ignored
    }
  },

  // Users
  getUsers(): User[] {
    try {
      const stored = safeGet(STORAGE_KEYS.USERS);
      let users: User[] = stored ? JSON.parse(stored) : [];
      if (!Array.isArray(users) || users.length === 0) {
        this.saveUsers(INITIAL_USERS);
        return INITIAL_USERS;
      }

      // Ensure the Admin user always exists even if users were stored previously
      const hasAdmin = users.some(u => u.username.toLowerCase() === 'admin');
      if (!hasAdmin) {
        const adminUser = INITIAL_USERS.find(u => u.username.toLowerCase() === 'admin');
        if (adminUser) {
          users.unshift(adminUser);
          this.saveUsers(users);
        }
      }

      return users;
    } catch {
      return INITIAL_USERS;
    }
  },

  saveUsers(users: User[]): void {
    try {
      safeSet(STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch {
      // Ignored
    }
  },

  addUser(user: User): void {
    const users = this.getUsers();
    users.push(user);
    this.saveUsers(users);
  },

  // Modules
  getModules(): ModulePage[] {
    try {
      const stored = safeGet(STORAGE_KEYS.MODULES);
      if (stored) {
        return JSON.parse(stored);
      }
      this.saveModules(INITIAL_MODULES);
      return INITIAL_MODULES;
    } catch {
      return INITIAL_MODULES;
    }
  },

  saveModules(modules: ModulePage[]): void {
    try {
      safeSet(STORAGE_KEYS.MODULES, JSON.stringify(modules));
    } catch {
      // Ignored
    }
  },

  getModuleById(id: string): ModulePage | undefined {
    const modules = this.getModules();
    return modules.find(m => m.id === id);
  },

  saveOrUpdateModule(module: ModulePage): void {
    const modules = this.getModules();
    const index = modules.findIndex(m => m.id === module.id);
    if (index >= 0) {
      modules[index] = { ...module, updatedAt: new Date().toISOString() };
    } else {
      modules.unshift({ ...module, createdAt: new Date().toISOString().split('T')[0] });
    }
    this.saveModules(modules);
  },

  deleteModule(id: string): void {
    const modules = this.getModules().filter(m => m.id !== id);
    this.saveModules(modules);
  },

  // Submissions
  getSubmissions(): StudentSubmission[] {
    try {
      const stored = safeGet(STORAGE_KEYS.SUBMISSIONS);
      if (stored) {
        return JSON.parse(stored);
      }
      this.saveSubmissions(INITIAL_SUBMISSIONS);
      return INITIAL_SUBMISSIONS;
    } catch {
      return INITIAL_SUBMISSIONS;
    }
  },

  saveSubmissions(submissions: StudentSubmission[]): void {
    try {
      safeSet(STORAGE_KEYS.SUBMISSIONS, JSON.stringify(submissions));
    } catch {
      // Ignored
    }
  },

  addSubmission(submission: StudentSubmission): void {
    const submissions = this.getSubmissions();
    // Replace if already submitted for same student and module, or append
    const existingIndex = submissions.findIndex(
      s => s.studentId === submission.studentId && s.moduleId === submission.moduleId
    );
    if (existingIndex >= 0) {
      submissions[existingIndex] = submission;
    } else {
      submissions.unshift(submission);
    }
    this.saveSubmissions(submissions);
  },

  getStudentSubmissions(studentId: string): StudentSubmission[] {
    return this.getSubmissions().filter(s => s.studentId === studentId);
  },

  // Export / Import for GitHub Pages and Backup
  exportData(): string {
    const data = {
      app: 'AulaVirtual',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      modules: this.getModules(),
      users: this.getUsers().map(u => ({ ...u, password: u.password })),
      submissions: this.getSubmissions(),
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonContent: string): { success: boolean; message: string } {
    try {
      const parsed = JSON.parse(jsonContent);
      if (Array.isArray(parsed.modules)) {
        this.saveModules(parsed.modules);
      }
      if (Array.isArray(parsed.users)) {
        this.saveUsers(parsed.users);
      }
      if (Array.isArray(parsed.submissions)) {
        this.saveSubmissions(parsed.submissions);
      }
      return { success: true, message: 'Datos importados y actualizados correctamente.' };
    } catch (err: any) {
      return { success: false, message: 'El archivo JSON no tiene un formato válido: ' + err.message };
    }
  },

  resetDefaults(): void {
    localStorage.removeItem(STORAGE_KEYS.MODULES);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.SUBMISSIONS);
    this.saveModules(INITIAL_MODULES);
    this.saveUsers(INITIAL_USERS);
    this.saveSubmissions(INITIAL_SUBMISSIONS);
  },
};
