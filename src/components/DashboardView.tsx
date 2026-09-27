import React, { useState } from 'react';
import { ModulePage, StudentSubmission, User, ViewState } from '../types';
import { storageService } from '../services/storage';
import { githubSyncService } from '../services/githubSync';
import { ConfirmModal } from './ConfirmModal';
import { GitHubSyncModal } from './GitHubSyncModal';
import { 
  BookOpen, PlusCircle, Search, Clock, Award, 
  CheckCircle2, ArrowRight, Edit3, Trash2, Download, Upload, 
  Sparkles, Layers, GraduationCap, FileCode, Check, RotateCcw,
  ShieldCheck, UserPlus, Users, Github
} from 'lucide-react';

interface DashboardViewProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  onRefreshData: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentUser,
  onNavigate,
  onRefreshData,
}) => {
  const isTeacher = currentUser.role === 'teacher';
  const modules = storageService.getModules();
  const submissions = storageService.getSubmissions();
  const studentSubmissions = storageService.getStudentSubmissions(currentUser.id);
  const allUsers = storageService.getUsers();
  const teachers = allUsers.filter(u => u.role === 'teacher');
  const students = allUsers.filter(u => u.role === 'student');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [moduleToDelete, setModuleToDelete] = useState<{ id: string; title: string } | null>(null);
  const [isResettingModal, setIsResettingModal] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Filter modules
  const filteredModules = modules.filter(m => {
    const matchesSearch = 
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      m.subject.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesSubject = selectedSubject === 'all' || m.subject === selectedSubject;
    return matchesSearch && matchesSubject;
  });

  // Calculate stats for student
  const completedModuleIds = new Set(studentSubmissions.map(s => s.moduleId));
  const studentAverage = studentSubmissions.length > 0
    ? Math.round(studentSubmissions.reduce((acc, s) => acc + s.percentage, 0) / studentSubmissions.length)
    : 0;

  // Handlers for teacher
  const confirmDeleteModule = () => {
    if (!moduleToDelete) return;
    const title = moduleToDelete.title;
    storageService.deleteModule(moduleToDelete.id);
    onRefreshData();
    setModuleToDelete(null);
    setToastMessage(`La página "${title}" ha sido eliminada con éxito.`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleExport = () => {
    const jsonStr = storageService.exportData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aulavirtual-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = storageService.importData(content);
      setImportStatus(res.message);
      if (res.success) {
        onRefreshData();
      }
      setTimeout(() => setImportStatus(null), 4000);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Distinct subjects
  const subjects = ['all', ...Array.from(new Set(modules.map(m => m.subject)))];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900 text-white shadow-sm">
        <div className="absolute inset-0 z-0">
          <img
            src="/src/assets/images/hero_education_classroom_1790464310998.jpg"
            alt="Aula de estudio"
            className="w-full h-full object-cover opacity-25"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/85 to-indigo-950/60" />
        </div>

        <div className="relative z-10 p-6 sm:p-8 md:p-10 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-medium text-indigo-300 mb-2">
            <span>{isTeacher ? 'Panel de Control Docente' : 'Portal de Aprendizaje'}</span>
            <span aria-hidden="true">·</span>
            <span>Semestre Activo 2026</span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white text-balance">
            {isTeacher 
              ? `Hola, ${currentUser.name}. Gestiona tus clases y actividades.` 
              : `Bienvenida, ${currentUser.name}. Tienes actividades listas para realizar.`}
          </h1>

          <p className="mt-2.5 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
            {isTeacher
              ? 'Diseña nuevas páginas interactivas, sube archivos HTML independientes a GitHub Pages y consulta las respuestas de tus alumnos en tiempo real.'
              : 'Explora los módulos asignados por tu profesor, resuelve los ejercicios prácticos y recibe retroalimentación inmediata.'}
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {isTeacher ? (
              <>
                <button
                  onClick={() => onNavigate({ type: 'module-editor' })}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-medium rounded-lg shadow-sm transition-colors flex items-center gap-2"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Diseñar nueva página de ejercicios</span>
                </button>
                <button
                  onClick={() => onNavigate({ type: 'teachers-manager' })}
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs sm:text-sm font-bold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  title="Panel de Administrador para poner o quitar profesores"
                >
                  <ShieldCheck className="w-4 h-4 text-slate-950" />
                  <span>Administrador: Profesores</span>
                </button>
                <button
                  onClick={() => setIsSyncModalOpen(true)}
                  className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-900 border border-slate-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-2"
                  title="Sincronizar y guardar ejercicios HTML y usuarios con GitHub"
                >
                  <Github className="w-4 h-4 text-emerald-400" />
                  <span>Sincronizar con GitHub</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4 text-xs sm:text-sm text-indigo-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  {completedModuleIds.size} de {modules.length} módulos completados
                </span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-semibold text-white">
                  Promedio: {studentAverage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Admin Action Callout Banner */}
      {isTeacher && (
        <div className="bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-slate-50 border border-amber-200/90 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900 tracking-tight">
                  Panel de Administrador del Centro
                </span>
                <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                  {teachers.length} docentes registrados
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                Da de alta a nuevos profesores con sus credenciales de acceso o retira del claustro a docentes que ya no impartan clases.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate({ type: 'teachers-manager' })}
            className="px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 shrink-0 self-start sm:self-auto cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Poner o Quitar Profesor</span>
          </button>
        </div>
      )}

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isTeacher ? (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Páginas de Ejercicios</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {modules.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Disponibles para alumnos</div>
            </div>

            <div 
              onClick={() => onNavigate({ type: 'teachers-manager' })}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 hover:bg-amber-50/20 cursor-pointer transition-all group"
              title="Ir a gestionar profesores"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-500">Profesores Activos</div>
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
                {teachers.length}
              </div>
              <div className="text-xs text-amber-700 font-medium mt-1">
                Poner o quitar docentes →
              </div>
            </div>

            <div 
              onClick={() => onNavigate({ type: 'students-manager' })}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-indigo-300 hover:bg-indigo-50/20 cursor-pointer transition-all group"
              title="Ir a gestionar alumnos"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-500">Alumnos Registrados</div>
                <Users className="w-3.5 h-3.5 text-indigo-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {students.length}
              </div>
              <div className="text-xs text-indigo-700 font-medium mt-1">
                Gestionar accesos →
              </div>
            </div>

            <div 
              onClick={() => onNavigate({ type: 'submissions' })}
              className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-emerald-300 hover:bg-emerald-50/20 cursor-pointer transition-all group"
              title="Ir a ver entregas y notas"
            >
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-slate-500">Entregas Recibidas</div>
                <Award className="w-3.5 h-3.5 text-emerald-500 group-hover:scale-110 transition-transform" />
              </div>
              <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
                {submissions.length}
              </div>
              <div className="text-xs text-emerald-700 font-medium mt-1">
                Ver calificaciones →
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Módulos Activos</div>
              <div className="text-2xl font-bold text-slate-900 mt-1 font-mono tabular-nums">
                {modules.length}
              </div>
              <div className="text-xs text-slate-400 mt-1">Para tu curso</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Completados</div>
              <div className="text-2xl font-bold text-emerald-600 mt-1 font-mono tabular-nums">
                {completedModuleIds.size}
              </div>
              <div className="text-xs text-slate-400 mt-1">Con nota registrada</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Pendientes</div>
              <div className="text-2xl font-bold text-amber-600 mt-1 font-mono tabular-nums">
                {Math.max(0, modules.length - completedModuleIds.size)}
              </div>
              <div className="text-xs text-slate-400 mt-1">Por realizar</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-xs font-medium text-slate-500">Tu Calificación Media</div>
              <div className="text-2xl font-bold text-indigo-600 mt-1 font-mono tabular-nums">
                {studentSubmissions.length > 0 ? `${studentAverage}%` : '—'}
              </div>
              <div className="text-xs text-slate-400 mt-1">
                {studentSubmissions.length > 0 ? 'Desempeño global' : 'Sin entregas aún'}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Teacher Backup / Migration Toolbar */}
      {isTeacher && (
        <div className="bg-slate-50 border border-slate-200/90 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Copia de Seguridad & Portabilidad:</span>
            {' '}Descarga todos los ejercicios y notas en un archivo JSON o impórtalo en cualquier momento.
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Exportar JSON</span>
            </button>

            <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5" />
              <span>Importar JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={() => setIsResettingModal(true)}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
              title="Restablecer ejercicios y datos originales de demostración"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Restablecer Ejemplos</span>
            </button>
          </div>
        </div>
      )}

      {/* Import feedback notice */}
      {importStatus && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 text-xs text-indigo-800 rounded-lg">
          {importStatus}
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-slate-900 tracking-tight">
              Páginas de Actividades y Módulos
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona una materia o lección para comenzar los ejercicios
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por tema o título..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
          </div>
        </div>

        {/* Category tabs (Interactive segmented controls as allowed by Section 1.A) */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {subjects.map(subj => (
            <button
              key={subj}
              onClick={() => setSelectedSubject(subj)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                selectedSubject === subj
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200/80'
              }`}
            >
              {subj === 'all' ? 'Todas las Materias' : subj}
            </button>
          ))}
        </div>
      </div>

      {/* Module Cards Grid */}
      {filteredModules.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200/80">
          <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800">No se encontraron páginas</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            No hay ejercicios que coincidan con la búsqueda. Prueba seleccionando otra categoría o crea uno nuevo.
          </p>
          {isTeacher && (
            <button
              onClick={() => onNavigate({ type: 'module-editor' })}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors inline-flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Diseñar la primera actividad</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((module) => {
            const submission = studentSubmissions.find(s => s.moduleId === module.id);
            const isCompleted = !!submission;

            return (
              <div
                key={module.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5">
                  {/* Clean unboxed metadata with typographic separators (anti-slop rule Section 1.A) */}
                  <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-indigo-700">{module.subject}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{module.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{module.estimatedMinutes} min</span>
                    {(module.htmlContent || module.externalUrl) && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-teal-700 font-semibold">HTML Interactivo</span>
                      </>
                    )}
                  </div>

                  <h3 className="text-base font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {module.title}
                  </h3>

                  <p className="text-xs text-slate-600 mt-2 line-clamp-2 leading-relaxed">
                    {module.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-slate-400" />
                      {module.exercises.length} {module.exercises.length === 1 ? 'ejercicio' : 'ejercicios'}
                    </span>

                    {/* Student score indicator (unboxed) */}
                    {!isTeacher && isCompleted && (
                      <span className="font-medium text-emerald-700 flex items-center gap-1 font-mono tabular-nums">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Nota: {submission.score}/{submission.maxScore} ({submission.percentage}%)
                      </span>
                    )}

                    {!isTeacher && !isCompleted && (
                      <span className="text-amber-700 font-medium">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>

                {/* Card footer actions */}
                <div className="px-5 py-3 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => onNavigate({ type: 'module-runner', moduleId: module.id })}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors flex items-center gap-1.5"
                  >
                    <span>{isTeacher ? 'Probar como Alumno' : (isCompleted ? 'Revisar / Reintentar' : 'Hacer Ejercicios')}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>

                  {isTeacher && (
                    <div className="flex items-center gap-1">
                      {module.htmlContent && (
                        <button
                          type="button"
                          onClick={() => githubSyncService.downloadHtmlFile(module.htmlFileName || `${module.slug}.html`, module.htmlContent!)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                          title="Descargar copia del archivo HTML interactivo"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onNavigate({ type: 'module-editor', moduleId: module.id })}
                        className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
                        title="Editar ejercicios de esta página"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setModuleToDelete({ id: module.id, title: module.title })}
                        className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Eliminar esta página de ejercicios"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Floating success toast notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* In-app confirmation modal (100% iframe safe, avoids window.confirm) */}
      <ConfirmModal
        isOpen={!!moduleToDelete}
        title="¿Eliminar página de ejercicios?"
        description={`¿Estás seguro de eliminar "${moduleToDelete?.title}"? Se borrará del panel y tus alumnos ya no la tendrán asignada.`}
        confirmText="Sí, eliminar página"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteModule}
        onCancel={() => setModuleToDelete(null)}
      />

      {/* Reset confirmation modal */}
      <ConfirmModal
        isOpen={isResettingModal}
        title="¿Restablecer datos de ejemplo?"
        description="Esta acción restablecerá los módulos, ejercicios y usuarios a los valores predeterminados originales."
        confirmText="Restablecer"
        cancelText="Cancelar"
        isDestructive={false}
        onConfirm={() => {
          storageService.resetDefaults();
          onRefreshData();
          setIsResettingModal(false);
          setToastMessage('Datos restablecidos a los ejemplos iniciales.');
          setTimeout(() => setToastMessage(null), 3500);
        }}
        onCancel={() => setIsResettingModal(false)}
      />

      {/* GitHub Sync Modal */}
      <GitHubSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataUpdated={onRefreshData}
      />
    </div>
  );
};
