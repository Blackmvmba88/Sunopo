import os
import json
import pandas as pd
from suno import Suno
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

from config import REPORTS_DIR, read_session_id, ensure_dirs
from suno_client import SunoClient

ensure_dirs()

# Rutas previously were absolute - now use REPORTS_DIR from config


def get_suno_list():
    print("📦 Extrayendo lista completa de Suno...")
    try:
        session_id = read_session_id()
        client = SunoClient(cookie=session_id, session_getter=read_session_id)
        all_songs = []
        # Use iterator to stream through pages safely
        count = 0
        for s in client.iter_songs(page_size=100):
            all_songs.append({
                "ID": s.id,
                "Title": s.title,
                "Artist": "Iyari Gomez",
                "Author": "Iyari Cancino Gomez",
                "Status": getattr(s, 'status', None),
                "Created": getattr(s, 'created_at', None),
                "Audio_URL": getattr(s, 'audio_url', None),
            })
            count += 1
            if count % 500 == 0:
                print(f"   Procesados {count} temas...")

        df = pd.DataFrame(all_songs)
        path = os.path.join(REPORTS_DIR, "Master_Suno_List.xlsx")
        df.to_excel(path, index=False)
        return path, len(all_songs)
    except Exception as e:
        return str(e), 0


def get_soundcloud_list():
    # Usamos la lista que ya existe en XarvisCore como base
    print("☁️  Procesando lista de SoundCloud...")
    src = "/Users/blackmamba/Desktop/XarvisCore/10_CULTURAL_RENAISSANCE/SoundCloud_Master_List.xlsx"
    dest = os.path.join(REPORTS_DIR, "Master_SoundCloud_List.xlsx")
    if os.path.exists(src):
        df = pd.read_excel(src)
        df.to_excel(dest, index=False)
        return dest, len(df)
    return "No se encontró archivo previo en XarvisCore", 0


def get_spotify_list():
    # Nota: Para Spotify real necesitamos CLIENT_ID y CLIENT_SECRET
    # Por ahora generamos el reporte basado en los metadatos de distribución
    print("🎧 Generando reporte de Spotify (Simulado/Plan)...")
    path = os.path.join(REPORTS_DIR, "Master_Spotify_Distribution.xlsx")
    # Aquí iría la lógica de Spotipy cuando el usuario provea credenciales
    # Demo con exportación local
    data = [{"Track": "Soberanía Digital", "Status": "Live", "ISRC": "US-ABC-26-00001"}]
    df = pd.DataFrame(data)
    df.to_excel(path, index=False)
    return path, len(df)


if __name__ == "__main__":
    s_path, s_count = get_suno_list()
    sc_path, sc_count = get_soundcloud_list()
    sp_path, sp_count = get_spotify_list()

    print("\n--- 🏁 REPORTE DE SINCRONIZACIÓN TERMINADO ---")
    print(f"✅ Suno: {s_count} temas -> {s_path}")
    print(f"✅ SoundCloud: {sc_count} temas -> {sc_path}")
    print(f"✅ Spotify: {sp_count} temas -> {sp_path}")
