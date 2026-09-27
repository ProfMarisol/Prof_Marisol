import React, { useState } from 'react';
import { ModulePage, User, StudentSubmission, ViewState } from '../types';
import { storageService } from '../services/storage';
import { generateSubmissionPDF } from '../services/pdfGenerator';
import { githubSyncService } from '../services/githubSync';
import { HtmlExerciseViewer } from './HtmlExerciseViewer';
import { 
  ArrowLeft, CheckCircle2, XCircle, HelpCircle, 
  RotateCcw, Award, Lightbulb, ExternalLink, BookOpen, Send, Download, FileText, Lock
} from 'lucide-react';

interface ModuleRunnerProps {
  moduleId: string;
  currentUser: User;
  onNavigate: (view: ViewState) => void;
}

export const ModuleRunner: React.FC<ModuleRunnerProps> = ({
  moduleId,
  currentUser,
  onNavigate,
}) => {
  const module = storageService.getModuleById(moduleId);

  if (!module) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-xl font-bold text-slate-800">Página o módulo no encontrado</h2>
        <p className="text-slate-500 text-sm mt-2">La actividad solicitada no existe o fue eliminada.</p>
        <button
          onClick={() => onNavigate({ type: 'dashboard' })}
          className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm"
        >
          Volver al panel principal
        </button>
      </div>
    );
  }

  // Prevent student access if module is unpublished / in draft
  if (currentUser.role === 'student' && module.isPublished === false) {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center">
        <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200 shadow-xs">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Actividad aún no publicada</h2>
        <p className="text-slate-500 text-sm mt-2 leading-relaxed">
          Esta página de ejercicios está en modo borrador y aún no ha sido abierta por el profesor para los alumnos.
        </p>
        <button
          onClick={() => onNavigate({ type: 'dashboard' })}
          className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          Volver a mis actividades
        </button>
      </div>
    );
  }

  // Load existing student submission if any
  const existingSubmissions = storageService.getStudentSubmissions(currentUser.id);
  const currentSubmission = existingSubmissions.find(s => s.moduleId === moduleId);

  const [answers, setAnswers] = useState<Record<string, any>>(
    currentSubmission ? currentSubmission.answers : {}
  );
  const [isSubmitted, setIsSubmitted] = useState<boolean>(!!currentSubmission);
  const [lastSubmission, setLastSubmission] = useState<StudentSubmission | null>(currentSubmission || null);
  const [showHints, setShowHints] = useState<Record<string, boolean>>({});
  const [resultScore, setResultScore] = useState<number>(currentSubmission ? currentSubmission.score : 0);
  const [resultPercentage, setResultPercentage] = useState<number>(currentSubmission ? currentSubmission.percentage : 0);

  const handleSelectAnswer = (exerciseId: string, val: any) => {
    if (isSubmitted) return;
    setAnswers(prev => ({
      ...prev,
      [exerciseId]: val,
    }));
  };

  const toggleHint = (exerciseId: string) => {
    setShowHints(prev => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  const calculateResults = () => {
    let earnedPoints = 0;
    let totalPoints = 0;

    module.exercises.forEach(ex => {
      totalPoints += ex.points;
      const studentAns = answers[ex.id];

      if (ex.type === 'multiple-choice') {
        if (studentAns === ex.correctAnswer) {
          earnedPoints += ex.points;
        }
      } else if (ex.type === 'true-false') {
        if (String(studentAns) === String(ex.correctAnswer)) {
          earnedPoints += ex.points;
        }
      } else if (ex.type === 'fill-blank' || ex.type === 'short-answer') {
        const cleanStudent = String(studentAns || '').trim().toLowerCase();
        const cleanCorrect = String(ex.correctAnswer || '').trim().toLowerCase();
        if (cleanStudent === cleanCorrect) {
          earnedPoints += ex.points;
        }
      } else if (ex.type === 'open-question') {
        // For open questions in automated run, award points if student provided a thoughtful answer (> 20 chars)
        if (studentAns && String(studentAns).trim().length >= 20) {
          earnedPoints += ex.points;
        }
      }
    });

    const maxScore = totalPoints > 0 ? totalPoints : 10;
    const finalEarned = totalPoints > 0 ? earnedPoints : 10;
    const percentage = Math.round((finalEarned / maxScore) * 100);

    setResultScore(finalEarned);
    setResultPercentage(percentage);
    setIsSubmitted(true);

    // Save to storage
    const newSubmission: StudentSubmission = {
      id: `sub-${Date.now()}`,
      studentId: currentUser.id,
      studentName: currentUser.name,
      moduleId: module.id,
      moduleTitle: module.title,
      answers,
      score: finalEarned,
      maxScore,
      percentage,
      submittedAt: new Date().toISOString(),
      feedback: percentage >= 80 
        ? '¡Excelente trabajo! Has demostrado un dominio notable de los conceptos.' 
        : percentage >= 50 
        ? 'Aprobado. Revisa las explicaciones de las preguntas fallidas para reforzar.' 
        : 'Te sugerimos repasar la teoría y volver a intentarlo.',
    };

    setLastSubmission(newSubmission);
    storageService.addSubmission(newSubmission);

    // If GitHub sync is configured with token, save student submission in their GitHub folder
    githubSyncService.saveStudentSubmissionToGitHub(newSubmission, currentUser, module);
  };

  const handleRetry = () => {
    setIsSubmitted(false);
    setAnswers({});
    setShowHints({});
  };

  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  const totalExercises = module.exercises.length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Navigation header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate({ type: 'dashboard' })}
          className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al panel principal</span>
        </button>

        <div className="text-xs text-slate-500">
          Respondidas: <span className="font-semibold text-slate-800 font-mono tabular-nums">{answeredCount}</span> de{' '}
          <span className="font-semibold text-slate-800 font-mono tabular-nums">{totalExercises}</span>
        </div>
      </div>

      {/* Module Title Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
          <span className="font-semibold text-indigo-700">{module.subject}</span>
          <span aria-hidden="true">·</span>
          <span className="capitalize">{module.difficulty}</span>
          <span aria-hidden="true">·</span>
          <span>{module.estimatedMinutes} minutos estimados</span>
          <span aria-hidden="true">·</span>
          <span>Profesor: {module.author}</span>
        </div>

        <h1 className="font-display text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {module.title}
        </h1>

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {module.description}
        </p>

        {/* Theoretical Notes if provided */}
        {module.theoryMarkdown && (
          <div className="mt-6 p-5 bg-slate-50 border border-slate-200/90 rounded-xl text-xs sm:text-sm text-slate-700 leading-relaxed space-y-2">
            <div className="flex items-center gap-2 font-semibold text-slate-900 text-xs uppercase tracking-wider mb-1">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Material Teórico de Referencia</span>
            </div>
            <div className="whitespace-pre-line text-slate-600">
              {module.theoryMarkdown}
            </div>
          </div>
        )}

        {/* Interactive HTML Exercise (Direct Upload or External URL) with Full-Screen */}
        {(module.htmlContent || module.externalUrl) && (
          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Ejercicio Práctico Interactivo en HTML
              </span>
              <span className="text-xs text-indigo-600 font-medium">
                Pase el cursor o presione "Ver a Pantalla Completa" para ampliar
              </span>
            </div>
            <HtmlExerciseViewer
              title={module.title}
              htmlContent={module.htmlContent}
              externalUrl={module.externalUrl}
              fileName={module.htmlFileName}
              heightClass="h-[520px]"
            />
          </div>
        )}
      </div>

      {/* When the module only contains an interactive HTML exercise without separate quiz items */}
      {module.exercises.length === 0 && (module.htmlContent || module.externalUrl) && !isSubmitted && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky bottom-4 z-20">
          <div className="text-xs text-slate-600">
            Has explorado el ejercicio interactivo. Cuando hayas finalizado la práctica, pulsa el botón para registrar tu entrega.
          </div>
          <button
            type="button"
            onClick={calculateResults}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Marcar actividad como completada</span>
          </button>
        </div>
      )}

      {/* Submission Results Banner */}
      {isSubmitted && (
        <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white ${
              resultPercentage >= 80 ? 'bg-emerald-600' : resultPercentage >= 50 ? 'bg-indigo-600' : 'bg-amber-600'
            }`}>
              <Award className="w-8 h-8" />
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Resultado de tu Entrega
              </div>
              <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
                Calificación: {resultScore} pts ({resultPercentage}%)
              </div>
              <p className="text-xs text-slate-600 mt-0.5">
                {resultPercentage >= 80 
                  ? '¡Excelente! Has alcanzado los objetivos de aprendizaje de esta actividad.'
                  : resultPercentage >= 50
                  ? 'Buen trabajo. Has aprobado la lección.'
                  : 'No has alcanzado la nota mínima. Puedes reintentar las veces que necesites.'}
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => {
                const subToDownload = lastSubmission || currentSubmission;
                if (subToDownload) {
                  generateSubmissionPDF(module, subToDownload, currentUser);
                }
              }}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
              title="Descargar justificante oficial en PDF con tus respuestas y nota"
            >
              <Download className="w-4 h-4" />
              <span>Descargar Comprobante en PDF</span>
            </button>

            <button
              onClick={handleRetry}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reintentar</span>
            </button>
          </div>
        </div>
      )}

      {/* Exercises List */}
      <div className="space-y-6">
        <h2 className="text-base font-bold text-slate-900">
          Ejercicios Prácticos ({module.exercises.length})
        </h2>

        {module.exercises.map((ex, index) => {
          const studentAns = answers[ex.id];
          const isAnswered = studentAns !== undefined && studentAns !== '';
          let isCorrect = false;

          if (isSubmitted) {
            if (ex.type === 'multiple-choice') {
              isCorrect = studentAns === ex.correctAnswer;
            } else if (ex.type === 'true-false') {
              isCorrect = String(studentAns) === String(ex.correctAnswer);
            } else if (ex.type === 'fill-blank' || ex.type === 'short-answer') {
              isCorrect = String(studentAns || '').trim().toLowerCase() === String(ex.correctAnswer || '').trim().toLowerCase();
            } else if (ex.type === 'open-question') {
              isCorrect = String(studentAns || '').trim().length >= 20;
            }
          }

          return (
            <div
              key={ex.id}
              className={`bg-white rounded-xl border p-5 sm:p-6 transition-all ${
                isSubmitted
                  ? isCorrect
                    ? 'border-emerald-300 bg-emerald-50/20'
                    : 'border-rose-300 bg-rose-50/20'
                  : 'border-slate-200 shadow-xs'
              }`}
            >
              {/* Question header */}
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <span className="font-bold text-slate-800">Ejercicio {index + 1}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{ex.points} {ex.points === 1 ? 'punto' : 'puntos'}</span>
                  <span aria-hidden="true">·</span>
                  <span className="capitalize">{ex.type.replace('-', ' ')}</span>
                </div>

                {isSubmitted && (
                  <div className="flex items-center gap-1 text-xs font-semibold">
                    {isCorrect ? (
                      <span className="text-emerald-700 flex items-center gap-1 font-mono">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Correcto (+{ex.points} pts)
                      </span>
                    ) : (
                      <span className="text-rose-700 flex items-center gap-1 font-mono">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        Incorrecto (0 pts)
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Prompt text */}
              <div className="text-sm font-medium text-slate-900 leading-relaxed mb-3">
                {ex.prompt}
              </div>

              {ex.instructions && (
                <div className="text-xs text-slate-500 italic mb-4">
                  {ex.instructions}
                </div>
              )}

              {/* Render by type */}
              <div className="mt-4">
                {ex.type === 'multiple-choice' && ex.options && (
                  <div className="space-y-2">
                    {ex.options.map((opt, optIdx) => {
                      const isSelected = studentAns === opt;
                      const isTargetCorrect = opt === ex.correctAnswer;

                      let optClass = 'border-slate-200 hover:border-slate-300 bg-white text-slate-800';
                      if (isSelected) {
                        optClass = 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-medium';
                      }
                      if (isSubmitted) {
                        if (isTargetCorrect) {
                          optClass = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                        } else if (isSelected && !isTargetCorrect) {
                          optClass = 'border-rose-400 bg-rose-50 text-rose-900';
                        }
                      }

                      return (
                        <label
                          key={optIdx}
                          className={`flex items-center p-3 rounded-lg border cursor-pointer transition-all ${optClass}`}
                        >
                          <input
                            type="radio"
                            name={`ex-${ex.id}`}
                            disabled={isSubmitted}
                            checked={isSelected}
                            onChange={() => handleSelectAnswer(ex.id, opt)}
                            className="w-4 h-4 text-indigo-600 border-slate-300 focus:ring-indigo-500"
                          />
                          <span className="ml-3 text-xs sm:text-sm">{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {ex.type === 'true-false' && (
                  <div className="grid grid-cols-2 gap-3 max-w-sm">
                    {['true', 'false'].map(val => {
                      const isTrue = val === 'true';
                      const label = isTrue ? 'Verdadero' : 'Falso';
                      const isSelected = String(studentAns) === val;
                      const isTargetCorrect = String(ex.correctAnswer) === val;

                      let btnStyle = 'border-slate-200 hover:border-slate-300 bg-white text-slate-700';
                      if (isSelected) {
                        btnStyle = 'border-indigo-600 bg-indigo-50 text-indigo-900 font-semibold';
                      }
                      if (isSubmitted) {
                        if (isTargetCorrect) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-900 font-semibold';
                        } else if (isSelected && !isTargetCorrect) {
                          btnStyle = 'border-rose-400 bg-rose-50 text-rose-900';
                        }
                      }

                      return (
                        <button
                          key={val}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectAnswer(ex.id, val)}
                          className={`py-2.5 px-4 rounded-lg border text-xs sm:text-sm font-medium transition-all ${btnStyle}`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}

                {(ex.type === 'fill-blank' || ex.type === 'short-answer') && (
                  <div className="max-w-md">
                    <input
                      type="text"
                      disabled={isSubmitted}
                      value={studentAns || ''}
                      onChange={e => handleSelectAnswer(ex.id, e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                    />
                  </div>
                )}

                {ex.type === 'open-question' && (
                  <div>
                    <textarea
                      rows={3}
                      disabled={isSubmitted}
                      value={studentAns || ''}
                      onChange={e => handleSelectAnswer(ex.id, e.target.value)}
                      placeholder="Escribe tu respuesta argumentada..."
                      className="w-full p-3 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                    />
                  </div>
                )}
              </div>

              {/* Hint accordions */}
              {ex.hint && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => toggleHint(ex.id)}
                    className="text-xs text-amber-700 hover:text-amber-800 font-medium inline-flex items-center gap-1"
                  >
                    <Lightbulb className="w-3.5 h-3.5" />
                    <span>{showHints[ex.id] ? 'Ocultar pista' : 'Ver pista didáctica'}</span>
                  </button>
                  {showHints[ex.id] && (
                    <div className="mt-1.5 p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-amber-900">
                      💡 {ex.hint}
                    </div>
                  )}
                </div>
              )}

              {/* Feedback and explanation after submission */}
              {isSubmitted && (
                <div className="mt-4 pt-3 border-t border-slate-200/70 text-xs">
                  <div className="font-semibold text-slate-800 mb-1">
                    Explicación del Profesor:
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    {ex.explanation || `Respuesta correcta: ${ex.correctAnswer}`}
                  </p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Submit Action */}
      {!isSubmitted && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm sticky bottom-4 z-20">
          <div className="text-xs text-slate-600">
            Has completado <span className="font-bold text-slate-900 font-mono tabular-nums">{answeredCount}</span> de{' '}
            <span className="font-bold text-slate-900 font-mono tabular-nums">{totalExercises}</span> ejercicios.
            {answeredCount < totalExercises && (
              <span className="text-amber-600 font-medium ml-1">
                (Asegúrate de responder todos los ejercicios)
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={calculateResults}
            className="w-full sm:w-auto px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Enviar respuestas y calificar</span>
          </button>
        </div>
      )}
    </div>
  );
};
