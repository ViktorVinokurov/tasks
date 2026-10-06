from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.database import SessionLocal
from app.routers import groups, tasks, thoughts
from app.schemas import HealthRead
from app.seed import seed_groups


@asynccontextmanager
async def lifespan(_app: FastAPI):
    settings = get_settings()
    if settings.seed_on_startup:
        db = SessionLocal()
        try:
            seed_groups(db)
            db.commit()
        finally:
            db.close()
    yield


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title="Ежедневник API",
        description="Дела, мысли и группы в PostgreSQL.",
        version="1.0.0",
        lifespan=lifespan,
    )
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_methods=["*"],
        allow_headers=["*"],
    )
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
