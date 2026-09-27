import { GitHubSyncConfig, StudentSubmission, User, ModulePage } from '../types';
import { storageService } from './storage';

const GITHUB_CONFIG_KEY = 'aulavirtual_github_sync_config';

const DEFAULT_CONFIG: GitHubSyncConfig = {
  owner: 'Prof_Marisol',
  repo: 'Prof_Marisol',
  branch: 'main',
  filePath: 'data/aulavirtual_db.json',
  token: '',
  autoSync: false,
};

export const githubSyncService = {
  getConfig(): GitHubSyncConfig {
    try {
      const stored = localStorage.getItem(GITHUB_CONFIG_KEY);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch {
      // Fallback
    }
    return DEFAULT_CONFIG;
  },

  saveConfig(config: GitHubSyncConfig): void {
    try {
      localStorage.setItem(GITHUB_CONFIG_KEY, JSON.stringify(config));
    } catch {
      // Ignored
    }
  },

  // Generates current database payload
  getDatabasePayload() {
    return {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      users: storageService.getUsers(),
      modules: storageService.getModules(),
      submissions: storageService.getSubmissions(),
    };
  },

  // Test connection to GitHub
  async testConnection(config: GitHubSyncConfig): Promise<{ success: boolean; message: string }> {
    const { owner, repo, token, branch } = config;
    if (!owner || !repo) {
      return { success: false, message: 'Debes especificar el Usuario/Organización y el Repositorio de GitHub.' };
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };
      if (token?.trim()) {
        headers.Authorization = `Bearer ${token.trim()}`;
      }

      const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, { headers });
      if (!res.ok) {
        if (res.status === 404) {
          return { success: false, message: `El repositorio "${owner}/${repo}" no fue encontrado o es privado sin token de acceso.` };
        }
        if (res.status === 401) {
          return { success: false, message: 'El Token de GitHub proporcionado no es válido o ha expirado.' };
        }
        return { success: false, message: `Error al conectar con GitHub (Código ${res.status}).` };
      }

      const data = await res.json();
      return { 
        success: true, 
        message: `¡Conexión establecida con éxito con ${data.full_name}! (Rama por defecto: ${data.default_branch || branch})` 
      };
    } catch (err: any) {
      return { success: false, message: `Error de red al conectar con GitHub: ${err?.message || 'Verifica tu conexión'}` };
    }
  },

  // Load database from GitHub repository into localStorage
  async pullFromGitHub(configOverride?: GitHubSyncConfig): Promise<{ success: boolean; message: string; data?: any }> {
    const config = configOverride || this.getConfig();
    const { owner, repo, branch, filePath, token } = config;

    if (!owner || !repo) {
      return { success: false, message: 'Configura primero el repositorio de GitHub.' };
    }

    try {
      let contentJson: string | null = null;

      // 1. Try raw.githubusercontent.com first (instant read for public repos)
      try {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}?t=${Date.now()}`;
        const rawRes = await fetch(rawUrl);
        if (rawRes.ok) {
          contentJson = await rawRes.text();
        }
      } catch {
        // Fall back to API
      }

      // 2. If not obtained, try GitHub API (works for private repos with token too)
      if (!contentJson) {
        const headers: Record<string, string> = {
          Accept: 'application/vnd.github.v3+json',
        };
        if (token?.trim()) {
          headers.Authorization = `Bearer ${token.trim()}`;
        }

        const apiRes = await fetch(
          `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
          { headers }
        );

        if (apiRes.ok) {
          const apiData = await apiRes.json();
          if (apiData.content) {
            contentJson = decodeURIComponent(escape(atob(apiData.content.replace(/\s/g, ''))));
          }
        }
      }

      if (!contentJson) {
        return { 
          success: false, 
          message: `No se encontró el archivo "${filePath}" en GitHub todavía. Puedes pulsar "Guardar en GitHub" para crearlo por primera vez.` 
        };
      }

      const parsed = JSON.parse(contentJson);

      // Validate and apply data to storage
      if (Array.isArray(parsed.users) && parsed.users.length > 0) {
        storageService.saveUsers(parsed.users);
      }
      if (Array.isArray(parsed.modules) && parsed.modules.length > 0) {
        storageService.saveModules(parsed.modules);
      }
      if (Array.isArray(parsed.submissions)) {
        storageService.saveSubmissions(parsed.submissions);
      }

      // Update last sync time
      config.lastSyncedAt = new Date().toISOString();
      this.saveConfig(config);

      return {
        success: true,
        message: `¡Datos sincronizados desde GitHub! Se cargaron ${parsed.users?.length || 0} usuarios y ${parsed.modules?.length || 0} módulos.`,
        data: parsed,
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: `Error al leer de GitHub: ${err?.message || 'Error desconocido'}` 
      };
    }
  },

  // Save current database (users, teachers, modules, submissions) into GitHub
  async pushToGitHub(
    configOverride?: GitHubSyncConfig,
    commitMessage = 'Actualizar base de datos de usuarios y módulos [AulaVirtual]'
  ): Promise<{ success: boolean; message: string }> {
    const config = configOverride || this.getConfig();
    const { owner, repo, branch, filePath, token } = config;

    if (!owner || !repo) {
      return { success: false, message: 'Configura primero el usuario y repositorio de GitHub.' };
    }

    if (!token?.trim()) {
      return { 
        success: false, 
        message: 'Para escribir y guardar directamente en GitHub se requiere un Token de Acceso Personal (PAT) con permiso "repo" o "contents: write". Puedes generarlo gratis en GitHub > Settings > Developer Settings > Tokens.' 
      };
    }

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      };

      // 1. Get existing file SHA if it already exists
      let sha: string | undefined = undefined;
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}?ref=${branch}`,
        { headers }
      );
      if (getRes.ok) {
        const existingData = await getRes.json();
        sha = existingData.sha;
      }

      // 2. Prepare payload and base64 encoding (supporting UTF-8 characters)
      const payload = this.getDatabasePayload();
      const jsonString = JSON.stringify(payload, null, 2);
      const utf8Bytes = new TextEncoder().encode(jsonString);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Content = btoa(binary);

      // 3. PUT content to GitHub
      const putBody: any = {
        message: commitMessage,
        content: base64Content,
        branch,
      };
      if (sha) {
        putBody.sha = sha;
      }

      const putRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify(putBody),
        }
      );

      if (!putRes.ok) {
        const errorJson = await putRes.json().catch(() => ({}));
        return { 
          success: false, 
          message: `Error al guardar en GitHub: ${errorJson.message || `Código ${putRes.status}`}` 
        };
      }

      config.lastSyncedAt = new Date().toISOString();
      this.saveConfig(config);

      return {
        success: true,
        message: `¡Guardado en GitHub con éxito! El archivo "${filePath}" se ha actualizado en la rama "${branch}".`,
      };
    } catch (err: any) {
      return { 
        success: false, 
        message: `Error de red al guardar en GitHub: ${err?.message || 'Error desconocido'}` 
      };
    }
  },

  // Save an individual student submission inside:
  // "entregas/{alumno}/{slug}-{submissionId}.json"
  async saveStudentSubmissionToGitHub(
    submission: StudentSubmission,
    student: User,
    module: ModulePage
  ): Promise<{ success: boolean; message: string }> {
    const config = this.getConfig();
    const { owner, repo, branch, token } = config;

    if (!owner || !repo || !token?.trim()) {
      // GitHub token not configured, local storage is used
      return { 
        success: true, 
        message: 'Entrega registrada localmente (Sincronización con GitHub inactiva).' 
      };
    }

    try {
      const cleanStudent = student.username.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
      const cleanSlug = (module.slug || module.id).replace(/[^a-zA-Z0-9_-]/g, '_');
      const submissionPath = `entregas/${cleanStudent}/${cleanSlug}-${submission.id.substring(0, 10)}.json`;

      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
        Authorization: `Bearer ${token.trim()}`,
        'Content-Type': 'application/json',
      };

      // Check if existing file has SHA
      let sha: string | undefined = undefined;
      const getRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${submissionPath}?ref=${branch}`,
        { headers }
      );
      if (getRes.ok) {
        const existingData = await getRes.json();
        sha = existingData.sha;
      }

      const fullSubmissionData = {
        submission,
        student: {
          id: student.id,
          username: student.username,
          name: student.name,
          gradeGroup: student.gradeGroup,
        },
        module: {
          id: module.id,
          title: module.title,
          subject: module.subject,
          author: module.author,
        },
        savedAt: new Date().toISOString(),
      };

      const jsonString = JSON.stringify(fullSubmissionData, null, 2);
      const utf8Bytes = new TextEncoder().encode(jsonString);
      let binary = '';
      for (let i = 0; i < utf8Bytes.length; i++) {
        binary += String.fromCharCode(utf8Bytes[i]);
      }
      const base64Content = btoa(binary);

      const putRes = await fetch(
        `https://api.github.com/repos/${owner}/${repo}/contents/${submissionPath}`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({
            message: `Entrega de alumno ${student.name} para ${module.title}`,
            content: base64Content,
            branch,
            ...(sha ? { sha } : {}),
          }),
        }
      );

      if (!putRes.ok) {
        return { success: false, message: 'No se pudo guardar la entrega en GitHub.' };
      }

      return { 
        success: true, 
        message: `Entrega guardada en GitHub: "${submissionPath}".` 
      };
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error al guardar entrega en GitHub.' };
    }
  },

  // Download database file for manual upload to GitHub
  downloadDatabaseFile(): void {
    const payload = this.getDatabasePayload();
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'aulavirtual_db.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
