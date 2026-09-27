import React from 'react';
import { User, ViewState } from '../types';
import { BookOpen, LogOut, PlusCircle, CheckSquare, Users, ArrowLeft, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  currentUser: User | null;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentView,
  onNavigate,
  onLogout,
}) => {
  const isTeacher = currentUser?.role === 'teacher';

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text element wordmark */}
        <button
          onClick={() => onNavigate({ type: 'dashboard' })}
          className="flex items-center gap-2.5 text-left group focus:outline-none"
        >
          <div className="w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-sm group-hover:bg-indigo-700 transition-colors">
            AV
          </div>
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-slate-900 group-hover:text-indigo-600 transition-colors">
              AulaVirtual
            </span>
            <span className="hidden sm:inline-block ml-2 text-xs font-medium text-slate-400">
              GitHub Pages Edition
            </span>
          </div>
        </button>

        {/* Zone 2: Navigation Links */}
        {currentUser && (
          <nav className="hidden md:flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => onNavigate({ type: 'dashboard' })}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                currentView.type === 'dashboard'
                  ? 'text-indigo-600 bg-indigo-50 font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              Módulos y Clases
            </button>

            {isTeacher && (
              <>
                <button
                  onClick={() => onNavigate({ type: 'module-editor' })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView.type === 'module-editor'
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <PlusCircle className="w-4 h-4" />
                  Crear Página
                </button>

                <button
                  onClick={() => onNavigate({ type: 'submissions' })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView.type === 'submissions'
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <CheckSquare className="w-4 h-4" />
                  Calificaciones
                </button>

                <button
                  onClick={() => onNavigate({ type: 'students-manager' })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView.type === 'students-manager'
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Alumnos
                </button>

                <button
                  onClick={() => onNavigate({ type: 'teachers-manager' })}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                    currentView.type === 'teachers-manager'
                      ? 'text-amber-900 bg-amber-100 font-bold border border-amber-300'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                  title="Panel de Administrador para poner o quitar profesores"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <span>Administrador</span>
                </button>
              </>
            )}
          </nav>
        )}

        {/* Zone 3: User Info and Actions */}
        <div className="flex items-center gap-3">
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-slate-800 leading-tight">
                  {currentUser.name}
                </div>
                <div className="text-xs text-slate-500">
                  {currentUser.role === 'teacher' ? 'Docente / Administrador' : 'Estudiante'}
                  {currentUser.gradeGroup ? ` · ${currentUser.gradeGroup}` : ''}
                </div>
              </div>

              <button
                onClick={onLogout}
                title="Cerrar sesión"
                className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                aria-label="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <span className="text-xs font-medium text-slate-500">Acceso Seguro</span>
          )}
        </div>
      </div>

      {/* Mobile nav row */}
      {currentUser && (
        <div className="flex md:hidden overflow-x-auto px-4 py-2 border-t border-slate-100 gap-2 bg-slate-50/70">
          <button
            onClick={() => onNavigate({ type: 'dashboard' })}
            className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
              currentView.type === 'dashboard' ? 'bg-indigo-600 text-white' : 'text-slate-700 bg-white'
            }`}
          >
            Módulos
          </button>
          {isTeacher && (
            <>
              <button
                onClick={() => onNavigate({ type: 'module-editor' })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  currentView.type === 'module-editor' ? 'bg-indigo-600 text-white' : 'text-slate-700 bg-white'
                }`}
              >
                Crear Página
              </button>
              <button
                onClick={() => onNavigate({ type: 'submissions' })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  currentView.type === 'submissions' ? 'bg-indigo-600 text-white' : 'text-slate-700 bg-white'
                }`}
              >
                Calificaciones
              </button>
              <button
                onClick={() => onNavigate({ type: 'students-manager' })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  currentView.type === 'students-manager' ? 'bg-indigo-600 text-white' : 'text-slate-700 bg-white'
                }`}
              >
                Alumnos
              </button>
              <button
                onClick={() => onNavigate({ type: 'teachers-manager' })}
                className={`px-2.5 py-1 text-xs font-medium rounded-md whitespace-nowrap ${
                  currentView.type === 'teachers-manager' ? 'bg-amber-600 text-white font-bold' : 'text-amber-800 bg-amber-50'
                }`}
              >
                Administrador
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};
