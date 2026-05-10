from logging.config import fileConfig

from sqlalchemy import pool
from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import async_engine_from_config
from app.models.notification import Notification
from alembic import context

from app.core.config import get_settings
from app.db.base import Base

# Импортируем все модели здесь, чтобы metadata знала таблицы
from app.models.achievement import Achievement, UserAchievement  # noqa: F401
from app.models.audit_log import AuditLog  # noqa: F401
from app.models.daily_plan import DailyPlan, DailyPlanTask  # noqa: F401
from app.models.goal import Goal  # noqa: F401
from app.models.leaderboard import LeaderboardEntry  # noqa: F401
from app.models.milestone import Milestone  # noqa: F401
from app.models.practice_attempt import PracticeAttempt  # noqa: F401
from app.models.streak import StreakLog, UserStreak  # noqa: F401
from app.models.subscription_plan import SubscriptionPlan  # noqa: F401
from app.models.task import Task  # noqa: F401
from app.models.task_submission import TaskSubmission  # noqa: F401
from app.models.user import User  # noqa: F401
from app.models.user_session import UserSession  # noqa: F401
from app.models.exam_attempt import ExamAttempt
from app.models.notification import Notification
from app.models.streak import UserStreak, StreakLog

config = context.config

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

settings = get_settings()
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def do_run_migrations(connection: Connection) -> None:
    context.configure(
        connection=connection,
        target_metadata=target_metadata,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


async def run_async_migrations() -> None:
    connectable = async_engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    async with connectable.connect() as connection:
        await connection.run_sync(do_run_migrations)

    await connectable.dispose()


def run_migrations_online() -> None:
    import asyncio
    asyncio.run(run_async_migrations())


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
