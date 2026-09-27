import React, { useState } from 'react';
import { User } from '../types';
import { storageService } from '../services/storage';
import { GraduationCap, ShieldCheck, KeyRound, User as UserIcon, UserPlus, ArrowRight, CheckCircle2, Sparkles } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [gradeGroup, setGradeGroup] = useState('3º ESO - Grupo A');
  const [error, setError] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    // 1. Direct Administrator Login (Admin / nimda) - works guaranteed in all environments
    if (cleanUser === 'admin' && cleanPass === 'nimda') {
      const adminUser: User = {
        id: 'user-admin',
        username: 'admin',
        password: 'nimda',
        name: 'Administrador Principal',
        role: 'teacher',
        gradeGroup: 'Administración del Centro',
      };
      const users = storageService.getUsers();
      if (!users.some(u => u.username.toLowerCase() === 'admin')) {
        users.unshift(adminUser);
        storageService.saveUsers(users);
      }
      storageService.setCurrentUser(adminUser);
      onLoginSuccess(adminUser);
      return;
    }

    // 2. Standard user matching (with trimmed comparisons)
    const users = storageService.getUsers();
    const found = users.find(
      u => u.username.trim().toLowerCase() === cleanUser && (u.password || '').trim() === cleanPass
    );

    if (found) {
      storageService.setCurrentUser(found);
      onLoginSuccess(found);
    } else {
      setError('Usuario o contraseña incorrectos. Revisa los datos o usa las credenciales del Administrador (Admin / nimda).');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim() || !fullName.trim()) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    const users = storageService.getUsers();
    const cleanUser = username.trim().toLowerCase();
    if (users.some(u => u.username.toLowerCase() === cleanUser)) {
      setError('El nombre de usuario ya está en uso. Por favor elige otro.');
      return;
    }

    const newUser: User = {
      id: `user-student-${Date.now()}`,
      username: cleanUser,
      password: password.trim(),
      name: fullName.trim(),
      role: 'student',
      gradeGroup: gradeGroup.trim() || 'General',
    };

    storageService.addUser(newUser);
    storageService.setCurrentUser(newUser);
    onLoginSuccess(newUser);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-md bg-white border border-slate-200/80 rounded-2xl shadow-sm p-6 sm:p-8">
        {/* Brand header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-indigo-600 text-white mb-3 shadow-sm">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
            {isRegistering ? 'Crear Cuenta de Alumno' : 'Portal Educativo AulaVirtual'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {isRegistering
              ? 'Regístrate para resolver las actividades preparadas por tu profesor'
              : 'Accede a tus clases, ejercicios interactivos y evaluaciones'}
          </p>
        </div>

        {/* Error notification */}
        {error && (
          <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={isRegistering ? handleRegister : handleLogin} className="space-y-4">
          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellidos del Alumno
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
                />
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Usuario
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={isRegistering ? 'carlos_m' : 'Admin, profesor o alumno1'}
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {isRegistering && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Curso / Grupo Escolar
              </label>
              <input
                type="text"
                value={gradeGroup}
                onChange={e => setGradeGroup(e.target.value)}
                placeholder="Ej. 3º de Secundaria, Grupo B"
                className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Contraseña
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 transition-colors"
              />
              <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            <span>{isRegistering ? 'Crear cuenta y entrar' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Administrator credentials note */}
        {!isRegistering && (
          <div className="mt-4 p-3 rounded-xl bg-amber-50/90 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <div className="font-semibold text-amber-900">Acceso de Administrador:</div>
              <div className="mt-0.5 font-mono text-[11px] text-amber-800 flex items-center gap-2">
                <span>Usuario: <strong className="font-bold">Admin</strong></span>
                <span>·</span>
                <span>Contraseña: <strong className="font-bold">nimda</strong></span>
              </div>
              <p className="text-[11px] text-amber-700 mt-0.5">
                Acceso para gestionar y crear las cuentas del profesorado.
              </p>
            </div>
          </div>
        )}

        {/* Toggle between login and registration */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-center">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            {isRegistering
              ? '¿Ya tienes cuenta? Inicia sesión aquí'
              : '¿Eres alumno nuevo? Crea tu cuenta aquí'}
          </button>
        </div>

        {/* Secure local storage badge */}
        <div className="mt-6 p-3 bg-slate-50 rounded-lg border border-slate-200/60 flex items-start gap-2.5">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-600">
            <span className="font-semibold text-slate-800">Acceso Seguro y Privado:</span>
            {' '}El progreso, entregas y respuestas se almacenan de forma autónoma y protegida en el navegador.
          </div>
        </div>
      </div>
    </div>
  );
};
