'use client';

import { useState } from 'react';

export default function DisplayPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setAudioUrl(null);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 500);

      const response = await fetch('/api/generate', {
        method: 'POST',
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        throw new Error('Error al generar audio');
      }

      const data = await response.json();
      setAudioUrl(data.audioUrl);
      setProgress(100);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = 'audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (audioUrl) {
      if (navigator.share) {
        try {
          await navigator.share({
            title: 'Audio generado - BlackMamba',
            text: 'Escucha este audio generado',
            url: window.location.href,
          });
        } catch (err) {
          console.log('Error al compartir:', err);
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(window.location.href);
        alert('Enlace copiado al portapapeles');
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold tracking-tight">BlackMamba</h1>
          <p className="text-gray-400">Generador de audio minimalista</p>
        </div>

        {/* Main Card */}
        <div className="bg-zinc-900 rounded-2xl border border-zinc-800 p-8 space-y-6">
          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-white text-black font-semibold py-4 px-6 rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-105"
          >
            {isGenerating ? 'Generando...' : 'Generar Audio'}
          </button>

          {/* Progress Bar */}
          {(isGenerating || progress > 0) && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Progreso</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Audio Player */}
          {audioUrl && (
            <div className="space-y-4">
              <div className="bg-zinc-800 rounded-lg p-4">
                <audio
                  controls
                  src={audioUrl}
                  className="w-full"
                  style={{
                    filter: 'invert(1) hue-rotate(180deg)',
                  }}
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={handleDownload}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-200 border border-zinc-700"
                >
                  Descargar
                </button>
                <button
                  onClick={handleShare}
                  className="bg-zinc-800 hover:bg-zinc-700 text-white font-medium py-3 px-6 rounded-full transition-all duration-200 border border-zinc-700"
                >
                  Compartir
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>Interfaz inspirada en Suno con tema minimalista</p>
        </div>
      </div>
    </div>
  );
}
