import React, { useState } from 'react';
import { User, ViewState } from '../types';
import { storageService } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';
import { 
  ArrowLeft, ShieldCheck, UserPlus, Users, Key, Download, 
  Trash2, CheckCircle2, AlertCircle, Sparkles, BookOpen 
} from 'lucide-react';

interface TeachersManagerProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
}

export const TeachersManager: React.FC<TeachersManagerProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const teachers = users.filter(u => u.role === 'teacher');

  const [newName, setNewName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('profe123');
  const [newSubject, setNewSubject] = useState('Matemáticas y Ciencias');
  
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [teacherToDelete, setTeacherToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreateTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const cleanUser = newUsername.trim().toLowerCase();
    const cleanName = newName.trim();
    const cleanPass = newPassword.trim();

    if (!cleanUser || !cleanName || !cleanPass) {
      setFeedbackMsg({ text: 'Por favor completa todos los campos requeridos.', type: 'error' });
      return;
    }

    if (users.some(u => u.username.toLowerCase() === cleanUser)) {
      setFeedbackMsg({ 
        text: `El nombre de usuario "${cleanUser}" ya existe. Por favor elige otro diferente.`, 
        type: 'error' 
      });
      return;
    }

    const newTeacher: User = {
      id: `user-teacher-${Date.now()}`,
      username: cleanUser,
      password: cleanPass,
      name: cleanName,
      role: 'teacher',
      gradeGroup: newSubject.trim() || 'Docente Titular',
    };

    storageService.addUser(newTeacher);
    const updated = storageService.getUsers();
    setUsers(updated);

    setNewName('');
    setNewUsername('');
    setNewPassword('profe123');
    setFeedbackMsg({ 
      text: `¡Profesor/a ${cleanName} registrado correctamente con usuario "${cleanUser}"!`, 
      type: 'success' 
    });
    setTimeout(() => setFeedbackMsg(null), 4000);
  };

  const confirmDeleteTeacher = () => {
    if (!teacherToDelete) return;

    if (teachers.length <= 1) {
      setFeedbackMsg({ 
        text: 'No es posible eliminar al único profesor del centro.', 
        type: 'error' 
      });
      setTeacherToDelete(null);
      return;
    }

    const updated = users.filter(u => u.id !== teacherToDelete.id);
    storageService.saveUsers(updated);
    setUsers(updated);
    setFeedbackMsg({ 
      text: `La cuenta de ${teacherToDelete.name} ha sido eliminada del sistema.`, 
      type: 'success' 
    });
    setTeacherToDelete(null);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  const handleDownloadTeacherRoster = () => {
    let content = 'Nombre,Usuario,Contraseña,Asignatura / Especialidad,Rol\n';
    teachers.forEach(t => {
      content += `"${t.name}","${t.username}","${t.password || ''}","${t.gradeGroup || ''}","Profesor"\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listado-profesores-aulavirtual-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
          
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 tracking-tight">
              Panel de Administrador: Gestión de Profesores
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Como administrador puedes registrar nuevos docentes o retirar cuentas profesorales. Los profesores tienen permiso para diseñar ejercicios, subir HTMLs y evaluar a los alumnos.
          </p>
        </div>

        <button
          onClick={handleDownloadTeacherRoster}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Plantilla Docente (CSV)</span>
        </button>
      </div>

      {/* Global alert / message if any */}
      {feedbackMsg && (
        <div className={`p-4 rounded-xl text-xs flex items-center gap-2.5 border animate-in fade-in ${
          feedbackMsg.type === 'success'
            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
            : 'bg-rose-50 text-rose-800 border-rose-200'
        }`}>
          {feedbackMsg.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span className="font-medium">{feedbackMsg.text}</span>
        </div>
      )}

      {/* Main Grid: Form on left, Teachers List on right */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to Add New Teacher */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-7 h-7 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Poner a un Profesor Nuevo
              </h2>
              <p className="text-[11px] text-slate-500">Crea las credenciales de acceso</p>
            </div>
          </div>

          <form onSubmit={handleCreateTeacher} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellidos del Profesor *
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej. Prof. Marta Rodríguez"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usuario de Login (Sin espacios) *
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="Ej. marta_ciencias"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña Asignada *
              </label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="profe123"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Asignatura / Especialidad
              </label>
              <input
                type="text"
                value={newSubject}
                onChange={e => setNewSubject(e.target.value)}
                placeholder="Ej. Matemáticas, Ciencias, Lengua..."
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>Registrar y Dar de Alta Profesor</span>
            </button>
          </form>
        </div>

        {/* List of Teachers */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs flex flex-col justify-between">
          <div>
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Profesores Activos en el Claustro ({teachers.length})</span>
              </span>
              <span className="text-[11px] text-slate-400">Acceso docente completo</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Profesor</th>
                    <th className="py-3 px-4 font-semibold">Usuario</th>
                    <th className="py-3 px-4 font-semibold">Contraseña</th>
                    <th className="py-3 px-4 font-semibold">Asignatura / Rol</th>
                    <th className="py-3 px-4 font-semibold text-right">Quitar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {teachers.map(teacher => {
                    const isSelf = teacher.id === currentUser.id;
                    return (
                      <tr key={teacher.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900 flex items-center gap-2">
                            <span>{teacher.name}</span>
                            {isSelf && (
                              <span className="text-[10px] bg-indigo-100 text-indigo-700 font-semibold px-1.5 py-0.5 rounded-full">
                                Tu cuenta actual
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono font-medium text-indigo-700">
                          {teacher.username}
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">
                          {teacher.password || '—'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-[11px]">
                            {teacher.gradeGroup || 'Docente Titular'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setTeacherToDelete({ id: teacher.id, name: teacher.name })}
                            disabled={teachers.length <= 1}
                            className={`p-1.5 rounded-md transition-colors ${
                              teachers.length <= 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                            }`}
                            title={
                              teachers.length <= 1
                                ? 'No puedes eliminar al único profesor del centro'
                                : `Quitar a ${teacher.name}`
                            }
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="p-4 bg-slate-50/70 border-t border-slate-100 text-xs text-slate-500 flex items-center justify-between">
            <span>Para iniciar sesión como cualquiera de estos profesores, utiliza su usuario y contraseña en la pantalla de bienvenida.</span>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to Delete Teacher */}
      <ConfirmModal
        isOpen={!!teacherToDelete}
        title="¿Quitar a este profesor del centro?"
        description={`¿Estás seguro de que deseas retirar la cuenta de "${teacherToDelete?.name}"? Esta persona ya no podrá iniciar sesión como profesor ni editar ejercicios.`}
        confirmText="Sí, quitar profesor"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteTeacher}
        onCancel={() => setTeacherToDelete(null)}
      />
    </div>
  );
};
