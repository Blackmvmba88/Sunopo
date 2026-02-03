// SoundCloud Metadata Auto-Filler
// Instrucciones: Copia y pega esto en la consola (F12) de tu navegador en la página de edición de SoundCloud.

(function() {
    const ARTIST_NAME = "Iyari Gomez";
    const AUTHOR_NAME = "Iyari Cancino Gomez";

    function fillMetadata() {
        console.log("Intentando llenar metadata...");

        // 1. Intentar llenar Artist (en la pestaña Basic Info)
        const artistInput = document.querySelector('input[name="artist"]') || 
                           document.querySelector('input[placeholder="Artist"]') ||
                           document.querySelector('.editing__artist input');
        
        if (artistInput) {
            artistInput.value = ARTIST_NAME;
            artistInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log("Artista llenado: " + ARTIST_NAME);
        }

        // 2. Intentar llenar Composer/Author (en la pestaña Metadata)
        // Nota: A veces hay que hacer clic en la pestaña "Metadata" primero.
        const composerInput = document.querySelector('input[name="composer"]') || 
                             document.querySelector('input[placeholder="Composer"]') ||
                             document.querySelector('.editing__composer input');

        if (composerInput) {
            composerInput.value = AUTHOR_NAME;
            composerInput.dispatchEvent(new Event('input', { bubbles: true }));
            console.log("Autor/Compositor llenado: " + AUTHOR_NAME);
        } else {
            console.log("No se encontró el campo de Compositor. Asegúrate de estar en la pestaña 'Metadata'.");
        }
    }

    // Ejecutar inmediatamente
    fillMetadata();

    // Helper to request an analysis from Sunopo (uses token from localStorage or window.SunoPo)
    async function fetchAnalysisForTrack(sunoId) {
        try {
            const token = (window.SunoPo && window.SunoPo.getSessionToken && window.SunoPo.getSessionToken()) || localStorage.getItem('SUNOPO_SESSION_TOKEN');
            const headers = { 'Content-Type': 'application/json' };
            if (token) {
                headers['X-Session-Token'] = token;
                headers['Authorization'] = 'Bearer ' + token;
            }

            const resp = await fetch(`http://localhost:5555/api/analyze_track/${sunoId}`, {
                method: 'POST',
                headers: headers
            });
            if (!resp.ok) return null;
            return await resp.json();
        } catch (e) {
            console.warn('Error fetching analysis', e);
            return null;
        }
    }

    // Opcional: Agregar un botón flotante para volver a llenar si cambias de canción
    const btn = document.createElement('button');
    btn.innerHTML = "🚀 Llenar Metadata Iyari";
    btn.style.position = "fixed";
    btn.style.top = "10px";
    btn.style.right = "10px";
    btn.style.zIndex = "9999";
    btn.style.padding = "10px";
    btn.style.background = "#ff5500";
    btn.style.color = "white";
    btn.style.border = "none";
    btn.style.borderRadius = "5px";
    btn.style.cursor = "pointer";
    btn.onclick = async () => {
        // Try to find a Suno ID on the page (user can modify to provide a specific id)
        const sunoId = document.querySelector('[data-suno-id]')?.getAttribute('data-suno-id') || prompt('Enter Suno track id to fetch analysis for:');
        if (!sunoId) return fillMetadata();
        const analysis = await fetchAnalysisForTrack(sunoId);
        if (analysis && analysis.description) {
            // Try to put the description into the SoundCloud description textarea
            const ta = document.querySelector('textarea[name="description"]') || document.querySelector('textarea[placeholder="Tell your story"]');
            if (ta) {
                ta.value = analysis.description;
                ta.dispatchEvent(new Event('input', { bubbles: true }));
                alert('Descripción auto-llenada desde Sunopo. Revísala antes de publicar.');
            } else {
                alert('Descripción recibida:\n' + analysis.description);
            }
        } else {
            alert('No se obtuvo análisis del servidor.');
            fillMetadata();
        }
    };
    document.body.appendChild(btn);

})();
