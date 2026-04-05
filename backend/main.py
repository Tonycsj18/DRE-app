from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import dre, auth

app = FastAPI(
    title="DRE App API",
    description="API para automação da Demonstração do Resultado do Exercício",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dre.router)


@app.get("/")
def root():
    return {"status": "ok", "message": "DRE App API rodando"}
