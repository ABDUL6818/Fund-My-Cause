"""
Shared error-response schema for the Fund-My-Cause recommendation service.

All HTTP error responses from this service MUST be constructed through this
module so clients can rely on a consistent envelope regardless of which
endpoint produced the error.

Error envelope
──────────────
{
    "error": {
        "code":    "<SCREAMING_SNAKE_CASE string>",
        "message": "<human-readable description>",
        "detail":  "<optional extra context, may be null>"
    }
}

Standard error codes
────────────────────
BAD_REQUEST         – malformed query parameters (e.g. limit out of range)
NOT_FOUND           – requested resource does not exist
INTERNAL_ERROR      – unexpected server-side failure
SERVICE_UNAVAILABLE – dependency unavailable (e.g. upstream data store)

Usage example
─────────────
    from error_schema import bad_request, internal_error

    @app.get("/recommendations")
    def get_recommendations(limit: int = Query(5, ge=1, le=20)):
        if limit > 20:
            return bad_request("limit must be between 1 and 20", detail=f"got {limit}")
        ...
"""

from __future__ import annotations

# Re-export the shared central error classes and factory helpers so existing
# imports (``from error_schema import bad_request``) keep working unchanged.
from shared.error_schema import (  # noqa: F401
    ErrorCode,
    ErrorDetail,
    ErrorEnvelope,
    bad_request,
    internal_error,
    not_found,
    service_unavailable,
)

__all__ = [
    "ErrorCode",
    "ErrorDetail",
    "ErrorEnvelope",
    "bad_request",
    "not_found",
    "internal_error",
    "service_unavailable",
]
