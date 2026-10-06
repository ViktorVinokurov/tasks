from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, groups, tasks, thoughts
from app.schemas import HealthRead


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Ежедневник API",
        description="Дела, мысли и группы пользователя в PostgreSQL.",
        version="1.0.0",
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.include_router(auth.router, prefix="/api")
    app.include_router(groups.router, prefix="/api")
    app.include_router(tasks.router, prefix="/api")
    app.include_router(thoughts.router, prefix="/api")

    @app.get("/health", response_model=HealthRead, tags=["Служебное"])
    def health() -> HealthRead:
        return HealthRead(status="ok")

    @app.get("/", include_in_schema=False)
    def root() -> dict[str, str]:
        return {"service": "ezhednevnik-api", "docs": "/docs", "health": "/health"}

    return app


app = create_app()
