import React, { useState } from 'react';
import { User, ViewState } from '../types';
import { storageService } from '../services/storage';
import { ConfirmModal } from './ConfirmModal';
import { ArrowLeft, UserPlus, Users, Key, Download, Trash2, CheckCircle2 } from 'lucide-react';

interface StudentsManagerProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
}

export const StudentsManager: React.FC<StudentsManagerProps> = ({
  currentUser,
  onNavigate,
}) => {
  const [users, setUsers] = useState<User[]>(storageService.getUsers());
  const students = users.filter(u => u.role === 'student');

  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('alumno123');
  const [newName, setNewName] = useState('');
  const [newGrade, setNewGrade] = useState('3º ESO - Grupo A');
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreateStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFeedbackMsg(null);

    const cleanUser = newUsername.trim().toLowerCase();
    if (!cleanUser || !newName.trim() || !newPassword.trim()) return;

    if (users.some(u => u.username.toLowerCase() === cleanUser)) {
      setFeedbackMsg('El nombre de usuario ya existe. Elige otro.');
      return;
    }

    const newStudent: User = {
      id: `user-student-${Date.now()}`,
      username: cleanUser,
      password: newPassword.trim(),
      name: newName.trim(),
      role: 'student',
      gradeGroup: newGrade.trim(),
    };

    storageService.addUser(newStudent);
    const updated = storageService.getUsers();
    setUsers(updated);

    setNewUsername('');
    setNewName('');
    setFeedbackMsg('¡Alumno agregado correctamente!');
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const confirmDeleteStudent = () => {
    if (!studentToDelete) return;
    const updated = users.filter(u => u.id !== studentToDelete.id);
    storageService.saveUsers(updated);
    setUsers(updated);
    setFeedbackMsg(`Cuenta de "${studentToDelete.name}" eliminada.`);
    setStudentToDelete(null);
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleDownloadRoster = () => {
    let content = 'Nombre,Usuario,Contraseña,Grupo\n';
    students.forEach(s => {
      content += `"${s.name}","${s.username}","${s.password || ''}","${s.gradeGroup || ''}"\n`;
    });

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `listado-alumnos-aulavirtual-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
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
            Gestión de Alumnos y Accesos
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Administra las cuentas de usuario y contraseñas para que tus alumnos puedan iniciar sesión en el portal.
          </p>
        </div>

        <button
          onClick={handleDownloadRoster}
          className="px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-medium rounded-lg transition-colors flex items-center gap-2 shadow-xs"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Exportar Listado de Alumnos (CSV)</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form to Add New Student */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs h-fit space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900">
              Registrar Nuevo Alumno
            </h2>
          </div>

          {feedbackMsg && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs rounded-lg">
              {feedbackMsg}
            </div>
          )}

          <form onSubmit={handleCreateStudent} className="space-y-3.5">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre y Apellidos
              </label>
              <input
                type="text"
                required
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="Ej. Mateo Gómez"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre de Usuario (Login)
              </label>
              <input
                type="text"
                required
                value={newUsername}
                onChange={e => setNewUsername(e.target.value)}
                placeholder="Ej. mateo_gomez"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Contraseña Asignada
              </label>
              <input
                type="text"
                required
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="alumno123"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Grupo / Clase
              </label>
              <input
                type="text"
                value={newGrade}
                onChange={e => setNewGrade(e.target.value)}
                placeholder="Ej. 3º ESO - Grupo A"
                className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors mt-2"
            >
              Crear Credenciales de Alumno
            </button>
          </form>
        </div>

        {/* List of Registered Students */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Alumnos en el Aula ({students.length})
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/70 border-b border-slate-200/80 text-slate-500">
                <tr>
                  <th className="py-3 px-4 font-semibold">Nombre</th>
                  <th className="py-3 px-4 font-semibold">Usuario</th>
                  <th className="py-3 px-4 font-semibold">Contraseña</th>
                  <th className="py-3 px-4 font-semibold">Grupo</th>
                  <th className="py-3 px-4 font-semibold text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      {s.name}
                    </td>
                    <td className="py-3 px-4 font-mono text-indigo-700">
                      {s.username}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {s.password}
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {s.gradeGroup || 'General'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setStudentToDelete({ id: s.id, name: s.name })}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        title="Eliminar alumno"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirmation modal */}
      <ConfirmModal
        isOpen={!!studentToDelete}
        title="¿Eliminar alumno?"
        description={`¿Estás seguro de que deseas eliminar la cuenta de ${studentToDelete?.name}? El alumno ya no podrá ingresar con su usuario.`}
        confirmText="Eliminar alumno"
        cancelText="Cancelar"
        isDestructive={true}
        onConfirm={confirmDeleteStudent}
        onCancel={() => setStudentToDelete(null)}
      />
    </div>
  );
};
