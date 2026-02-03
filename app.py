import os
import requests
import io
from flask import Flask, jsonify, request, send_from_directory, send_file
from flask_cors import CORS
from suno import Suno
from pydub import AudioSegment
import json

from suno_client import SunoClient

app = Flask(__name__)
CORS(app)

from config import EXPORTS_DIR, SESSION_ID_PATH, ensure_dirs, read_session_id

# Ensure directories exist on startup
ensure_dirs()


from sessions import SessionStore

# Initialize session store (if REDIS_URL set)
session_store = None
try:
    session_store = SessionStore(redis_url=REDIS_URL, ttl=SESSION_TTL_SECONDS, fernet_key=SESSION_FERNET_KEY)
except Exception as e:
    print(f"Warning: Session store not configured: {e}")


def get_session_id():
    # Prefer active HTTP cookie token -> resolve in Redis. Fallback to session file.
    try:
        from flask import request

        token = request.cookies.get('SUNOPO_SESSION_TOKEN')
        if token and session_store:
            cookie = session_store.get_session(token)
            if cookie:
                return cookie
    except Exception:
        # No request context or redis not available
        pass

    try:
        return read_session_id()
    except Exception as e:
        print(f"Error leyendo session ID: {e}")
        return None


@app.route("/api/update_session", methods=["POST"])
def update_session():
    data = request.json
    session_id = data.get("session_id")
    if not session_id:
        return jsonify({"error": "No session_id provided"}), 400

    try:
        with open(SESSION_ID_PATH, "w") as f:
            f.write(session_id)
        return jsonify({"success": True, "message": "Session ID updated successfully"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/session', methods=['POST'])
def create_session():
    """Create a server-side session stored in Redis and return a session token (also set as HttpOnly cookie)."""
    if not session_store:
        return jsonify({"error": "Session store not configured"}), 500

    data = request.json or {}
    session_cookie = data.get('session_id')
    if not session_cookie:
        return jsonify({"error": "No session_id provided"}), 400

    try:
        token = session_store.create_session(session_cookie)
        resp = jsonify({"success": True, "session_token": token})
        resp.set_cookie('SUNOPO_SESSION_TOKEN', token, httponly=True, samesite='Lax', max_age=SESSION_TTL_SECONDS)
        return resp
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/session/validate', methods=['GET'])
def validate_session():
    if not session_store:
        return jsonify({"valid": False, "reason": "no-session-store"}), 200

    token = request.cookies.get('SUNOPO_SESSION_TOKEN') or request.args.get('token')
    if not token:
        return jsonify({"valid": False}), 200

    cookie = session_store.get_session(token)
    ttl = session_store.ttl(token)
    if cookie:
        return jsonify({"valid": True, "expires_in": ttl}), 200
    return jsonify({"valid": False}), 200


@app.route('/api/session/<token>', methods=['DELETE'])
def revoke_session(token):
    if not session_store:
        return jsonify({"error": "Session store not configured"}), 500

    session_store.revoke(token)
    return jsonify({"success": True}), 200

@app.route("/health", methods=["GET"])
def health():
    # Simple health check (can be extended)
    return jsonify({"status": "ok"})


@app.route("/api/songs", methods=["GET"])
def get_songs():
    session_id = get_session_id()
    if not session_id:
        return jsonify({"error": "Session ID not found"}), 400

    # Pagination params
    try:
        page = int(request.args.get("page", 1))
    except ValueError:
        page = 1
    try:
        per_page = int(request.args.get("per_page", 50))
    except ValueError:
        per_page = 50
    per_page = max(1, min(per_page, 100))
    all_flag = str(request.args.get("all", "false")).lower() in ("true", "1")
    max_pages = request.args.get("max_pages")
    max_pages = int(max_pages) if max_pages and max_pages.isdigit() else None

    try:
        client = SunoClient(cookie=session_id, session_getter=get_session_id)

        if all_flag:
            # Iterate all songs (careful of very large libraries)
            enriched_songs = []
            for s in client.iter_songs(
                page_size=per_page, max_pages=max_pages, start_page=page
            ):
                enriched_songs.append(
                    {
                        "id": s.id,
                        "title": s.title,
                        "artist": "Iyari Gomez",
                        "author": "Iyari Cancino Gomez",
                        "image_url": getattr(s, "image_url", None),
                        "audio_url": getattr(s, "audio_url", None),
                        "video_url": getattr(s, "video_url", None),
                        "created_at": getattr(s, "created_at", None),
                        "status": getattr(s, "status", None),
                        "prompt": getattr(s, "prompt", None),
                        "lyrics": getattr(s, "lyrics", ""),
                    }
                )
            return jsonify(
                {
                    "items": enriched_songs,
                    "page": page,
                    "per_page": per_page,
                    "has_more": False,
                    "next_page": None,
                }
            )
        else:
            songs = client.list_songs(page=page, limit=per_page)
            enriched_songs = []
            for s in songs:
                enriched_songs.append(
                    {
                        "id": s.id,
                        "title": s.title,
                        "artist": "Iyari Gomez",
                        "author": "Iyari Cancino Gomez",
                        "image_url": getattr(s, "image_url", None),
                        "audio_url": getattr(s, "audio_url", None),
                        "video_url": getattr(s, "video_url", None),
                        "created_at": getattr(s, "created_at", None),
                        "status": getattr(s, "status", None),
                        "prompt": getattr(s, "prompt", None),
                        "lyrics": getattr(s, "lyrics", ""),
                    }
                )

            has_more = len(songs) == per_page
            next_page = page + 1 if has_more else None

            return jsonify(
                {
                    "items": enriched_songs,
                    "page": page,
                    "per_page": per_page,
                    "has_more": has_more,
                    "next_page": next_page,
                }
            )

    except Exception as e:
        print(f"Suno API Error: {e}")
        # Fallback to mock data for demonstration if API fails
        mock_songs = [
            {
                "id": "mock_1",
                "title": "Soberanía Digital (Demo)",
                "artist": "Iyari Gomez",
                "author": "Iyari Cancino Gomez",
                "image_url": "https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=400",
                "audio_url": "#",
                "status": "complete",
                "created_at": "2024-03-20",
                "lyrics": "[Verse 1]\nEn el código está mi voz\nSoberano en el servidor\nSin cadenas, sin temor\nIyari Gomez es el motor...",
            },
            {
                "id": "mock_2",
                "title": "Fuerza Alpha (Demo)",
                "artist": "Iyari Gomez",
                "author": "Iyari Cancino Gomez",
                "image_url": "https://images.unsplash.com/photo-1514525253361-bee8718a74a1?w=400",
                "audio_url": "#",
                "status": "complete",
                "created_at": "2024-03-20",
                "lyrics": "[Chorus]\nFuerza Alpha, luz celestial\nMovimiento universal\nCancino Gomez lo hará real\nEn un mundo digital...",
            },
        ]
        return jsonify(mock_songs)


@app.route("/api/generate_wav/<song_id>", methods=["POST"])
def generate_wav(song_id):
    session_id = get_session_id()
    if not session_id:
        return jsonify({"error": "Session ID not found"}), 400

    try:
        client = Suno(cookie=session_id)
        # Buscar la canción para obtener el audio_url
        songs = client.songs.list(page=1, limit=50)
        song = next((s for s in songs if s.id == song_id), None)

        if not song or not song.audio_url:
            return jsonify({"error": "Song or Audio URL not found"}), 404

        # Descargar el MP3
        response = requests.get(song.audio_url)
        audio_data = io.BytesIO(response.content)

        # Convertir a WAV de alta calidad (44.1kHz, 16-bit)
        audio = AudioSegment.from_file(audio_data, format="mp3")
        wav_filename = f"{song_id}.wav"
        wav_path = os.path.join(EXPORTS_DIR, wav_filename)

        audio.export(wav_path, format="wav", parameters=["-ar", "44100", "-ac", "2"])

        return jsonify(
            {
                "success": True,
                "message": "WAV generado con éxito",
                "download_url": f"/api/download/{song_id}",
            }
        )

    except Exception as e:
        print(f"Error generando WAV: {e}")
        return jsonify({"error": str(e)}), 500


@app.route("/api/download/<song_id>", methods=["GET"])
def download_wav(song_id):
    wav_path = os.path.join(EXPORTS_DIR, f"{song_id}.wav")
    if os.path.exists(wav_path):
        return send_file(wav_path, as_attachment=True)
    return jsonify({"error": "File not found"}), 404


@app.route("/api/analyze_track/<song_id>", methods=["POST"])
def analyze_track(song_id):
    session_id = get_session_id()
    if not session_id:
        # Si no hay session, usar mock
        prompt = "Una canción épica sobre la soberanía digital y el futuro de la IA."
        title = "Soberanía Digital"
    else:
        try:
            client = Suno(cookie=session_id)
            songs = client.songs.list(page=1, limit=50)
            song = next((s for s in songs if s.id == song_id), None)
            prompt = song.prompt if song else "Música electrónica futurista."
            title = song.title if song else "Untitled"
            lyrics = getattr(song, "lyrics", "") if song else ""
        except:
            prompt = "Música electrónica futurista."
            title = "Untitled"
            lyrics = ""

    # Generar descripción estructurada
    description = f"""
🔥 {title.upper()}
Artista: Iyari Gomez
Autor/Compositor: Iyari Cancino Gomez

--- 📜 CRÉDITOS ---
Producido por: Iyari Gomez System
Letra y Composición: Iyari Cancino Gomez
Ingeniería de Audio: Sunopo Sovereign Engine

--- 🚀 LETRAS ---
{lyrics if lyrics else "Instrumental / No lyrics found."}

--- 🚀 SOBRE ESTE TRACK ---
Inspiración: {prompt[:100]}...

#IyariGomez #IyariCancinoGomez #SunoAI #BlackMamba #SovereignDistribution #ElectronicMusic2026
    """.strip()

    return jsonify(
        {
            "description": description,
            "tags": "Iyari Gomez, Iyari Cancino Gomez, Suno, AI Music, BlackMamba, Sovereign",
        }
    )


@app.route("/")
def index():
    return send_from_directory(".", "index.html")


@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory(".", path)


if __name__ == "__main__":
    app.run(debug=True, port=5555)
