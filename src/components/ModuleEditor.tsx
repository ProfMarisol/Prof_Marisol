import React, { useState } from 'react';
import { ExerciseItem, ExerciseType, ModulePage, User, ViewState } from '../types';
import { storageService } from '../services/storage';
import { githubSyncService } from '../services/githubSync';
import { ConfirmModal } from './ConfirmModal';
import { GitHubSyncModal } from './GitHubSyncModal';
import { HtmlExerciseViewer } from './HtmlExerciseViewer';
import { 
  ArrowLeft, Plus, Trash2, Save, Eye, Layers, 
  HelpCircle, CheckCircle, Info, ExternalLink, Sparkles, Check,
  Upload, Maximize2, FileCode, Paperclip, X, Github, RefreshCw, Download,
  Globe, Lock
} from 'lucide-react';

interface ModuleEditorProps {
  moduleId?: string;
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  onSaved: () => void;
}

export const ModuleEditor: React.FC<ModuleEditorProps> = ({
  moduleId,
  currentUser,
  onNavigate,
  onSaved,
}) => {
  const existingModule = moduleId ? storageService.getModuleById(moduleId) : undefined;

  const [title, setTitle] = useState(existingModule?.title || '');
  const [subject, setSubject] = useState(existingModule?.subject || 'Matemáticas');
  const [description, setDescription] = useState(existingModule?.description || '');
  const [estimatedMinutes, setEstimatedMinutes] = useState(existingModule?.estimatedMinutes || 20);
  const [difficulty, setDifficulty] = useState<'básico' | 'intermedio' | 'avanzado'>(
    existingModule?.difficulty || 'intermedio'
  );
  const [externalUrl, setExternalUrl] = useState(existingModule?.externalUrl || '');
  const [theoryMarkdown, setTheoryMarkdown] = useState(existingModule?.theoryMarkdown || '');
  const [htmlContent, setHtmlContent] = useState<string>(existingModule?.htmlContent || '');
  const [htmlFileName, setHtmlFileName] = useState<string>(existingModule?.htmlFileName || '');
  const [htmlFileSize, setHtmlFileSize] = useState<string>('');
  const [fullScreenPreviewActive, setFullScreenPreviewActive] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isPublished, setIsPublished] = useState<boolean>(existingModule?.isPublished !== false);
  
  const [exercises, setExercises] = useState<ExerciseItem[]>(
    existingModule?.exercises || [
      {
        id: `ex-${Date.now()}-1`,
        type: 'short-answer',
        prompt: '',
        instructions: 'Escribe la respuesta o resultado numérico.',
        correctAnswer: '',
        points: 2,
        hint: '',
        explanation: '',
      },
    ]
  );

  const [validationError, setValidationError] = useState<string | null>(null);
  const [editorToast, setEditorToast] = useState<string | null>(null);
  const [isDeletingModule, setIsDeletingModule] = useState(false);

  const handleUploadHtml = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      setValidationError('Por favor selecciona un archivo con extensión .html o .htm');
      return;
    }

    const sizeKb = (file.size / 1024).toFixed(1) + ' KB';
    setHtmlFileSize(sizeKb);

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setHtmlContent(content);
      setHtmlFileName(file.name);
      setValidationError(null);

      // Auto-populate title if empty
      if (!title.trim()) {
        const titleMatch = content.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch && titleMatch[1]?.trim()) {
          setTitle(titleMatch[1].trim());
        } else {
          const cleanName = file.name.replace(/\.(html|htm)$/i, '').replace(/[-_]+/g, ' ');
          setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));
        }
      }

      setEditorToast(`Archivo "${file.name}" cargado. ¡Puedes verlo a pantalla completa!`);
      setTimeout(() => setEditorToast(null), 3500);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleRemoveHtml = () => {
    setHtmlContent('');
    setHtmlFileName('');
    setHtmlFileSize('');
    setEditorToast('Archivo HTML eliminado de la página.');
    setTimeout(() => setEditorToast(null), 2500);
  };

  const handleAddExercise = (type: ExerciseType = 'short-answer') => {
    const newEx: ExerciseItem = {
      id: `ex-${Date.now()}-${exercises.length + 1}`,
      type,
      prompt: '',
      instructions: type === 'open-question' ? 'Desarrolla tu respuesta de forma argumentada.' : '',
      points: 2,
      correctAnswer: '',
      hint: '',
      explanation: '',
    };
    setExercises([...exercises, newEx]);
    setValidationError(null);
  };

  const handleRemoveExercise = (index: number) => {
    const updated = [...exercises];
    updated.splice(index, 1);
    setExercises(updated);
    setValidationError(null);
    setEditorToast(`Ejercicio #${index + 1} eliminado.`);
    setTimeout(() => setEditorToast(null), 2500);
  };

  const handleDeleteEntireModule = () => {
    if (!existingModule) return;
    storageService.deleteModule(existingModule.id);
    onSaved();
    onNavigate({ type: 'dashboard' });
  };

  const handleUpdateExercise = (index: number, updates: Partial<ExerciseItem>) => {
    const updated = [...exercises];
    updated[index] = { ...updated[index], ...updates };
    setExercises(updated);
  };

  const handleSave = async (e: React.FormEvent, syncDirectlyToGitHub = false) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Por favor ingresa un título para la página de ejercicios.');
      return;
    }

    // Filter out exercises that have empty prompt if an HTML file is provided
    const validExercises = exercises.filter(ex => ex.prompt.trim().length > 0);

    // If no HTML file and no written exercises, error
    if (validExercises.length === 0 && !htmlContent.trim() && !externalUrl.trim()) {
      setValidationError('Debes incluir al menos una pregunta escrita o subir un archivo HTML interactivo.');
      return;
    }

    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const moduleToSave: ModulePage = {
      id: existingModule?.id || `mod-${Date.now()}`,
      title: title.trim(),
      slug: slug || 'actividad',
      subject: subject.trim(),
      description: description.trim(),
      estimatedMinutes: Number(estimatedMinutes) || 15,
      difficulty,
      isPublished,
      author: currentUser.name,
      createdAt: existingModule?.createdAt || new Date().toISOString().split('T')[0],
      theoryMarkdown: theoryMarkdown.trim(),
      externalUrl: externalUrl.trim() || undefined,
      htmlContent: htmlContent.trim() || undefined,
      htmlFileName: htmlFileName.trim() || undefined,
      exercises: validExercises,
    };

    setIsSaving(true);
    storageService.saveOrUpdateModule(moduleToSave);

    const ghConfig = githubSyncService.getConfig();
    const hasGitHubToken = !!ghConfig.token?.trim();

    if (syncDirectlyToGitHub || hasGitHubToken) {
      if (!hasGitHubToken) {
        setIsSaving(false);
        setIsSyncModalOpen(true);
        return;
      }

      setEditorToast('Guardando y sincronizando con GitHub...');
      try {
        // 1. Push database with all modules and HTML contents to GitHub
        await githubSyncService.pushToGitHub(
          ghConfig,
          `Guardar módulo: ${title.trim()} [AulaVirtual]`
        );

        // 2. If an HTML file was uploaded, also commit it as a standalone HTML file in public/ejercicios/
        if (htmlContent.trim()) {
          const cleanName = (htmlFileName.trim() || `${slug}.html`).replace(/[^a-zA-Z0-9_.-]/g, '_');
          await githubSyncService.saveHtmlExerciseToGitHub(cleanName, htmlContent);
        }

        setEditorToast('¡Página de ejercicios y archivo HTML guardados en GitHub con éxito!');
      } catch (err: any) {
        setEditorToast('Guardado localmente. Error en GitHub: ' + (err?.message || 'Revisa la conexión'));
      }
    } else {
      setEditorToast('Página guardada localmente.');
    }

    setIsSaving(false);
    onSaved();
    setTimeout(() => {
      onNavigate({ type: 'dashboard' });
    }, 600);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate({ type: 'dashboard' })}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancelar y volver</span>
        </button>

        <span className="text-xs text-slate-400">
          Diseñador de Páginas Educativas
        </span>
      </div>

      <form onSubmit={handleSave} className="space-y-8">
        {/* Title and metadata card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
          <div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              {existingModule ? 'Editar Página de Ejercicios' : 'Crear Nueva Página de Ejercicios'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Esta página estará accesible en la pantalla principal para que tus alumnos completen las actividades.
            </p>
          </div>

          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium rounded-lg">
              {validationError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Título de la Página / Módulo *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Ej. Taller Práctico de Genética y Leyes de Mendel"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Materia / Asignatura
              </label>
              <input
                type="text"
                value={subject}
                onChange={e => setSubject(e.target.value)}
                placeholder="Ej. Matemáticas, Lengua, Historia, Física..."
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dificultad
                </label>
                <select
                  value={difficulty}
                  onChange={e => setDifficulty(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                >
                  <option value="básico">Básico</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minutos est.
                </label>
                <input
                  type="number"
                  min="5"
                  max="180"
                  value={estimatedMinutes}
                  onChange={e => setEstimatedMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción para los alumnos
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Breve resumen de los contenidos y competencias a evaluar..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Publication and Visibility control */}
            <div className="sm:col-span-2 p-4 bg-slate-50/80 border border-slate-200 rounded-xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                    isPublished ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isPublished ? <Globe className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>Publicar acceso a los alumnos</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isPublished ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-amber-100 text-amber-800 border border-amber-200'
                      }`}>
                        {isPublished ? 'Visible para alumnos' : 'Oculto / Borrador'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {isPublished 
                        ? 'Los alumnos podrán ver esta actividad en su panel y resolver los ejercicios.' 
                        : 'Solo tú (profesor) podrás ver esta actividad. Los alumnos no tendrán acceso hasta que la actives.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPublished(!isPublished)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors flex items-center gap-2 ${
                    isPublished 
                      ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs' 
                      : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                  }`}
                >
                  {isPublished ? (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Publicado (Visible)</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5" />
                      <span>Oculto (Borrador)</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 pt-4 mt-1">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <label className="block text-xs font-bold text-slate-800">
                    Subir mi propio ejercicio en HTML (.html / .htm)
                  </label>
                  <p className="text-[11px] text-slate-500">
                    Sube cualquier simulador interactivo, canvas, juego o ejercicio web programado por ti para que tus alumnos lo realicen.
                  </p>
                </div>
                {htmlContent && (
                  <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Archivo HTML listo
                  </span>
                )}
              </div>

              {!htmlContent ? (
                <label className="border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/30 hover:bg-indigo-50/60 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 group-hover:bg-indigo-200 text-indigo-600 flex items-center justify-center mb-2.5 transition-colors">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-indigo-700">
                    Haz clic aquí para seleccionar tu archivo HTML
                  </span>
                  <span className="text-[11px] text-slate-500 mt-0.5">
                    Admite archivos .html con Canvas, JavaScript, animaciones, cálculos y estilos interactivos
                  </span>
                  <input
                    type="file"
                    accept=".html,.htm"
                    onChange={handleUploadHtml}
                    className="hidden"
                  />
                </label>
              ) : (
                <div className="space-y-3 bg-slate-50 rounded-xl p-4 border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center shrink-0">
                        <FileCode className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                          {htmlFileName || 'ejercicio.html'}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {htmlFileSize ? `${htmlFileSize} · ` : ''}Listo para visualización completa
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFullScreenPreviewActive(true)}
                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
                        title="Ver ejercicio a pantalla completa"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                        <span>Pantalla Completa</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => githubSyncService.downloadHtmlFile(htmlFileName || 'ejercicio.html', htmlContent)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                        title="Descargar copia del archivo HTML"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar HTML</span>
                      </button>

                      <label className="px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Reemplazar</span>
                        <input
                          type="file"
                          accept=".html,.htm"
                          onChange={handleUploadHtml}
                          className="hidden"
                        />
                      </label>

                      <button
                        type="button"
                        onClick={handleRemoveHtml}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Quitar archivo HTML"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-[11px] text-slate-600 px-1">
                    <Github className="w-3.5 h-3.5 text-slate-700" />
                    <span>El contenido HTML se guardará en GitHub para que esté disponible en cualquier ordenador conectado a la plataforma.</span>
                  </div>

                  {/* Embedded Live Preview with Full-Screen Button */}
                  <div>
                    <div className="text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
                      <span>Vista previa interactiva del ejercicio:</span>
                      <span className="text-[11px] text-slate-400">Interactúa aquí o amplía a pantalla completa</span>
                    </div>
                    <HtmlExerciseViewer
                      title={title || htmlFileName}
                      htmlContent={htmlContent}
                      fileName={htmlFileName}
                      initialFullScreen={fullScreenPreviewActive}
                      onCloseFullScreen={() => setFullScreenPreviewActive(false)}
                      heightClass="h-[360px]"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                O bien enlaza una ruta HTML existente en GitHub Pages (Opcional)
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={externalUrl}
                  onChange={e => setExternalUrl(e.target.value)}
                  placeholder="Ej. ./ejercicios/mi-simulador.html o https://..."
                  className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <ExternalLink className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Si prefieres subir el archivo manualmente a tu repositorio en GitHub Pages (por ejemplo dentro de <code>public/ejercicios/</code>), puedes escribir aquí la ruta.
              </p>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Introducción Teórica / Notas de Estudio (Opcional)
              </label>
              <textarea
                rows={3}
                value={theoryMarkdown}
                onChange={e => setTheoryMarkdown(e.target.value)}
                placeholder="Fórmulas, texto de lectura, instrucciones o conceptos que los alumnos deben leer antes de responder los ejercicios..."
                className="w-full px-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>
          </div>
        </div>

        {/* Exercises Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              <span>Ejercicios Diseñados ({exercises.length})</span>
            </h2>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => handleAddExercise('short-answer')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Añadir ejercicio con respuesta directa o numérica"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Respuesta Directa</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddExercise('open-question')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Añadir pregunta de desarrollo o redacción"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Pregunta de Desarrollo</span>
              </button>
              <button
                type="button"
                onClick={() => handleAddExercise('fill-blank')}
                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-medium rounded-lg transition-colors flex items-center gap-1"
                title="Añadir ejercicio para rellenar espacio"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Rellenar Espacio</span>
              </button>
            </div>
          </div>

          <div className="space-y-5">
            {exercises.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-slate-300 p-8 text-center space-y-3">
                <Layers className="w-8 h-8 text-slate-300 mx-auto" />
                <h3 className="text-sm font-semibold text-slate-800">
                  No hay ejercicios en esta página
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Selecciona el tipo de ejercicio práctico que deseas añadir:
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleAddExercise('short-answer')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    + Respuesta Directa / Numérica
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddExercise('open-question')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    + Pregunta de Desarrollo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddExercise('fill-blank')}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-lg transition-colors"
                  >
                    + Rellenar espacio en blanco
                  </button>
                </div>
              </div>
            ) : (
              exercises.map((ex, index) => (
                <div
                  key={ex.id}
                  className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4"
                >
                  {/* Header of exercise */}
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-xs text-indigo-700">
                        Ejercicio #{index + 1}
                      </span>

                      <select
                        value={ex.type}
                        onChange={e => {
                          const newType = e.target.value as ExerciseType;
                          handleUpdateExercise(index, { type: newType });
                        }}
                        className="px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md font-medium text-slate-800"
                      >
                        <option value="short-answer">Respuesta Directa / Numérica</option>
                        <option value="open-question">Pregunta de Desarrollo</option>
                        <option value="fill-blank">Rellenar espacio</option>
                        {ex.type === 'multiple-choice' && (
                          <option value="multiple-choice">Opción Múltiple (Herencia)</option>
                        )}
                        {ex.type === 'true-false' && (
                          <option value="true-false">Verdadero / Falso</option>
                        )}
                      </select>

                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <span>Puntos:</span>
                        <input
                          type="number"
                          min="1"
                          max="20"
                          value={ex.points}
                          onChange={e => handleUpdateExercise(index, { points: Number(e.target.value) || 1 })}
                          className="w-12 px-1.5 py-0.5 text-xs bg-slate-50 border border-slate-200 rounded text-center"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveExercise(index)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Eliminar este ejercicio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Question Prompt */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Enunciado de la Pregunta / Problema *
                    </label>
                    <input
                      type="text"
                      required
                      value={ex.prompt}
                      onChange={e => handleUpdateExercise(index, { prompt: e.target.value })}
                      placeholder="Ej. ¿Cuál es el resultado de...?"
                      className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                    />
                  </div>

                  {/* Specific configs by type */}
                  {ex.type === 'multiple-choice' && (
                    <div className="space-y-2 bg-slate-50/70 p-3.5 rounded-lg border border-slate-200/60">
                      <div className="text-xs font-semibold text-slate-700 mb-1">
                        Opciones y Respuesta Correcta:
                      </div>
                      {(ex.options || []).map((opt, optIndex) => (
                        <div key={optIndex} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-opt-${ex.id}`}
                            checked={ex.correctAnswer === opt}
                            onChange={() => handleUpdateExercise(index, { correctAnswer: opt })}
                            className="w-4 h-4 text-indigo-600"
                            title="Marcar como respuesta correcta"
                          />
                          <input
                            type="text"
                            value={opt}
                            onChange={e => {
                              const newOpts = [...(ex.options || [])];
                              const oldVal = newOpts[optIndex];
                              newOpts[optIndex] = e.target.value;
                              const newCorrect = ex.correctAnswer === oldVal ? e.target.value : ex.correctAnswer;
                              handleUpdateExercise(index, { options: newOpts, correctAnswer: newCorrect });
                            }}
                            placeholder={`Opción ${optIndex + 1}`}
                            className="flex-1 px-2.5 py-1 text-xs bg-white border border-slate-200 rounded"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if ((ex.options || []).length <= 2) return;
                              const newOpts = (ex.options || []).filter((_, i) => i !== optIndex);
                              handleUpdateExercise(index, { options: newOpts });
                            }}
                            className="text-xs text-slate-400 hover:text-rose-500 px-1"
                          >
                            ✕
                          </button>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => {
                          const newOpts = [...(ex.options || []), `Nueva opción ${(ex.options || []).length + 1}`];
                          handleUpdateExercise(index, { options: newOpts });
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium pt-1 block"
                      >
                        + Añadir otra opción
                      </button>
                    </div>
                  )}

                  {ex.type === 'true-false' && (
                    <div className="bg-slate-50/70 p-3 rounded-lg border border-slate-200/60 flex items-center gap-4 text-xs">
                      <span className="font-semibold text-slate-700">Respuesta correcta esperada:</span>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`tf-${ex.id}`}
                          checked={String(ex.correctAnswer) === 'true'}
                          onChange={() => handleUpdateExercise(index, { correctAnswer: 'true' })}
                          className="text-indigo-600"
                        />
                        <span>Verdadero</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="radio"
                          name={`tf-${ex.id}`}
                          checked={String(ex.correctAnswer) === 'false'}
                          onChange={() => handleUpdateExercise(index, { correctAnswer: 'false' })}
                          className="text-indigo-600"
                        />
                        <span>Falso</span>
                      </label>
                    </div>
                  )}

                  {(ex.type === 'fill-blank' || ex.type === 'short-answer') && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Respuesta exacta o valor numérico esperado *
                      </label>
                      <input
                        type="text"
                        required
                        value={String(ex.correctAnswer || '')}
                        onChange={e => handleUpdateExercise(index, { correctAnswer: e.target.value })}
                        placeholder="Ej. 280 o fotosíntesis"
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  )}

                  {ex.type === 'open-question' && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Instrucciones o guía de respuesta para los alumnos
                      </label>
                      <textarea
                        rows={2}
                        value={ex.instructions || ''}
                        onChange={e => handleUpdateExercise(index, { instructions: e.target.value })}
                        placeholder="Ej. Explica en 3 a 5 líneas tu razonamiento o incluye los pasos..."
                        className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                      />
                    </div>
                  )}

                  {/* Hint and explanation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Pista didáctica opcional
                      </label>
                      <input
                        type="text"
                        value={ex.hint || ''}
                        onChange={e => handleUpdateExercise(index, { hint: e.target.value })}
                        placeholder="Ej. Fíjate en el exponente..."
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-500 mb-1">
                        Explicación o resolución didáctica
                      </label>
                      <input
                        type="text"
                        value={ex.explanation || ''}
                        onChange={e => handleUpdateExercise(index, { explanation: e.target.value })}
                        placeholder="Ej. Paso a paso: 4 + (2 × 9) = 22..."
                        className="w-full px-2.5 py-1 text-xs bg-slate-50 border border-slate-200 rounded"
                      />
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3 sticky bottom-4 z-20 shadow-sm">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => onNavigate({ type: 'dashboard' })}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
            >
              Cancelar
            </button>

            {existingModule && (
              <button
                type="button"
                onClick={() => setIsDeletingModule(true)}
                className="px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Eliminar toda esta página</span>
              </button>
            )}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              disabled={isSaving}
              onClick={(e) => handleSave(e, true)}
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
              title="Guardar y subir tanto el módulo como el archivo HTML directamente a GitHub"
            >
              <Github className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? 'Guardando en GitHub...' : 'Guardar y Subir a GitHub'}</span>
            </button>

            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Página</span>
            </button>
          </div>
        </div>
      </form>

      {/* Floating toast */}
      {editorToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{editorToast}</span>
        </div>
      )}

      {/* Confirmation modal for deleting the entire page */}
      <ConfirmModal
        isOpen={isDeletingModule}
        title="¿Eliminar esta página de ejercicios por completo?"
        description={`Se eliminará "${title || 'esta página'}" y todos sus ejercicios. Esta acción no se puede deshacer.`}
        confirmText="Eliminar página"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={handleDeleteEntireModule}
        onCancel={() => setIsDeletingModule(false)}
      />

      {/* GitHub Sync Modal */}
      <GitHubSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onDataUpdated={onSaved}
      />
    </div>
  );
};
