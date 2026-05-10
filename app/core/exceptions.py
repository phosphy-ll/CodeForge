class AppError(Exception):
    def __init__(self, detail: str, status_code: int = 400):
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


class NotFoundError(AppError):
    def __init__(self, detail: str = "Not found"):
        super().__init__(detail=detail, status_code=404)


class ForbiddenError(AppError):
    def __init__(self, detail: str = "Forbidden"):
        super().__init__(detail=detail, status_code=403)


class UnauthorizedError(AppError):
    def __init__(self, detail: str = "Unauthorized"):
        super().__init__(detail=detail, status_code=401)


class ValidationAppError(AppError):
    def __init__(self, detail: str = "Validation error"):
        super().__init__(detail=detail, status_code=400)


class RateLimitError(AppError):
    def __init__(self, detail: str = "Too many requests"):
        super().__init__(detail=detail, status_code=429)
