import time
import uuid

from fastapi import FastAPI, Request
from starlette.middleware.base import BaseHTTPMiddleware


class RequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id

        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start

        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = f"{duration:.5f}"

        return response


def setup_middlewares(app: FastAPI) -> None:
    app.add_middleware(RequestContextMiddleware)
