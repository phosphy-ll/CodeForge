from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.api.router import api_router
from app.core.cors import setup_cors
from app.core.exceptions import AppError
from app.core.middleware import RequestContextMiddleware

from app.core.config import get_settings

settings = get_settings()

app = FastAPI(
    docs_url=None if not settings.DEBUG else "/docs",
    redoc_url=None if not settings.DEBUG else "/redoc",
    openapi_url=None if not settings.DEBUG else "/openapi.json",
)

app.add_middleware(RequestContextMiddleware)
setup_cors(app)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://codeforgeapp.com",
        "https://www.codeforgeapp.com",
        "https://code-forge.vercel.app",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )


@app.exception_handler(Exception)
async def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(api_router, prefix="/api/v1")
