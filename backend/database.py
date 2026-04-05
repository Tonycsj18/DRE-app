import sqlite3
import json
import os
from passlib.context import CryptContext

DB_PATH = os.getenv("DB_PATH", "/tmp/dre_app.db")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    return conn


def init_db():
    conn = get_conn()
    conn.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id        INTEGER PRIMARY KEY AUTOINCREMENT,
            username  TEXT UNIQUE NOT NULL,
            password  TEXT NOT NULL,
            is_admin  INTEGER DEFAULT 0,
            created_at TEXT DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS dre_meses (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id    INTEGER NOT NULL,
            mes        INTEGER NOT NULL,
            ano        INTEGER NOT NULL,
            input_json TEXT NOT NULL,
            result_json TEXT NOT NULL,
            saved_at   TEXT DEFAULT (datetime('now')),
            UNIQUE(user_id, mes, ano),
            FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
        );
    """)

    # Cria usuário admin a partir das variáveis de ambiente
    admin_user = os.getenv("APP_USERNAME", "admin")
    admin_pass = os.getenv("APP_PASSWORD", "dre@2024")
    _upsert_user(conn, admin_user, admin_pass, is_admin=1)

    # Usuários adicionais via APP_USERS (JSON)
    extra = os.getenv("APP_USERS", "")
    if extra:
        try:
            for uname, upass in json.loads(extra).items():
                _upsert_user(conn, uname, upass, is_admin=0)
        except Exception:
            pass

    conn.commit()
    conn.close()


def _upsert_user(conn, username, password, is_admin=0):
    existing = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if not existing:
        conn.execute(
            "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
            (username, pwd_context.hash(password), is_admin),
        )


# ── User helpers ──────────────────────────────────────────────────────────────

def get_user(username: str):
    conn = get_conn()
    row = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()
    conn.close()
    return dict(row) if row else None


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def list_users():
    conn = get_conn()
    rows = conn.execute("SELECT id, username, is_admin, created_at FROM users ORDER BY created_at").fetchall()
    conn.close()
    return [dict(r) for r in rows]


def create_user(username: str, password: str, is_admin: bool = False) -> bool:
    try:
        conn = get_conn()
        conn.execute(
            "INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)",
            (username, pwd_context.hash(password), 1 if is_admin else 0),
        )
        conn.commit()
        conn.close()
        return True
    except sqlite3.IntegrityError:
        return False


def delete_user(username: str) -> bool:
    conn = get_conn()
    cur = conn.execute("DELETE FROM users WHERE username = ?", (username,))
    conn.commit()
    conn.close()
    return cur.rowcount > 0


def update_password(username: str, new_password: str) -> bool:
    conn = get_conn()
    cur = conn.execute(
        "UPDATE users SET password = ? WHERE username = ?",
        (pwd_context.hash(new_password), username),
    )
    conn.commit()
    conn.close()
    return cur.rowcount > 0


# ── DRE helpers ───────────────────────────────────────────────────────────────

def save_dre_mes(username: str, mes: int, ano: int, input_data: dict, result_data: dict):
    conn = get_conn()
    user = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if not user:
        conn.close()
        return False
    conn.execute(
        """INSERT INTO dre_meses (user_id, mes, ano, input_json, result_json)
           VALUES (?, ?, ?, ?, ?)
           ON CONFLICT(user_id, mes, ano) DO UPDATE SET
               input_json = excluded.input_json,
               result_json = excluded.result_json,
               saved_at = datetime('now')""",
        (user["id"], mes, ano, json.dumps(input_data), json.dumps(result_data)),
    )
    conn.commit()
    conn.close()
    return True


def list_dre_meses(username: str):
    conn = get_conn()
    user = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if not user:
        conn.close()
        return []
    rows = conn.execute(
        "SELECT mes, ano, input_json, result_json, saved_at FROM dre_meses WHERE user_id = ? ORDER BY ano, mes",
        (user["id"],),
    ).fetchall()
    conn.close()
    return [
        {
            "mes": r["mes"],
            "ano": r["ano"],
            "input": json.loads(r["input_json"]),
            "resultado": json.loads(r["result_json"]),
            "saved_at": r["saved_at"],
        }
        for r in rows
    ]


def delete_dre_mes(username: str, mes: int, ano: int) -> bool:
    conn = get_conn()
    user = conn.execute("SELECT id FROM users WHERE username = ?", (username,)).fetchone()
    if not user:
        conn.close()
        return False
    cur = conn.execute(
        "DELETE FROM dre_meses WHERE user_id = ? AND mes = ? AND ano = ?",
        (user["id"], mes, ano),
    )
    conn.commit()
    conn.close()
    return cur.rowcount > 0
