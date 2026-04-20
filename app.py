from __future__ import annotations

import os
import re
import sqlite3
import uuid
from pathlib import Path
from typing import Any

from flask import Flask, jsonify, request, send_from_directory, session
from werkzeug.middleware.proxy_fix import ProxyFix
from werkzeug.security import check_password_hash, generate_password_hash
from werkzeug.utils import secure_filename

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("TRAMPLIN_DB_PATH", str(BASE_DIR / "tramplin.db")))
UPLOADS_DIR = Path(os.environ.get("TRAMPLIN_UPLOADS_DIR", str(BASE_DIR / "uploads")))
ALLOWED_EXTENSIONS = {
    "jpg",
    "jpeg",
    "jfif",
    "png",
    "gif",
    "webp",
    "mp4",
    "webm",
    "mov",
}
VIDEO_EXTENSIONS = {"mp4", "webm", "mov"}

app = Flask(__name__, static_folder=".", static_url_path="")
app.config["SECRET_KEY"] = os.environ.get("TRAMPLIN_SECRET_KEY", "tramplin-dev-secret-key")
app.config["MAX_CONTENT_LENGTH"] = 50 * 1024 * 1024
app.config["SESSION_COOKIE_HTTPONLY"] = True
app.config["SESSION_COOKIE_SAMESITE"] = "Lax"
app.config["SESSION_COOKIE_SECURE"] = os.environ.get("SESSION_COOKIE_SECURE", "1") == "1"
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)


def get_db() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    UPLOADS_DIR.mkdir(exist_ok=True)
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS stories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            author_email TEXT NOT NULL,
            media_filename TEXT,
            media_type TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_id INTEGER NOT NULL,
            author_email TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (story_id) REFERENCES stories(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS story_media (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            media_type TEXT NOT NULL,
            media_order INTEGER NOT NULL,
            FOREIGN KEY (story_id) REFERENCES stories(id)
        )
        """
    )
    cur.execute(
        """
        CREATE TABLE IF NOT EXISTS story_blocks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            story_id INTEGER NOT NULL,
            block_order INTEGER NOT NULL,
            block_type TEXT NOT NULL,
            text_content TEXT,
            filename TEXT,
            media_type TEXT,
            FOREIGN KEY (story_id) REFERENCES stories(id)
        )
        """
    )
    cur.execute("PRAGMA table_info(stories)")
    story_columns = {row["name"] for row in cur.fetchall()}
    if "media_filename" not in story_columns:
        cur.execute("ALTER TABLE stories ADD COLUMN media_filename TEXT")
    if "media_type" not in story_columns:
        cur.execute("ALTER TABLE stories ADD COLUMN media_type TEXT")
    conn.commit()
    conn.close()


def current_user_email() -> str | None:
    return session.get("user_email")


def get_extension(filename: str) -> str:
    return filename.rsplit(".", 1)[-1].lower() if "." in filename else ""


def is_allowed_media(filename: str) -> bool:
    return get_extension(filename) in ALLOWED_EXTENSIONS


def media_kind(filename: str) -> str:
    return "video" if get_extension(filename) in VIDEO_EXTENSIONS else "image"


init_db()


@app.post("/api/register")
def register() -> Any:
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    if not email or not password:
        return jsonify({"error": "Email и пароль обязательны."}), 400
    if len(password) < 4:
        return jsonify({"error": "Пароль должен быть минимум 4 символа."}), 400

    conn = get_db()
    cur = conn.cursor()
    try:
        cur.execute(
            "INSERT INTO users (email, password_hash) VALUES (?, ?)",
            (email, generate_password_hash(password)),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Пользователь с таким email уже существует."}), 409

    conn.close()
    session["user_email"] = email
    return jsonify({"ok": True, "email": email})


@app.post("/api/login")
def login() -> Any:
    data = request.get_json(silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = (data.get("password") or "").strip()

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT password_hash FROM users WHERE email = ?", (email,))
    row = cur.fetchone()
    conn.close()

    if not row or not check_password_hash(row["password_hash"], password):
        return jsonify({"error": "Неверный email или пароль."}), 401

    session["user_email"] = email
    return jsonify({"ok": True, "email": email})


@app.post("/api/logout")
def logout() -> Any:
    session.pop("user_email", None)
    return jsonify({"ok": True})


@app.get("/api/me")
def me() -> Any:
    email = current_user_email()
    return jsonify({"authenticated": bool(email), "email": email})


@app.get("/api/stories")
def list_stories() -> Any:
    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        SELECT id, title, content, author_email, media_filename, media_type, created_at
        FROM stories
        ORDER BY id DESC
        """
    )
    story_rows = cur.fetchall()
    cur.execute(
        """
        SELECT id, story_id, filename, media_type, media_order
        FROM story_media
        ORDER BY media_order ASC
        """
    )
    media_rows = cur.fetchall()
    cur.execute(
        """
        SELECT id, story_id, block_order, block_type, text_content, filename, media_type
        FROM story_blocks
        ORDER BY block_order ASC
        """
    )
    block_rows = cur.fetchall()
    cur.execute(
        """
        SELECT id, story_id, author_email, content, created_at
        FROM comments
        ORDER BY id ASC
        """
    )
    comment_rows = cur.fetchall()
    conn.close()

    comments_by_story: dict[int, list[dict[str, Any]]] = {}
    for comment in comment_rows:
        story_id = comment["story_id"]
        comments_by_story.setdefault(story_id, []).append(
            {
                "id": comment["id"],
                "author": comment["author_email"],
                "content": comment["content"],
                "createdAt": comment["created_at"],
            }
        )

    media_by_story: dict[int, list[dict[str, Any]]] = {}
    for media in media_rows:
        story_id = media["story_id"]
        media_by_story.setdefault(story_id, []).append(
            {
                "id": media["id"],
                "url": f"/uploads/{media['filename']}",
                "type": media["media_type"],
                "order": media["media_order"],
            }
        )
    blocks_by_story: dict[int, list[dict[str, Any]]] = {}
    for block in block_rows:
        story_id = block["story_id"]
        item: dict[str, Any] = {
            "type": block["block_type"],
            "order": block["block_order"],
        }
        if block["block_type"] == "text":
            item["text"] = block["text_content"] or ""
        else:
            item["url"] = f"/uploads/{block['filename']}" if block["filename"] else None
            item["mediaType"] = block["media_type"]
        blocks_by_story.setdefault(story_id, []).append(item)

    stories = [
        {
            "id": row["id"],
            "title": row["title"],
            "content": row["content"],
            "author": row["author_email"],
            "mediaUrl": f"/uploads/{row['media_filename']}" if row["media_filename"] else None,
            "mediaType": row["media_type"],
            "media": media_by_story.get(row["id"], []),
            "blocks": blocks_by_story.get(row["id"], []),
            "createdAt": row["created_at"],
            "comments": comments_by_story.get(row["id"], []),
        }
        for row in story_rows
    ]
    return jsonify(stories)


