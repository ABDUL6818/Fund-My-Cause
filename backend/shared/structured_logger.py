"""
Structured logging standard for backend services.

Provides a centralized logger configuration that ensures consistent
logging across fraud_detection, recommendations, and shared modules.
Replaces ad-hoc print statements and inconsistent logging calls.

Log levels follow this convention:
- DEBUG: Detailed diagnostic information (function entry/exit, variable values)
- INFO: General informational messages (service startup, configuration details)
- WARNING: Warning messages (recovered errors, deprecated usage, potential issues)
- ERROR: Error conditions (failed operations, exceptions)
"""

import os

import structlog


def get_logger(name: str) -> structlog.BoundLogger:
    """
    Get a configured logger for a module.

    Replaces logging.getLogger() with structlog configuration.
    Use this in any module that needs to log.

    Args:
        name: Module name (typically __name__)

    Returns:
        Configured structlog logger with consistent formatting
    """
    return structlog.get_logger(name)


def get_request_logger(trace_id: str, name: str = "request") -> structlog.BoundLogger:
    """
    Get a logger bound to a request/trace ID.

    The trace ID is bound via structlog contextvars so it is merged into
    every emitted event, including events logged by nested loggers that
    share the same context.

    Args:
        trace_id: Request/trace identifier to attach to log records
        name: Logger name (defaults to "request")

    Returns:
        Configured structlog logger with the trace ID bound
    """
    return structlog.get_logger(name).bind(trace_id=trace_id)


def configure_structlog() -> None:
    """
    Configure structlog with standard processors and formatting.

    Should be called once at application startup, typically in the
    main entry point or initialization module.

    Output format is selected via the LOG_FORMAT environment variable:
    - "json" (default in production): machine-readable JSON lines
    - "console" (default otherwise): human-readable console output
    """
    log_format = os.getenv("LOG_FORMAT", "json").lower()
    if log_format == "console":
        renderer: structlog.types.Processor = structlog.dev.ConsoleRenderer()
    else:
        renderer = structlog.processors.JSONRenderer()

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.stdlib.filter_by_level,
            structlog.stdlib.add_logger_name,
            structlog.stdlib.add_log_level,
            structlog.stdlib.PositionalArgumentsFormatter(),
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.StackInfoRenderer(),
            structlog.processors.format_exc_info,
            structlog.processors.UnicodeDecoder(),
            renderer,
        ],
        context_class=dict,
        logger_factory=structlog.stdlib.LoggerFactory(),
        cache_logger_on_first_use=True,
    )
