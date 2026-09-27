/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { User, ViewState } from './types';
import { storageService } from './services/storage';
import { Navbar } from './components/Navbar';
import { LoginView } from './components/LoginView';
import { DashboardView } from './components/DashboardView';
import { ModuleRunner } from './components/ModuleRunner';
import { ModuleEditor } from './components/ModuleEditor';
import { SubmissionsView } from './components/SubmissionsView';
import { StudentsManager } from './components/StudentsManager';
import { TeachersManager } from './components/TeachersManager';
import { githubSyncService } from './services/githubSync';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(() => storageService.getCurrentUser());
  const [currentView, setCurrentView] = useState<ViewState>({ type: 'dashboard' });
  const [dataVersion, setDataVersion] = useState<number>(0);

  // Attempt to sync latest data from GitHub on mount (multi-computer support)
  useEffect(() => {
    githubSyncService.pullFromGitHub().then(res => {
      if (res.success) {
        setDataVersion(v => v + 1);
      }
    }).catch(() => {
      // Quiet fallback
    });
  }, []);

  // Sync hash with current view for deep linking and GitHub Pages navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash || hash === 'dashboard') {
        setCurrentView({ type: 'dashboard' });
      } else if (hash.startsWith('module/')) {
        const id = hash.replace('module/', '');
        setCurrentView({ type: 'module-runner', moduleId: id });
      } else if (hash.startsWith('edit/')) {
        const id = hash.replace('edit/', '');
        setCurrentView({ type: 'module-editor', moduleId: id });
      } else if (hash === 'new-module') {
        setCurrentView({ type: 'module-editor' });
      } else if (hash === 'submissions') {
        setCurrentView({ type: 'submissions' });
      } else if (hash === 'students') {
        setCurrentView({ type: 'students-manager' });
      } else if (hash === 'teachers' || hash === 'admin') {
        setCurrentView({ type: 'teachers-manager' });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Trigger on mount if hash present
    if (window.location.hash) {
      handleHashChange();
    }
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleNavigate = (view: ViewState) => {
    setCurrentView(view);
    if (view.type === 'dashboard') {
      window.location.hash = 'dashboard';
    } else if (view.type === 'module-runner') {
      window.location.hash = `module/${view.moduleId}`;
    } else if (view.type === 'module-editor') {
      window.location.hash = view.moduleId ? `edit/${view.moduleId}` : 'new-module';
    } else if (view.type === 'submissions') {
      window.location.hash = 'submissions';
    } else if (view.type === 'students-manager') {
      window.location.hash = 'students';
    } else if (view.type === 'teachers-manager') {
      window.location.hash = 'teachers';
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
    setCurrentView({ type: 'dashboard' });
    window.location.hash = '';
  };

  const handleRefreshData = () => {
    setDataVersion(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Navbar
        currentUser={currentUser}
        currentView={currentView}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />

      <main className="flex-1">
        {!currentUser ? (
          <LoginView
            onLoginSuccess={(user) => {
              setCurrentUser(user);
              if (user.username.toLowerCase() === 'admin') {
                handleNavigate({ type: 'teachers-manager' });
              } else {
                handleNavigate({ type: 'dashboard' });
              }
            }}
          />
        ) : (
          <>
            {currentView.type === 'dashboard' && (
              <DashboardView
                key={dataVersion}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onRefreshData={handleRefreshData}
              />
            )}

            {currentView.type === 'module-runner' && (
              <ModuleRunner
                key={currentView.moduleId}
                moduleId={currentView.moduleId}
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {currentView.type === 'module-editor' && (
              <ModuleEditor
                moduleId={currentView.moduleId}
                currentUser={currentUser}
                onNavigate={handleNavigate}
                onSaved={handleRefreshData}
              />
            )}

            {currentView.type === 'submissions' && (
              <SubmissionsView
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {currentView.type === 'students-manager' && (
              <StudentsManager
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}

            {currentView.type === 'teachers-manager' && (
              <TeachersManager
                currentUser={currentUser}
                onNavigate={handleNavigate}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200/80 py-6 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            <span className="font-semibold text-slate-700">AulaVirtual</span>
            <span aria-hidden="true" className="mx-1.5">·</span>
            <span>Sistema Web Educativo Autónomo</span>
          </div>
          <div className="flex items-center gap-4">
            <span>Almacenamiento Local Seguro en Navegador</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
