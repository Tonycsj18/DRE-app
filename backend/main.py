from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import dre, auth, usuarios, dre_simples
import database

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
    database.init_db()

app.include_router(auth.router)
app.include_router(dre.router)
app.include_router(dre_simples.router)
app.include_router(usuarios.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "DRE App API v2.1"}
