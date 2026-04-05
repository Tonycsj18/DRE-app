import sys
print("[MAIN] Iniciando imports...", file=sys.stderr, flush=True)

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

print("[MAIN] FastAPI importado", file=sys.stderr, flush=True)

try:
    from app.routers import dre, auth, usuarios
    print("[MAIN] Routers base importados", file=sys.stderr, flush=True)
    from app.routers import dre_simples
    print("[MAIN] Router dre_simples importado", file=sys.stderr, flush=True)
except Exception as _e:
    print(f"[MAIN] ERRO no import de routers: {_e}", file=sys.stderr, flush=True)
    import traceback; traceback.print_exc()
    raise

import database
print("[MAIN] database importado", file=sys.stderr, flush=True)

app = FastAPI(
    title="DRE App API",
    description="API para automação da Demonstração do Resultado do Exercício",
    version="2.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    import traceback
    try:
        database.init_db()
    except Exception as e:
        print(f"[STARTUP ERROR] {e}", flush=True)
        traceback.print_exc()
        raise

app.include_router(auth.router)
app.include_router(dre.router)
app.include_router(dre_simples.router)
app.include_router(usuarios.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "DRE App API v2.1"}
