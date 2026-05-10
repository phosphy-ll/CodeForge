from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text

from app.db.session import get_db

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("")
async def healthcheck():
    return {"status": "ok"}


@router.get("/db")
async def db_healthcheck(db: AsyncSession = Depends(get_db)):
    try:
        await db.execute(text("SELECT 1"))
        return {"status": "db_ok"}
    except Exception as e:
        return {"status": "db_error", "detail": str(e)}
