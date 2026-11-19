"""
Shared error-response schema for Fund-My-Cause backend services.

All HTTP error responses MUST be constructed through this module so clients
can rely on a consistent envelope regardless of which service produced the error.

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
    from shared.error_schema import bad_request, internal_error

    @app.get("/endpoint")
    def handler():
        if invalid_param:
            return bad_request("message", detail=f"context")
        ...
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Optional

from fastapi.responses import JSONResponse


class ErrorCode:
    BAD_REQUEST: str = "BAD_REQUEST"
    NOT_FOUND: str = "NOT_FOUND"
    UNPROCESSABLE_ENTITY: str = "UNPROCESSABLE_ENTITY"
    INTERNAL_ERROR: str = "INTERNAL_ERROR"
    SERVICE_UNAVAILABLE: str = "SERVICE_UNAVAILABLE"


@dataclass
class ErrorDetail:
    code: str
    message: str
    detail: Optional[str] = None


@dataclass
class ErrorEnvelope:
    error: ErrorDetail

    def to_dict(self) -> Dict[str, Any]:
        result: Dict[str, Any] = {
            "error": {
                "code": self.error.code,
                "message": self.error.message,
            }
        }
        if self.error.detail is not None:
            result["error"]["detail"] = self.error.detail
        return result


def _make_response(
    http_status: int,
    code: str,
    message: str,
    detail: Optional[str] = None,
) -> JSONResponse:
    envelope = ErrorEnvelope(error=ErrorDetail(code=code, message=message, detail=detail))
    return JSONResponse(status_code=http_status, content=envelope.to_dict())


def bad_request(message: str, detail: Optional[str] = None) -> JSONResponse:
    return _make_response(400, ErrorCode.BAD_REQUEST, message, detail)


def not_found(message: str, detail: Optional[str] = None) -> JSONResponse:
    return _make_response(404, ErrorCode.NOT_FOUND, message, detail)


def unprocessable_entity(message: str, detail: Optional[str] = None) -> JSONResponse:
    return _make_response(422, ErrorCode.UNPROCESSABLE_ENTITY, message, detail)


def internal_error(message: str = "An unexpected error occurred", detail: Optional[str] = None) -> JSONResponse:
    return _make_response(500, ErrorCode.INTERNAL_ERROR, message, detail)


def service_unavailable(message: str, detail: Optional[str] = None) -> JSONResponse:
    return _make_response(503, ErrorCode.SERVICE_UNAVAILABLE, message, detail)


# OpenAPI schema describing the error envelope, for use in route
# ``responses={...}`` declarations so the generated spec documents errors.
ERROR_RESPONSE_SCHEMA: Dict[str, Any] = {
    "type": "object",
    "required": ["error"],
    "properties": {
        "error": {
            "type": "object",
            "required": ["code", "message"],
            "properties": {
                "code": {
                    "type": "string",
                    "enum": [
                        ErrorCode.BAD_REQUEST,
                        ErrorCode.NOT_FOUND,
                        ErrorCode.UNPROCESSABLE_ENTITY,
                        ErrorCode.INTERNAL_ERROR,
                        ErrorCode.SERVICE_UNAVAILABLE,
                    ],
                },
                "message": {"type": "string"},
                "detail": {"type": "string", "nullable": True},
            },
        }
    },
}


def error_response(status_code: int, description: str) -> Dict[str, Any]:
    """Build a FastAPI ``responses`` entry documenting the error envelope."""
    return {
        "description": description,
        "content": {"application/json": {"schema": ERROR_RESPONSE_SCHEMA}},
    }
