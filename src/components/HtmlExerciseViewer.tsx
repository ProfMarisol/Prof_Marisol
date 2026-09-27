import React, { useState, useRef, useEffect } from 'react';
import { Maximize2, Minimize2, RotateCcw, ExternalLink, FileCode, Check } from 'lucide-react';

interface HtmlExerciseViewerProps {
  title: string;
  htmlContent?: string;
  externalUrl?: string;
  fileName?: string;
  initialFullScreen?: boolean;
  onCloseFullScreen?: () => void;
  heightClass?: string;
}

export const HtmlExerciseViewer: React.FC<HtmlExerciseViewerProps> = ({
  title,
  htmlContent,
  externalUrl,
  fileName,
  initialFullScreen = false,
  onCloseFullScreen,
  heightClass = 'h-[500px]',
}) => {
  const [isFullScreen, setIsFullScreen] = useState(initialFullScreen);
  const [iframeKey, setIframeKey] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync state if initialFullScreen changes
  useEffect(() => {
    setIsFullScreen(initialFullScreen);
  }, [initialFullScreen]);

  // Handle ESC key to exit full screen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullScreen) {
        setIsFullScreen(false);
        onCloseFullScreen?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullScreen, onCloseFullScreen]);

  const handleToggleFullScreen = () => {
    const nextState = !isFullScreen;
    setIsFullScreen(nextState);
    if (!nextState) {
      onCloseFullScreen?.();
    }
  };

  const handleReloadIframe = () => {
    setIframeKey(prev => prev + 1);
  };

  if (!htmlContent && !externalUrl) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className={`transition-all ${
        isFullScreen
          ? 'fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen'
          : 'rounded-xl border border-slate-200 overflow-hidden bg-slate-900 shadow-sm flex flex-col'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-indigo-600/30 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shrink-0">
            <FileCode className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="text-xs sm:text-sm font-semibold truncate text-slate-100">
              {title || 'Ejercicio Interactivo en HTML'}
            </div>
            {fileName && (
              <div className="text-[11px] text-slate-400 font-mono truncate">
                {fileName}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleReloadIframe}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1.5"
            title="Reiniciar ejercicio"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reiniciar</span>
          </button>

          <button
            type="button"
            onClick={handleToggleFullScreen}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs ${
              isFullScreen
                ? 'bg-rose-600 hover:bg-rose-700 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
            title={isFullScreen ? 'Salir de Pantalla Completa (ESC)' : 'Ver a Pantalla Completa'}
          >
            {isFullScreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span>Salir de Pantalla Completa (ESC)</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span>Ver a Pantalla Completa</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Frame Container */}
      <div className={`relative flex-1 bg-white ${isFullScreen ? 'h-full w-full' : heightClass}`}>
        <iframe
          key={iframeKey}
          title={title}
          src={externalUrl || undefined}
          srcDoc={htmlContent || undefined}
          sandbox="allow-scripts allow-forms allow-same-origin allow-modals"
          className="w-full h-full border-0 block"
        />
      </div>
    </div>
  );
};
