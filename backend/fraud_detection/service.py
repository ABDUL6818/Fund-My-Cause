"""Service layer for fraud-detection contribution handling.

This module owns the business logic that previously lived in
``backend/fraud_detection/stages/routes.py``.  Route handlers should only
parse/validate HTTP concerns and delegate to :class:`ContributionService`.

Dependencies (idempotency store, repository callables, logger) are injected
through the constructor so the service can be unit-tested without FastAPI.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any, Callable, Mapping, Optional, Protocol

from .models import ContributionEvent, ContributionPayload


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

#: Maximum accepted length for an idempotency key.
MAX_IDEMPOTENCY_KEY_LENGTH = 128

#: Default TTL (seconds) used when caching idempotency keys.
DEFAULT_IDEMPOTENCY_TTL_SECONDS = 24 * 60 * 60


# ---------------------------------------------------------------------------
# Errors
# ---------------------------------------------------------------------------


class ContributionServiceError(Exception):
    """Base class for contribution service errors."""


class InvalidIdempotencyKeyError(ContributionServiceError):
    """Raised when an idempotency key is missing, empty or too long."""


class DuplicateContributionError(ContributionServiceError):
    """Raised when a contribution with the same idempotency key already exists."""


class InvalidContributionPayloadError(ContributionServiceError):
    """Raised when the contribution payload cannot be parsed/validated."""


# ---------------------------------------------------------------------------
# Protocols / dependency contracts
# ---------------------------------------------------------------------------


class IdempotencyStore(Protocol):
    """Minimal contract for an idempotency key store.

    Implementations may be backed by Redis, an in-memory dict, etc.
    """

    def get(self, key: str) -> Optional[str]:
        """Return the stored value for ``key`` or ``None`` if absent."""

    def set(self, key: str, value: str, ttl_seconds: int) -> None:
        """Store ``value`` under ``key`` with a TTL."""


#: Repository callable signature: append a contribution event and return it.
AppendContribution = Callable[[ContributionEvent], ContributionEvent]

#: Repository callable signature: return the current queue depth.
QueueDepthProvider = Callable[[], int]


# ---------------------------------------------------------------------------
# Result types
# ---------------------------------------------------------------------------


@dataclass(frozen=True)
class ContributionResult:
    """Outcome of processing a contribution request."""

    event: ContributionEvent
    duplicate: bool = False


# ---------------------------------------------------------------------------
# Service
# ---------------------------------------------------------------------------


class ContributionService:
    """Business logic for accepting fraud-detection contributions.

    Parameters
    ----------
    idempotency_store:
        Store used to detect duplicate submissions.
    append_contribution:
        Repository callable that persists a :class:`ContributionEvent`.
    queue_depth_provider:
        Callable returning the current queue depth (used for logging).
    logger:
        Logger instance; defaults to the module logger.
    idempotency_ttl_seconds:
        TTL applied to idempotency keys.
    """

    def __init__(
        self,
        idempotency_store: IdempotencyStore,
        append_contribution: AppendContribution,
        queue_depth_provider: Optional[QueueDepthProvider] = None,
        logger: Optional[logging.Logger] = None,
        idempotency_ttl_seconds: int = DEFAULT_IDEMPOTENCY_TTL_SECONDS,
    ) -> None:
        self._idempotency_store = idempotency_store
        self._append_contribution = append_contribution
        self._queue_depth_provider = queue_depth_provider
        self._logger = logger or logging.getLogger(__name__)
        self._idempotency_ttl_seconds = idempotency_ttl_seconds

    # -- public API ---------------------------------------------------------

    def submit_contribution(
        self,
        raw_payload: Mapping[str, Any],
        idempotency_key: Optional[str],
    ) -> ContributionResult:
        """Validate and enqueue a contribution.

        Raises
        ------
        InvalidIdempotencyKeyError
            If the key is missing, empty or too long.
        DuplicateContributionError
            If the key has already been used.
        InvalidContributionPayloadError
            If the payload cannot be parsed into a :class:`ContributionPayload`.
        """
        key = self._validate_idempotency_key(idempotency_key)

        if self._is_duplicate(key):
            self._logger.info(
                "Duplicate contribution rejected for idempotency key %s", key
            )
            raise DuplicateContributionError(
                f"Contribution with idempotency key {key!r} already exists"
            )

        payload = self._parse_payload(raw_payload)
        event = self._build_event(payload, key)

        self._log_queue_depth()

        stored_event = self._append_contribution(event)

        # Only mark the key as used once the event is persisted, so a failed
        # append does not permanently block a retry.
        self._idempotency_store.set(
            key, stored_event.id, self._idempotency_ttl_seconds
        )

        self._logger.info(
            "Contribution %s enqueued for idempotency key %s",
            stored_event.id,
            key,
        )
        return ContributionResult(event=stored_event, duplicate=False)

    # -- internals ----------------------------------------------------------

    def _validate_idempotency_key(self, idempotency_key: Optional[str]) -> str:
        if idempotency_key is None:
            raise InvalidIdempotencyKeyError("Idempotency key is required")
        key = idempotency_key.strip()
        if not key:
            raise InvalidIdempotencyKeyError("Idempotency key must not be empty")
        if len(key) > MAX_IDEMPOTENCY_KEY_LENGTH:
            raise InvalidIdempotencyKeyError(
                "Idempotency key exceeds maximum length of "
                f"{MAX_IDEMPOTENCY_KEY_LENGTH} characters"
            )
        return key

    def _is_duplicate(self, key: str) -> bool:
        return self._idempotency_store.get(key) is not None

    def _parse_payload(self, raw_payload: Mapping[str, Any]) -> ContributionPayload:
        try:
            return ContributionPayload.parse(raw_payload)
        except Exception as exc:  # noqa: BLE001 - normalize to service error
            raise InvalidContributionPayloadError(
                f"Invalid contribution payload: {exc}"
            ) from exc

    def _build_event(
        self, payload: ContributionPayload, idempotency_key: str
    ) -> ContributionEvent:
        return ContributionEvent.from_payload(
            payload, idempotency_key=idempotency_key
        )

    def _log_queue_depth(self) -> None:
        if self._queue_depth_provider is None:
            return
        try:
            depth = self._queue_depth_provider()
        except Exception:  # noqa: BLE001 - logging must never break the request
            self._logger.warning("Failed to read contribution queue depth")
            return
        self._logger.info("Contribution queue depth: %s", depth)