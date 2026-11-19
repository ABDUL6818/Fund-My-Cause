"""
HTTP route handlers for the fraud detection pipeline.

All FastAPI route logic lives here so that pipeline.py remains a thin
orchestrator (app construction + lifespan only).
"""

from __future__ import annotations

import time
from typing import Optional

import structlog
from fastapi import BackgroundTasks, Request
from fastapi.responses import JSONResponse

from error_schema import not_found
from repository import FlagReason, get_flags, mark_flag_reviewed, total_flag_count
from scoring import run_full_scan

from stages.contribution_service import ContributionService
from stages.idempotency import IDEMPOTENCY_KEY_HEADER
from stages.scoring_worker import get_metrics

log: structlog.BoundLogger = structlog.get_logger("fraud_detection")


def healthz() -> dict:
    return {"status": "ok", "timestamp": time.time()}


def readyz() -> dict:
    return {"ready": True, "checks": {"service": "ready", "queue": "ok"}, "timestamp": time.time()}


def make_ingest_contribution(service: ContributionService):
    """Build the ingest controller bound to an injected ContributionService."""

    async def ingest_contribution(request: Request) -> JSONResponse:
        """Accept a contribution; delegate all business logic to the service."""
        idempotency_key: Optional[str] = request.headers.get(IDEMPOTENCY_KEY_HEADER)
        try:
            body = await request.json()
        except Exception as exc:
            log.warning("contributions_ingest_invalid_payload", error=str(exc))
            return service.invalid_payload_response()
        return service.ingest(body, idempotency_key=idempotency_key)

    return ingest_contribution


def trigger_scan(background_tasks: BackgroundTasks) -> dict:
    log.info("scan_scheduled")
    background_tasks.add_task(run_full_scan, force_duplicate_scan=True)
    return {"status": "scan_scheduled"}


def get_metrics_handler() -> dict:
    return get_metrics()


def moderation_queue_handler(
    reviewed: Optional[bool] = None,
    reason: Optional[FlagReason] = None,
    limit: int = 50,
) -> JSONResponse:
    items = get_flags(reviewed=reviewed, reason=reason, limit=limit)
    log.debug("moderation_queue_queried", returned=len(items), total=total_flag_count())
    return JSONResponse(content={
        "total": total_flag_count(), "returned": len(items),
        "flags": [{"id": f.id, "reason": f.reason, "severity": f.severity,
                   "campaign_id": f.campaign_id, "wallet": f.wallet, "detail": f.detail,
                   "flagged_at": f.flagged_at, "reviewed": f.reviewed} for f in items],
    })


def mark_reviewed_handler(flag_id: str) -> dict:
    found = mark_flag_reviewed(flag_id)
    if found:
        log.info("flag_marked_reviewed", flag_id=flag_id)
        return {"status": "updated", "id": flag_id}
    log.warning("flag_not_found", flag_id=flag_id)
    return not_found("flag not found")
