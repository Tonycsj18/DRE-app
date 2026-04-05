import os
import json
import psycopg2
import psycopg2.extras
from passlib.context import CryptContext

DATABASE_URL = os.getenv("DATABASE_URL")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def get_conn() -> psycopg2.extensions.connection:
    conn = psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.RealDictCursor)
    return conn


def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id         SERIAL PRIMARY KEY,
            username   TEXT UNIQUE NOT NULL,
            password   TEXT NOT NULL,
            is_admin   BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    cur.execute("""
        CREATE TABLE IF NOT EXISTS dre_meses (
            id          SERIAL PRIMARY KEY,
            user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            mes         INTEGER NOT NULL,
            ano         INTEGER NOT NULL,
            tipo        TEXT NOT NULL DEFAULT 'completa',
            input_json  JSONB NOT NULL,
            result_json JSONB NOT NULL,
            saved_at    TIMESTAMPTZ DEFAULT NOW()
        )
    """)

    # Adiciona coluna tipo se ainda não existir (migração de versões antigas)
    cur.execute("""
        ALTER TABLE dre_meses ADD COLUMN IF NOT EXISTS tipo TEXT NOT NULL DEFAULT 'completa'
    """)

    # Adiciona constraint única incluindo tipo se ainda não existir
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'dre_meses_user_id_mes_ano_tipo_key'
            ) THEN
                BEGIN
                    ALTER TABLE dre_meses ADD CONSTRAINT dre_meses_user_id_mes_ano_tipo_key
                        UNIQUE (user_id, mes, ano, tipo);
                EXCEPTION WHEN duplicate_table THEN NULL;
                END;
            END IF;
        END$$
    """)

    conn.commit()

    # Cria usuário admin padrão
    admin_user = os.getenv("APP_USERNAME", "admin")
    admin_pass = os.getenv("APP_PASSWORD", "dre@2024")
    _upsert_user(cur, conn, admin_user, admin_pass, is_admin=True)

    # Usuários adicionais via APP_USERS (JSON)
    extra = os.getenv("APP_USERS", "")
    if extra:
        try:
            for uname, upass in json.loads(extra).items():
                _upsert_user(cur, conn, uname, upass, is_admin=False)
        except Exception:
            pass

    conn.commit()
    cur.close()
    conn.close()


def _upsert_user(cur, conn, username, password, is_admin=False):
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    if not cur.fetchone():
        cur.execute(
            "INSERT INTO users (username, password, is_admin) VALUES (%s, %s, %s)",
            (username, pwd_context.hash(password), is_admin),
        )


# ── User helpers ──────────────────────────────────────────────────────────────

def get_user(username: str):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE username = %s", (username,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    return dict(row) if row else None


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def list_users():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, username, is_admin, created_at FROM users ORDER BY created_at")
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [dict(r) for r in rows]


def create_user(username: str, password: str, is_admin: bool = False) -> bool:
    try:
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO users (username, password, is_admin) VALUES (%s, %s, %s)",
            (username, pwd_context.hash(password), is_admin),
        )
        conn.commit()
        cur.close()
        conn.close()
        return True
    except psycopg2.errors.UniqueViolation:
        return False


def delete_user(username: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("DELETE FROM users WHERE username = %s", (username,))
    affected = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return affected > 0


def update_password(username: str, new_password: str) -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "UPDATE users SET password = %s WHERE username = %s",
        (pwd_context.hash(new_password), username),
    )
    affected = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return affected > 0


# ── DRE helpers ───────────────────────────────────────────────────────────────

def save_dre_mes(username: str, mes: int, ano: int, input_data: dict, result_data: dict, tipo: str = "completa") -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    if not user:
        cur.close()
        conn.close()
        return False
    cur.execute(
        """INSERT INTO dre_meses (user_id, mes, ano, tipo, input_json, result_json)
           VALUES (%s, %s, %s, %s, %s, %s)
           ON CONFLICT (user_id, mes, ano, tipo) DO UPDATE SET
               input_json  = EXCLUDED.input_json,
               result_json = EXCLUDED.result_json,
               saved_at    = NOW()""",
        (user["id"], mes, ano, tipo, json.dumps(input_data), json.dumps(result_data)),
    )
    conn.commit()
    cur.close()
    conn.close()
    return True


def list_dre_meses(username: str, tipo: str = "completa"):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    if not user:
        cur.close()
        conn.close()
        return []
    cur.execute(
        "SELECT mes, ano, tipo, input_json, result_json, saved_at FROM dre_meses WHERE user_id = %s AND tipo = %s ORDER BY ano, mes",
        (user["id"], tipo),
    )
    rows = cur.fetchall()
    cur.close()
    conn.close()
    return [
        {
            "mes": r["mes"],
            "ano": r["ano"],
            "tipo": r["tipo"],
            "input": r["input_json"],
            "resultado": r["result_json"],
            "saved_at": r["saved_at"].isoformat() if r["saved_at"] else None,
        }
        for r in rows
    ]


def delete_dre_mes(username: str, mes: int, ano: int, tipo: str = "completa") -> bool:
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id FROM users WHERE username = %s", (username,))
    user = cur.fetchone()
    if not user:
        cur.close()
        conn.close()
        return False
    cur.execute(
        "DELETE FROM dre_meses WHERE user_id = %s AND mes = %s AND ano = %s AND tipo = %s",
        (user["id"], mes, ano, tipo),
    )
    affected = cur.rowcount
    conn.commit()
    cur.close()
    conn.close()
    return affected > 0
