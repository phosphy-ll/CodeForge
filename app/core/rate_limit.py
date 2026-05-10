from collections import defaultdict, deque
from datetime import datetime, timedelta, timezone


class InMemoryRateLimiter:
    def __init__(self) -> None:
        self.storage: dict[str, deque] = defaultdict(deque)

    def check(self, key: str, limit: int, window_seconds: int) -> bool:
        now = datetime.now(timezone.utc)
        window_start = now - timedelta(seconds=window_seconds)

        bucket = self.storage[key]

        while bucket and bucket[0] < window_start:
            bucket.popleft()

        if len(bucket) >= limit:
            return False

        bucket.append(now)
        return True


rate_limiter = InMemoryRateLimiter()
