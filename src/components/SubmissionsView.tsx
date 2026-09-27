import React, { useState } from 'react';
import { StudentSubmission, User, ViewState } from '../types';
import { storageService } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';
import { ArrowLeft, CheckSquare, Search, Trash2, MessageSquare, Award, Calendar, Check } from 'lucide-react';

interface SubmissionsViewProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
}

export const SubmissionsView: React.FC<SubmissionsViewProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [submissions, setSubmissions] = useState<StudentSubmission[]>(storageService.getSubmissions());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubmission, setSelectedSubmission] = useState<StudentSubmission | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submissionToDelete, setSubmissionToDelete] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const filtered = submissions.filter(
    s =>
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.moduleTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const confirmDeleteSubmission = () => {
    if (!submissionToDelete) return;
    const updated = submissions.filter(s => s.id !== submissionToDelete);
    storageService.saveSubmissions(updated);
    setSubmissions(updated);
    if (selectedSubmission?.id === submissionToDelete) {
      setSelectedSubmission(null);
    }
    setSubmissionToDelete(null);
    setToastMsg('Registro de entrega eliminado.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSaveFeedback = () => {
    if (!selectedSubmission) return;
    const updated = submissions.map(s =>
      s.id === selectedSubmission.id ? { ...s, feedback: feedbackText } : s
    );
    storageService.saveSubmissions(updated);
    setSubmissions(updated);
    setSelectedSubmission(prev => (prev ? { ...prev, feedback: feedbackText } : null));
    setToastMsg('Comentario pedagógico guardado con éxito.');
    setTimeout(() => setToastMsg(null), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <button
            onClick={() => onNavigate({ type: 'dashboard' })}
            className="text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 mb-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver al panel principal</span>
          </button>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            Registro de Calificaciones y Entregas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Supervisa las respuestas, notas automáticas y progreso de tus alumnos en cada página.
          </p>
        </div>

        <div className="relative w-full sm:w-64">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Filtrar por alumno o módulo..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2" />
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Table of Submissions */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Entregas Registradas ({filtered.length})
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No hay entregas registradas que coincidan con la búsqueda.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 overflow-x-auto">
              {filtered.map(sub => {
                const isSelected = selectedSubmission?.id === sub.id;
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      setSelectedSubmission(sub);
                      setFeedbackText(sub.feedback || '');
                    }}
                    className={`p-4 flex items-center justify-between gap-4 cursor-pointer transition-colors ${
                      isSelected ? 'bg-indigo-50/60' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-slate-900">
                        {sub.studentName}
                      </div>
                      <div className="text-xs text-indigo-700 font-medium mt-0.5">
                        {sub.moduleTitle}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(sub.submittedAt).toLocaleDateString()} {new Date(sub.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-bold text-slate-900 font-mono tabular-nums">
                          {sub.score}/{sub.maxScore} pts
                        </div>
                        <div className={`text-xs font-semibold font-mono tabular-nums ${
                          sub.percentage >= 80 ? 'text-emerald-600' : sub.percentage >= 50 ? 'text-indigo-600' : 'text-amber-600'
                        }`}>
                          {sub.percentage}%
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSubmissionToDelete(sub.id);
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Eliminar entrega"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Submission Detail / Teacher feedback pane */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          {selectedSubmission ? (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-600">
                  Detalle de la Entrega
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  {selectedSubmission.studentName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {selectedSubmission.moduleTitle}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200/70 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Puntaje obtenido:</span>
                  <span className="font-bold text-slate-900 font-mono tabular-nums">
                    {selectedSubmission.score} / {selectedSubmission.maxScore}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Porcentaje:</span>
                  <span className="font-bold text-indigo-600 font-mono tabular-nums">
                    {selectedSubmission.percentage}%
                  </span>
                </div>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-700 mb-2">
                  Respuestas enviadas por el alumno:
                </div>
                <div className="bg-slate-50 rounded-lg p-3 max-h-48 overflow-y-auto space-y-2 border border-slate-200/60 text-xs">
                  {Object.entries(selectedSubmission.answers).map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center border-b border-slate-100 last:border-none pb-1">
                      <span className="text-slate-500 font-mono">{key}:</span>
                      <span className="font-semibold text-slate-800">{String(val)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Comentario / Devolución del Profesor:
                </label>
                <textarea
                  rows={3}
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Escribe observaciones para el alumno..."
                  className="w-full p-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
                <button
                  type="button"
                  onClick={handleSaveFeedback}
                  className="mt-2 w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  Guardar comentario pedagógico
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 text-xs">
              <Award className="w-8 h-8 text-slate-300 mb-2" />
              <span>Haz clic en cualquier entrega de la lista para ver los detalles y las respuestas exactas del alumno.</span>
            </div>
          )}
        </div>
      </div>

      {/* Floating feedback toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs sm:text-sm px-4 py-3 rounded-xl shadow-lg border border-slate-700 flex items-center gap-2.5 animate-in slide-in-from-bottom-5">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Confirmation modal */}
      <ConfirmModal
        isOpen={!!submissionToDelete}
        title="¿Eliminar registro de entrega?"
        description="Esta acción eliminará de forma permanente la entrega del alumno y su calificación."
        confirmText="Eliminar entrega"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteSubmission}
        onCancel={() => setSubmissionToDelete(null)}
      />
    </div>
  );
};
