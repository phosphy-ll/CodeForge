from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.api.router import api_router
from app.core.cors import setup_cors
from app.core.exceptions import AppError
from app.core.middleware import RequestContextMiddleware

app = FastAPI(title="CodeForge API")

app.add_middleware(RequestContextMiddleware)
setup_cors(app)


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
