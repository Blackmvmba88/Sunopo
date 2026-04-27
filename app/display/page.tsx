'use client';

import { useState } from 'react';

export default function DisplayPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clips, setClips] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [prompt, setPrompt] = useState('');
  const [tags, setTags] = useState('');
  const [title, setTitle] = useState('');
  const [isCustom, setIsCustom] = useState(false);

  const handleGenerate = async () => {
    if (!prompt) {
      setError('Por favor, ingresa una descripción o letra.');
      return;
    }

    setIsGenerating(true);
    setProgress(0);
    setClips([]);
    setError(null);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) {
            clearInterval(progressInterval);
            return 95;
          }
          return prev + 5;
        });
      }, 1000);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          tags,
          title,
          is_custom: isCustom,
          wait_audio: true,
        }),
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al generar audio');
      }

      const data = await response.json();
      if (data.success && data.clips) {
        setClips(data.clips);
        setProgress(100);
      } else {
        throw new Error('No se recibieron pistas generadas');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      setProgress(0);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    if (url) {
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'audio.mp3';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async (url: string, clipTitle: string) => {
    if (url) {
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
          {/* Musical Engine Inputs */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-300">
                {isCustom ? 'Letras Personalizadas' : 'Descripción de la Música'}
              </label>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500">Modo Custom</span>
                <input
                  type="checkbox"
                  checked={isCustom}
                  onChange={(e) => setIsCustom(e.target.checked)}
                  className="w-4 h-4 rounded bg-zinc-800 border-zinc-700"
                />
              </div>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={isCustom ? "Escribe tus letras aquí..." : "Ej: Un tema de synthwave oscuro con ritmos potentes..."}
              className="w-full h-32 bg-zinc-800 border border-zinc-700 rounded-xl p-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white transition-all"
            />

            {isCustom && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Estilo / Tags</label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    placeholder="Ej: male voice, rock, fast"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-gray-500 uppercase">Título</label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título de la canción"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full bg-white text-black font-semibold py-4 px-6 rounded-full hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed transition-all duration-200 transform active:scale-95"
          >
            {isGenerating ? 'Creando Magia...' : 'Generar Música'}
          </button>

          {/* Progress Bar */}
          {(isGenerating || (progress > 0 && progress < 100)) && (
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

          {/* Generated Clips */}
          {clips.length > 0 && (
            <div className="space-y-6 pt-4 border-t border-zinc-800">
              <h2 className="text-xl font-bold">Tus Creaciones</h2>
              <div className="grid grid-cols-1 gap-6">
                {clips.map((clip) => (
                  <div key={clip.id} className="bg-zinc-800/50 rounded-2xl overflow-hidden border border-zinc-700 flex flex-col md:flex-row">
                    {clip.image_url && (
                      <div className="w-full md:w-48 h-48 flex-shrink-0">
                        <img src={clip.image_url} alt={clip.title} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="p-6 flex-grow flex flex-col justify-between space-y-4">
                      <div>
                        <h3 className="text-lg font-bold truncate">{clip.title || 'Sin Título'}</h3>
                        <p className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                          {clip.metadata?.tags || 'Estilo variado'}
                        </p>
                      </div>

                      <div className="bg-black/40 rounded-xl p-2">
                        <audio
                          controls
                          src={clip.audio_url}
                          className="w-full h-10"
                          style={{
                            filter: 'invert(1) hue-rotate(180deg) brightness(1.5)',
                          }}
                        />
                      </div>

                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleDownload(clip.audio_url, `${clip.title || 'audio'}.mp3`)}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors border border-zinc-600"
                        >
                          Descargar
                        </button>
                        <button
                          onClick={() => handleShare(clip.audio_url, clip.title)}
                          className="flex-1 bg-zinc-700 hover:bg-zinc-600 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors border border-zinc-600"
                        >
                          Compartir
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
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