@app.post("/api/stories")
def create_story() -> Any:
    email = current_user_email()
    if not email:
        return jsonify({"error": "Нужна авторизация."}), 401

    title = (request.form.get("title") or "").strip()
    content = (request.form.get("content") or "").strip()
    raw_blocks = request.form.get("blocks")

    if len(title) < 4:
        return jsonify({"error": "Заголовок должен быть минимум 4 символа."}), 400
    blocks_payload: list[dict[str, Any]] = []
    if raw_blocks:
        try:
            import json

            blocks_payload = json.loads(raw_blocks)
        except Exception:
            return jsonify({"error": "Некорректный формат блоков истории."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute(
        """
        INSERT INTO stories (title, content, author_email, media_filename, media_type)
        VALUES (?, ?, ?, ?, ?)
        """,
        (title, content, email, None, None),
    )
    story_id = cur.lastrowid

    if blocks_payload:
        text_total = 0
        media_order = 0
        block_order = 0
        for block in blocks_payload:
            block_order += 1
            block_type = block.get("type")
            if block_type == "text":
                text = (block.get("text") or "").strip()
                if not text:
                    continue
                text_total += len(text)
                cur.execute(
                    """
                    INSERT INTO story_blocks (story_id, block_order, block_type, text_content)
                    VALUES (?, ?, 'text', ?)
                    """,
                    (story_id, block_order, text),
                )
            elif block_type == "media":
                field_name = (block.get("field") or "").strip()
                media_file = request.files.get(field_name)
                if not media_file or not media_file.filename:
                    continue
                original_name = secure_filename(media_file.filename)
                if not is_allowed_media(original_name):
                    conn.rollback()
                    conn.close()
                    return (
                        jsonify(
                            {
                                "error": "Разрешены форматы: jpg, jpeg, jfif, png, gif, webp, mp4, webm, mov."
                            }
                        ),
                        400,
                    )
                ext = get_extension(original_name)
                filename = f"{uuid.uuid4().hex}.{ext}"
                m_type = media_kind(original_name)
                media_file.save(UPLOADS_DIR / filename)
                media_order += 1
                cur.execute(
                    """
                    INSERT INTO story_blocks (story_id, block_order, block_type, filename, media_type)
                    VALUES (?, ?, 'media', ?, ?)
                    """,
                    (story_id, block_order, filename, m_type),
                )
                cur.execute(
                    """
                    INSERT INTO story_media (story_id, filename, media_type, media_order)
                    VALUES (?, ?, ?, ?)
                    """,
                    (story_id, filename, m_type, media_order),
                )
        if text_total < 20:
            conn.rollback()
            conn.close()
            return jsonify({"error": "Суммарный текст истории должен быть минимум 20 символов."}), 400
        cur.execute("UPDATE stories SET content = ? WHERE id = ?", ("[structured]", story_id))
    else:
        if len(content) < 20:
            conn.rollback()
            conn.close()
            return jsonify({"error": "Текст истории должен быть минимум 20 символов."}), 400

        media_files = request.files.getlist("media")
        uploaded_media: list[tuple[str, str, int]] = []
        valid_media_files = [f for f in media_files if f and f.filename]
        for index, media in enumerate(valid_media_files, start=1):
            original_name = secure_filename(media.filename)
            if not is_allowed_media(original_name):
                conn.rollback()
                conn.close()
                return (
                    jsonify(
                        {
                            "error": "Разрешены форматы: jpg, jpeg, jfif, png, gif, webp, mp4, webm, mov."
                        }
                    ),
                    400,
                )
            ext = get_extension(original_name)
            media_filename = f"{uuid.uuid4().hex}.{ext}"
            media_type = media_kind(original_name)
            media.save(UPLOADS_DIR / media_filename)
            uploaded_media.append((media_filename, media_type, index))

        placeholders = [int(num) for num in re.findall(r"\[media(\d+)\]", content, flags=re.IGNORECASE)]
        if placeholders:
            max_ref = max(placeholders)
            if max_ref > len(uploaded_media):
                conn.rollback()
                conn.close()
                return jsonify({"error": "В тексте есть ссылка на медиа, которого нет в загрузке."}), 400

        for filename, media_type, media_order in uploaded_media:
            cur.execute(
                """
                INSERT INTO story_media (story_id, filename, media_type, media_order)
                VALUES (?, ?, ?, ?)
                """,
                (story_id, filename, media_type, media_order),
            )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.post("/api/stories/<int:story_id>/comments")
def create_comment(story_id: int) -> Any:
    email = current_user_email()
    if not email:
        return jsonify({"error": "Чтобы комментировать, нужно войти в аккаунт."}), 401

    data = request.get_json(silent=True) or {}
    content = (data.get("content") or "").strip()
    if len(content) < 2:
        return jsonify({"error": "Комментарий слишком короткий."}), 400

    conn = get_db()
    cur = conn.cursor()
    cur.execute("SELECT id FROM stories WHERE id = ?", (story_id,))
    story = cur.fetchone()
    if not story:
        conn.close()
        return jsonify({"error": "История не найдена."}), 404

    cur.execute(
        "INSERT INTO comments (story_id, author_email, content) VALUES (?, ?, ?)",
        (story_id, email, content),
    )
    conn.commit()
    conn.close()
    return jsonify({"ok": True})


@app.get("/uploads/<path:filename>")
def uploaded_file(filename: str) -> Any:
    return send_from_directory(UPLOADS_DIR, filename)


@app.get("/")
def root() -> Any:
    return send_from_directory(BASE_DIR, "index.html")


if __name__ == "__main__":
    init_db()
    port = int(os.environ.get("PORT", "5000"))
    debug = os.environ.get("FLASK_DEBUG", "0") == "1"
    app.run(host="0.0.0.0", port=port, debug=debug)
