from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings

settings = get_settings()


def setup_cors(app):
    if settings.DEBUG:
        origins = [
            "http://localhost:3000",
            "http://127.0.0.1:3000",
            "https://codeforgeapp.com",
            "https://www.codeforgeapp.com",
            "https://api.codeforgeapp.com",
        ]
    else:
        origins = [
            "https://codeforgeapp.com",
            "https://www.codeforgeapp.com",
        ]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=[
            "Authorization",
            "Content-Type",
            "Accept",
            "Origin",
            "X-Requested-With",
        ],
        expose_headers=[
            "X-Request-ID",
            "X-Process-Time",
        ],
    )