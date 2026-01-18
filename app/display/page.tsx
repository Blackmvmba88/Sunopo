"use client";

import { useState } from "react";

export default function DisplayPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setAudioUrl(null);
    setProgress(0);

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
      }, 200);

      const response = await fetch("/api/generate", {
        method: "POST",
      });

      clearInterval(progressInterval);
      setProgress(100);

      if (response.ok) {
        const data = await response.json();
        setAudioUrl(data.audioUrl);
      } else {
        alert("Error al generar audio");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error al generar audio");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (audioUrl) {
      const link = document.createElement("a");
      link.href = audioUrl;
      link.download = "audio-generado.mp3";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleShare = async () => {
    if (audioUrl) {
      const shareUrl = window.location.origin + audioUrl;
      if (navigator.share) {
        try {
          await navigator.share({
            title: "Audio Generado",
            text: "Escucha este audio generado con BlackMamba",
            url: shareUrl,
          });
        } catch (error) {
          console.error("Error al compartir:", error);
        }
      } else {
        // Fallback: copy to clipboard
        navigator.clipboard.writeText(shareUrl);
        alert("Enlace copiado al portapapeles");
      }
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-2">BlackMamba</h1>
          <p className="text-gray-400">Generador de Audio</p>
        </div>

        <div className="bg-zinc-900 rounded-lg p-8 space-y-6">
          {!audioUrl && !isGenerating && (
            <button
              onClick={handleGenerate}
              className="w-full bg-white text-black font-semibold py-4 px-6 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Generar Audio
            </button>
          )}

          {isGenerating && (
            <div className="space-y-4">
              <div className="text-center text-sm text-gray-400">
                Generando audio...
              </div>
              <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-white h-full transition-all duration-300"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <div className="text-center text-sm text-gray-400">
                {progress}%
              </div>
            </div>
          )}

          {audioUrl && (
            <div className="space-y-6">
              <div className="text-center text-sm text-green-400 mb-4">
                ¡Audio generado con éxito!
              </div>
              
              <div className="bg-zinc-800 rounded-lg p-4">
                <audio
                  controls
                  className="w-full"
                  src={audioUrl}
                  style={{
                    filter: "invert(1) grayscale(1) contrast(0.9)",
                  }}
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleDownload}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Descargar
                </button>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                >
                  Compartir
                </button>
              </div>

              <button
                onClick={handleGenerate}
                className="w-full bg-white text-black font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Generar Nuevo Audio
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
