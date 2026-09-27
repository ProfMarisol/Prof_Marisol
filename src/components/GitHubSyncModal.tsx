import React, { useState } from 'react';
import { GitHubSyncConfig } from '../types';
import { githubSyncService } from '../services/githubSync';
import { 
  X, Github, CheckCircle2, AlertCircle, RefreshCw, UploadCloud, 
  DownloadCloud, Key, ShieldCheck, Download, ExternalLink, HelpCircle
} from 'lucide-react';

interface GitHubSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated?: () => void;
}

export const GitHubSyncModal: React.FC<GitHubSyncModalProps> = ({
  isOpen,
  onClose,
  onDataUpdated,
}) => {
  const [config, setConfig] = useState<GitHubSyncConfig>(githubSyncService.getConfig());
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  if (!isOpen) return null;

  const handleSaveConfig = () => {
    githubSyncService.saveConfig(config);
    setStatusMsg({ text: 'Configuración de sincronización guardada.', type: 'info' });
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    githubSyncService.saveConfig(config);
    const result = await githubSyncService.testConnection(config);
    setIsLoading(false);
    setStatusMsg({ text: result.message, type: result.success ? 'success' : 'error' });
  };

  const handlePull = async () => {
    setIsLoading(true);
    setStatusMsg(null);
    githubSyncService.saveConfig(config);
    const result = await githubSyncService.pullFromGitHub(config);
    setIsLoading(false);
    setStatusMsg({ text: result.message, type: result.success ? 'success' : 'error' });
    if (result.success && onDataUpdated) {
      onDataUpdated();
    }
  };

  const handlePush = async () => {
    if (!config.token?.trim()) {
      setStatusMsg({ 
        text: 'Para guardar datos en GitHub necesitas introducir un Token de Acceso Personal (PAT) con permiso de escritura.', 
        type: 'error' 
      });
      return;
    }

    setIsLoading(true);
    setStatusMsg(null);
    githubSyncService.saveConfig(config);
    const result = await githubSyncService.pushToGitHub(config);
    setIsLoading(false);
    setStatusMsg({ text: result.message, type: result.success ? 'success' : 'error' });
  };

  const handleDownloadBackup = () => {
    githubSyncService.downloadDatabaseFile();
    setStatusMsg({
      text: 'Se ha descargado el archivo "aulavirtual_db.json". Puedes subirlo a la carpeta "data/" de tu repositorio en GitHub para tener tus datos guardados allí.',
      type: 'success',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-7 shadow-xl border border-slate-200 space-y-6 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-slate-900">
                Sincronización con GitHub
              </h2>
              <p className="text-xs text-slate-500">
                Guarda profesores, alumnos y entregas en la nube de tu repositorio
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Status notification */}
        {statusMsg && (
          <div className={`p-3.5 rounded-xl text-xs flex items-start gap-2.5 ${
            statusMsg.type === 'success' 
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
              : statusMsg.type === 'error'
              ? 'bg-rose-50 text-rose-800 border border-rose-200'
              : 'bg-indigo-50 text-indigo-800 border border-indigo-200'
          }`}>
            {statusMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            ) : statusMsg.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
            ) : (
              <RefreshCw className="w-4 h-4 shrink-0 mt-0.5 text-indigo-600" />
            )}
            <div className="leading-relaxed flex-1">{statusMsg.text}</div>
          </div>
        )}

        {/* Sync Actions Quick Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={handlePull}
            className="p-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl flex items-center gap-3 text-left transition-colors group"
          >
            <div className="p-2 bg-indigo-600 text-white rounded-lg group-hover:scale-105 transition-transform">
              <DownloadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-indigo-950">Traer datos de GitHub</div>
              <div className="text-[11px] text-indigo-700">Cargar usuarios en este ordenador</div>
            </div>
          </button>

          <button
            type="button"
            disabled={isLoading}
            onClick={handlePush}
            className="p-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl flex items-center gap-3 text-left transition-colors group"
          >
            <div className="p-2 bg-slate-800 text-emerald-400 rounded-lg group-hover:scale-105 transition-transform">
              <UploadCloud className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-white">Guardar en GitHub</div>
              <div className="text-[11px] text-slate-300">Subir profesores y contraseñas</div>
            </div>
          </button>
        </div>

        {/* Repository Settings Form */}
        <div className="space-y-4 pt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Usuario / Organización de GitHub *
              </label>
              <input
                type="text"
                value={config.owner}
                onChange={e => setConfig({ ...config, owner: e.target.value.trim() })}
                placeholder="Prof_Marisol"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Repositorio de GitHub *
              </label>
              <input
                type="text"
                value={config.repo}
                onChange={e => setConfig({ ...config, repo: e.target.value.trim() })}
                placeholder="Prof_Marisol"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Rama (Branch)
              </label>
              <input
                type="text"
                value={config.branch}
                onChange={e => setConfig({ ...config, branch: e.target.value.trim() })}
                placeholder="main"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Archivo de Base de Datos
              </label>
              <input
                type="text"
                value={config.filePath}
                onChange={e => setConfig({ ...config, filePath: e.target.value.trim() })}
                placeholder="data/aulavirtual_db.json"
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-semibold text-slate-700">
                Token Personal de GitHub (PAT)
              </label>
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 flex items-center gap-1 font-medium"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>¿Cómo conseguir el token gratis?</span>
              </button>
            </div>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.token || ''}
                onChange={e => setConfig({ ...config, token: e.target.value.trim() })}
                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx (necesario para guardar en GitHub)"
                className="w-full pl-9 pr-20 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
              />
              <Key className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-3 top-2 text-[11px] font-semibold text-slate-500 hover:text-slate-800"
              >
                {showToken ? 'Ocultar' : 'Ver'}
              </button>
            </div>
          </div>

          {/* Guide Dropdown */}
          {showGuide && (
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 space-y-2">
              <div className="font-semibold text-slate-800">
                Pasos rápidos para crear tu Token de GitHub en 1 minuto:
              </div>
              <ol className="list-decimal list-inside space-y-1 text-[11px] text-slate-600">
                <li>Ve a <a href="https://github.com/settings/tokens" target="_blank" rel="noreferrer" className="text-indigo-600 underline font-medium inline-flex items-center gap-0.5">github.com/settings/tokens <ExternalLink className="w-3 h-3" /></a></li>
                <li>Pulsa en <strong>Generate new token (classic)</strong>.</li>
                <li>En <strong>Note</strong> ponle <em>AulaVirtual</em>.</li>
                <li>Marca la casilla <strong>repo</strong> (acceso completo a repositorios).</li>
                <li>Pulsa en <strong>Generate token</strong> al final y copia el código que empieza por <code>ghp_...</code>.</li>
              </ol>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleTestConnection}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors"
            >
              Probar Conexión
            </button>
            <button
              type="button"
              onClick={handleDownloadBackup}
              className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
              title="Descargar archivo JSON para subirlo manualmente a GitHub sin token"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Descargar .json para GitHub</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveConfig}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors shadow-xs"
            >
              Guardar Configuración
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
