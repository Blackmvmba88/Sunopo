const API_URL = 'http://localhost:5555/api';

async function syncSongs() {
    const trackList = document.getElementById('trackList');
    trackList.innerHTML = '<div class="loading-state">Sincronizando...</div>';

    try {
        const response = await fetch(`${API_URL}/songs`);
        const songs = await response.json();

        if (songs.error) {
            trackList.innerHTML = `<div class="error-state">Error: ${songs.error}</div>`;
            return;
        }

        renderTracks(songs);
    } catch (err) {
        trackList.innerHTML = `<div class="error-state">Error de conexión con el servidor backend.</div>`;
    }
}

function renderTracks(songs) {
    const trackList = document.getElementById('trackList');
    trackList.innerHTML = '';

    songs.forEach(song => {
        const card = document.createElement('div');
        card.className = 'track-card fade-in';

        // Determinar status del audio
        const audioAvailable = song.audio_url ? true : false;

        card.innerHTML = `
            <img src="${song.image_url || 'https://via.placeholder.com/150'}" alt="${song.title}">
            <div class="track-info">
                <h3>${song.title || 'Untitled Track'}</h3>
                <div class="metadata-badges">
                    <span class="badge artist">Artista: ${song.artist}</span>
                    <span class="badge">Autor: ${song.author}</span>
                    <span class="badge">ID: ${song.id.substring(0, 8)}...</span>
                </div>
                ${song.lyrics ? `
                    <div class="lyrics-preview" id="lyrics-${song.id}" style="display: none; margin-top: 1rem; font-size: 0.8rem; color: var(--text-secondary); background: rgba(0,0,0,0.3); padding: 1rem; border-radius: 8px; white-space: pre-wrap; border-left: 2px solid var(--accent-color);">
                        ${song.lyrics}
                    </div>
                ` : ''}
            </div>
            <div class="actions">
                ${song.lyrics ? `
                    <button class="btn btn-secondary" onclick="toggleLyrics('${song.id}')">
                        <i data-lucide="align-left"></i> Letra
                    </button>
                ` : ''}
                ${audioAvailable ? `
                    <a href="${song.audio_url}" class="btn btn-secondary" target="_blank">
                        <i data-lucide="music"></i> MP3
                    </a>
                    <button class="btn btn-secondary" onclick="generateWav('${song.id}')">
                        <i data-lucide="file-audio"></i> WAV
                    </button>
                ` : '<span class="badge">Procesando...</span>'}
                <button class="btn btn-primary" onclick="distribute('${song.id}')">
                    <i data-lucide="share-2"></i> Distribuir
                </button>
            </div>
        `;
        trackList.appendChild(card);
    });
    lucide.createIcons();
}

async function distribute(id) {
    const chatMessages = document.getElementById('chatMessages');
    const chatInput = document.getElementById('chatInput');

    // Feedback visual en el asistente
    chatMessages.innerHTML += `<div class="msg" style="color: var(--accent-color); font-weight: bold;">[Iyari AI]: Analizando track ${id.substring(0, 8)}...</div>`;
    chatMessages.scrollTop = chatMessages.scrollHeight;

    try {
        const response = await fetch(`${API_URL}/analyze_track/${id}`, { method: 'POST' });
        const data = await response.json();

        if (data.description) {
            // Copiar descripción al portapapeles automáticamente
            await navigator.clipboard.writeText(data.description);

            chatMessages.innerHTML += `<div class="msg">✨ Descripción generada y COPIADA al portapapeles. Listo para SoundCloud.</div>`;
            chatMessages.scrollTop = chatMessages.scrollHeight;

            alert('¡Descripción copiada al portapapeles!\n\nAhora te llevaré a SoundCloud. Solo tienes que pegar (Ctrl+V) en el campo de descripción.');
            window.open('https://soundcloud.com/upload', '_blank');
        }
    } catch (err) {
        alert('Error analizando el tema para SoundCloud.');
    }
}

async function generateWav(id) {
    const btn = event?.target.closest('.btn'); // Capturar el botón clickeado
    const originalContent = btn ? btn.innerHTML : '';

    if (btn) {
        btn.innerHTML = '<i class="spin" data-lucide="loader-2"></i> Generando...';
        btn.disabled = true;
        lucide.createIcons();
    }

    try {
        const response = await fetch(`${API_URL}/generate_wav/${id}`, { method: 'POST' });
        const data = await response.json();

        if (data.success) {
            // Reemplazar botón por uno de descarga
            if (btn) {
                btn.innerHTML = '<i data-lucide="download"></i> Descargar WAV';
                btn.className = 'btn btn-primary';
                btn.disabled = false;
                btn.onclick = () => window.location.href = `${API_URL}/download/${id}`;
                lucide.createIcons();
            }
            alert('¡WAV generado! Ya puedes descargarlo.');
        } else {
            alert('Error: ' + (data.error || 'No se pudo generar el WAV'));
            if (btn) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                lucide.createIcons();
            }
        }
    } catch (err) {
        alert('Error conectando con el servidor.');
        if (btn) {
            btn.innerHTML = originalContent;
            btn.disabled = false;
            lucide.createIcons();
        }
    }
}

function toggleLyrics(id) {
    const el = document.getElementById(`lyrics-${id}`);
    if (el) {
        el.style.display = el.style.display === 'none' ? 'block' : 'none';
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
}

// Carga inicial
window.onload = syncSongs;
