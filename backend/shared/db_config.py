"""
Shared database connection-pool configuration (#1128).

Python mirror of `packages/shared-utils/src/db-config.ts` — same field names,
same defaults, same environment variables, so a pool tuned in one language
behaves identically when read from the other. See
`docs/db-pool-conventions.md` for the full reference.

Neither `fraud_detection` nor `recommendations` holds a live pooled DB
connection today (both use in-memory stores — see the module docstrings in
`pipeline.py` and `service.py`). This module exists so that whichever service
adopts a real pool first reads its settings from one place instead of
inventing its own shape, and so the two Python services can already share one
config surface instead of drifting independently.

Query profiling (#1685)
-----------------------
`DB_QUERY_LOG_SLOW_MS` sets the threshold above which a query is logged as
slow. Services wrap their query execution in `time_query` (or use
`log_slow_query` directly) so slow queries surface through the structured
logger with a consistent shape. Index guidance for the tables these services
will query lives in `docs/db-pool-conventions.md`.

Usage
-----
Both `backend/fraud_detection` and `backend/recommendations` import this
module via a small `sys.path` bootstrap (see the top of `pipeline.py` /
`service.py`) since neither service is packaged as an installable Python
package:

    from db_config import load_db_pool_config

    db_pool = load_db_pool_config()
"""

from __future__ import annotations

import logging
import os
import time
from contextlib import contextmanager
from dataclasses import dataclass
from typing import Iterator, Optional


@dataclass(frozen=True)
class DbPoolConfig:
    """Tunable connection-pool parameters, mirrored from the TS `DbPoolConfig`."""

    max: int = 10
    min: int = 2
    idle_timeout_ms: int = 30_000
    connection_timeout_ms: int = 5_000
    retry_attempts: int = 3
    retry_backoff_ms: int = 250
    query_log_slow_ms: int = 500


DEFAULT_DB_POOL_CONFIG = DbPoolConfig()

logger = logging.getLogger(__name__)


def _int_env(name: str, default: int) -> int:
    raw = os.getenv(name)
    if raw is None or raw == "":
        return default
    try:
        return int(raw)
    except ValueError:
        return default


def load_db_pool_config() -> DbPoolConfig:
    """
    Load the effective DB pool configuration from environment variables,
    falling back to `DEFAULT_DB_POOL_CONFIG` for anything unset or invalid.

    Environment variables (shared with the TypeScript loader):
      DB_POOL_MAX
      DB_POOL_MIN
      DB_POOL_IDLE_TIMEOUT_MS
      DB_POOL_CONNECTION_TIMEOUT_MS
      DB_POOL_RETRY_ATTEMPTS
      DB_POOL_RETRY_BACKOFF_MS
      DB_QUERY_LOG_SLOW_MS
    """
    return DbPoolConfig(
        max=_int_env("DB_POOL_MAX", DEFAULT_DB_POOL_CONFIG.max),
        min=_int_env("DB_POOL_MIN", DEFAULT_DB_POOL_CONFIG.min),
        idle_timeout_ms=_int_env(
            "DB_POOL_IDLE_TIMEOUT_MS", DEFAULT_DB_POOL_CONFIG.idle_timeout_ms
        ),
        connection_timeout_ms=_int_env(
            "DB_POOL_CONNECTION_TIMEOUT_MS",
            DEFAULT_DB_POOL_CONFIG.connection_timeout_ms,
        ),
        retry_attempts=_int_env(
            "DB_POOL_RETRY_ATTEMPTS", DEFAULT_DB_POOL_CONFIG.retry_attempts
        ),
        retry_backoff_ms=_int_env(
            "DB_POOL_RETRY_BACKOFF_MS", DEFAULT_DB_POOL_CONFIG.retry_backoff_ms
        ),
        query_log_slow_ms=_int_env(
            "DB_QUERY_LOG_SLOW_MS", DEFAULT_DB_POOL_CONFIG.query_log_slow_ms
        ),
    )


def log_slow_query(
    operation: str,
    duration_ms: float,
    threshold_ms: Optional[int] = None,
) -> bool:
    """
    Log `operation` as a slow query when `duration_ms` exceeds the threshold.

    The threshold defaults to `DB_QUERY_LOG_SLOW_MS` (via
    `load_db_pool_config`) when not supplied. Returns True when the query was
    logged as slow, False otherwise.
    """
    if threshold_ms is None:
        threshold_ms = load_db_pool_config().query_log_slow_ms
    if duration_ms <= threshold_ms:
        return False
    logger.warning(
        "slow query: operation=%s duration_ms=%.1f threshold_ms=%d",
        operation,
        duration_ms,
        threshold_ms,
        extra={
            "event": "db_slow_query",
            "operation": operation,
            "duration_ms": duration_ms,
            "threshold_ms": threshold_ms,
        },
    )
    return True


@contextmanager
def time_query(
    operation: str,
    threshold_ms: Optional[int] = None,
) -> Iterator[None]:
    """
    Time a block of query execution and log it if it exceeds the threshold.

        with time_query("select_recent_transactions"):
            rows = conn.execute(...)
    """
    start = time.perf_counter()
    try:
        yield
    finally:
        duration_ms = (time.perf_counter() - start) * 1000.0
        log_slow_query(operation, duration_ms, threshold_ms)
