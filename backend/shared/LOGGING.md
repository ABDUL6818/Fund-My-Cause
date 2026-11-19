# Structured Logging Standard

All backend services (`fraud_detection`, `recommendations`, and `shared` modules) use structured logging via the `structured_logger` module. Node services emit the same event shape through pino, so a single set of field names applies across the backend.

## Quick Start

```python
from backend.shared.structured_logger import (
    configure_structlog,
    get_logger,
    get_request_logger,
    log_info,
    log_error,
)

configure_structlog()  # once, at service startup

logger = get_logger(__name__)            # module/service scope
request_logger = get_request_logger()    # request scope (carries request ID)
log_info(logger, "Campaign processed", campaign_id="c123", score=0.85)
log_error(request_logger, "Processing failed", campaign_id="c123", reason="timeout")
```

- `configure_structlog()` must be called exactly once during service initialization, before any logger is used. It installs the JSON renderer and the request-context middleware.
- `get_logger(name)` returns a service/module-scoped logger for startup, background workers, and code outside a request.
- `get_request_logger()` returns a logger bound to the active request context. Use it inside request handlers so the request ID is attached automatically.
- `log_info` / `log_error` (and the other level helpers) are thin wrappers that emit structured events with keyword context.

## Request ID and Trace ID Propagation

Every inbound request is assigned a request ID (reused from the `x-request-id` header when present, otherwise generated). The ID is:

- stored in the request context and merged into every event emitted through `get_request_logger()`;
- echoed back in the `x-request-id` response header;
- exposed as `trace_id` on request-scoped fraud-detection events, and returned in the `x-trace-id` response header.

Background workers and startup events only carry a request/trace ID when it is explicitly propagated to that work (for example, by passing the ID into the queued job). Never invent or reuse an ID across unrelated requests.

## Field Names (pino-equivalent)

Python and Node services emit the same logical fields so logs can be queried uniformly:

| Logical field | Python (`structured_logger`) | Node (pino) |
| --- | --- | --- |
| Event name | `event` | `event` (or `msg`) |
| Request ID | `request_id` | `req.id` / `request_id` |
| Trace ID | `trace_id` | `trace_id` |
| Log level | `level` | `level` |
| Timestamp | `timestamp` | `time` |
| Logger name | `logger` | `name` |
| Error detail | `error` | `err` / `error` |

Keep the logical field names (`event`, `request_id`, `trace_id`) stable across languages; only the serialized key names differ per runtime.

## Log Levels

- **DEBUG**: Detailed diagnostic information
  - Function entry/exit
  - Variable values at key decision points
  - Loop iterations and internal calculations
  - Use sparingly in production

- **INFO**: General informational messages
  - Service startup/shutdown
  - Configuration loading
  - Significant state changes
  - Completed operations

- **WARNING**: Warning messages for potentially problematic situations
  - Recovered errors
  - Deprecated usage
  - Threshold violations
  - Unexpected but handled conditions

- **ERROR**: Error conditions requiring attention
  - Failed operations
  - Unrecovered exceptions
  - Critical configuration issues

## Structured Context

Always include relevant context as keyword arguments:

```python
log_info(logger, "Flag enqueued", 
         flag_id="FLAG-123", 
         campaign_id="camp_45", 
         severity="HIGH",
         reason="WASH_CONTRIBUTION")
```

Context fields help with:
- Debugging issues
- Monitoring and alerting
- Performance analysis
- Audit trails

## Fraud Detection Fields

The `event` field contains the event name. Fraud events use these additional
fields where applicable:

| Event or event group | Fields |
| --- | --- |
| `request_started`, `request_completed` | `method`, `path`; completion also has `status_code` |
| `contribution_queued`, `job_processed` | `campaign_id`, `contributor`; queued events also have `amount`, `tx_hash`, `queue_depth`; processed events also have `new_flags`, `processing_latency_ms`, `queue_depth_after`, `total_jobs_processed` |
| `contributions_idempotency_*` | `idempotency_key` or `key_length`, depending on the event |
| `contributions_ingest_invalid_payload`, `job_processing_error` | `error`; worker errors also have `campaign_id` |
| `scan_completed` | `new_flags`, `queue_depth` |
| `moderation_queue_queried` | `returned`, `total` |
| `flag_marked_reviewed`, `flag_not_found` | `flag_id` |

Other event-specific fields include `component`, `operation`, `store_size`,
and resolved database-pool settings. Do not add secrets or credentials to log
context.

## Configuration

The structured logging is configured once at startup. Services should call
`configure_structlog()` during initialization:

```python
from backend.shared.structured_logger import configure_structlog

configure_structlog()
```

## Migration from print() and console.*

Replace `print()` (Python) and `console.*` (Node) statements with structured logging:

```python
# Before
print(f"Processing campaign {campaign_id}")
print("Error:", str(error))

# After
log_info(logger, "Processing campaign", campaign_id=campaign_id)
log_error(logger, "Processing failed", error=str(error))
```

```js
// Before
console.log(`Processing campaign ${campaignId}`);
console.error("Error:", error);

// After
logger.info({ event: "campaign_processing", campaign_id: campaignId });
logger.error({ event: "campaign_processing_failed", err: error });
```

## Route/Service Split: Where to Log

Keep logging out of route handlers except for request lifecycle events:

- **Routes** (HTTP handlers): log only `request_started` / `request_completed` (with `method`, `path`, `status_code`) using `get_request_logger()`. Do not log business logic here.
- **Services** (business logic): log domain events (`campaign_processed`, `flag_enqueued`, etc.) with their context fields. Use `get_request_logger()` when called within a request so the request ID propagates; use `get_logger(__name__)` for background/worker code.
- **Workers/startup**: use `get_logger(__name__)`; propagate a request/trace ID explicitly only when the work belongs to a specific request.

## Zero Bare print() / console.* Calls

The backend has zero bare `print()` calls and zero `console.*` calls. All
logging uses the structured logger (Python) or pino (Node) for consistency,
traceability, and operational visibility. New code must not introduce
`print()` or `console.*`; enforce this in review and lint.
