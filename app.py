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

from config import (
    EXPORTS_DIR,
    SESSION_FERNET_KEY,
    SESSION_ID_PATH,
    SESSION_TTL_SECONDS,
    REDIS_URL,
    ensure_dirs,
    read_session_id,
)

# Ensure directories exist on startup
ensure_dirs()


from sessions import SessionStore

# Initialize session store (if Redis is available)
session_store = None
try:
    session_store = SessionStore(
        redis_url=REDIS_URL, ttl=SESSION_TTL_SECONDS, fernet_key=SESSION_FERNET_KEY
    )
except Exception as e:
    print(f"Warning: Session store not configured: {e}")


def get_session_id():
    # Prefer token provided via cookie, header or query param -> resolve in Redis. Fallback to session file.
    try:
        from flask import request

        # 1. Cookie
        token = request.cookies.get("SUNOPO_SESSION_TOKEN")
        if token and session_store:
            cookie = session_store.get_session(token)
            if cookie:
                return cookie

        # 2. Authorization header: Bearer <token>
        auth = request.headers.get("Authorization")
        if auth and auth.lower().startswith("bearer "):
            token = auth.split(None, 1)[1].strip()
            if token and session_store:
                cookie = session_store.get_session(token)
                if cookie:
                    return cookie

        # 3. Custom header
        token = request.headers.get("X-Session-Token")
        if token and session_store:
            cookie = session_store.get_session(token)
            if cookie:
                return cookie

        # 4. Query param fallback (e.g., ?token=...)
        token = request.args.get("token")
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


@app.route("/api/session", methods=["POST"])
def create_session():
    """Create a server-side session stored in Redis and return a session token (also set as HttpOnly cookie)."""
    if not session_store:
        return jsonify({"error": "Session store not configured"}), 500

    data = request.json or {}
    session_cookie = data.get("session_id")
    if not session_cookie:
        return jsonify({"error": "No session_id provided"}), 400

    try:
        token = session_store.create_session(session_cookie)
        resp = jsonify({"success": True, "session_token": token})
        resp.set_cookie(
            "SUNOPO_SESSION_TOKEN",
            token,
            httponly=True,
            samesite="Lax",
            max_age=SESSION_TTL_SECONDS,
        )
        return resp
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/api/session/validate", methods=["GET"])
def validate_session():
    if not session_store:
        return jsonify({"valid": False, "reason": "no-session-store"}), 200

    token = request.cookies.get("SUNOPO_SESSION_TOKEN") or request.args.get("token")
    if not token:
        return jsonify({"valid": False}), 200

    cookie = session_store.get_session(token)
    ttl = session_store.ttl(token)
    if cookie:
        return jsonify({"valid": True, "expires_in": ttl}), 200
    return jsonify({"valid": False}), 200


@app.route("/api/session/<token>", methods=["DELETE"])
def revoke_session(token):
    if not session_store:
        return jsonify({"error": "Session store not configured"}), 500

    session_store.revoke(token)
    return jsonify({"success": True}), 200


@app.route("/health", methods=["GET"])
def health():
    # Simple health check (can be extended)
    return jsonify({"status": "ok"})


@app.route("/api/generate", methods=["POST"])
def generate_audio():
    session_id = get_session_id()
    if not session_id:
        return jsonify({"error": "Session ID not found"}), 400

    data = request.json or {}
    prompt = data.get("prompt")
    if not prompt:
        return jsonify({"error": "No prompt provided"}), 400

    is_custom = data.get("is_custom", False)
    tags = data.get("tags", "")
    title = data.get("title", "")
    make_instrumental = data.get("make_instrumental", False)
    wait_audio = data.get("wait_audio", True)

    try:
        client = SunoClient(cookie=session_id, session_getter=get_session_id)
        clips = client.generate(
            prompt=prompt,
            is_custom=is_custom,
            tags=tags,
            title=title,
            make_instrumental=make_instrumental,
            wait_audio=wait_audio,
        )

        # Convert clips to serializable format
        result = []
        for clip in clips:
            result.append(
                {
                    "id": clip.id,
                    "title": clip.title,
                    "image_url": clip.image_url,
                    "audio_url": clip.audio_url,
                    "video_url": clip.video_url,
                    "created_at": clip.created_at,
                    "status": clip.status,
                    "metadata": {
                        "tags": clip.metadata.tags,
                        "prompt": clip.metadata.prompt,
                    },
                }
            )

        return jsonify({"success": True, "clips": result})
    except Exception as e:
        print(f"Generation error: {e}")
        return jsonify({"error": str(e)}), 500


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
            has_more = len(enriched_songs) == per_page
            return jsonify(
                {
                    "items": enriched_songs,
                    "page": page,
                    "per_page": per_page,
                    "has_more": has_more,
                    "next_page": page + 1 if has_more else None,
                }
            )
    except Exception as e:
        return jsonify({"error": str(e)}), 500
