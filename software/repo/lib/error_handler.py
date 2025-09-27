"""
Unified error handling middleware for FastAPI.
"""

import logging
import traceback
from typing import Union
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from starlette.exceptions import HTTPException as StarletteHTTPException
from sqlalchemy.exc import IntegrityError, SQLAlchemyError
from pydantic import ValidationError

from validate import (
    create_error_response,
    map_validation_error_to_http,
    map_database_error_to_http
)

logger = logging.getLogger(__name__)


class AppError(Exception):
    """Base application error."""
    
    def __init__(self, message: str, code: str = "app_error", status_code: int = 500, details: dict = None):
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)


class ValidationAppError(AppError):
    """Validation error."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "validation_error", 422, details)


class NotFoundError(AppError):
    """Resource not found error."""
    
    def __init__(self, resource_type: str, resource_id: str):
        message = f"{resource_type} with id '{resource_id}' not found"
        super().__init__(message, "not_found", 404)


class ConflictError(AppError):
    """Resource conflict error."""
    
    def __init__(self, message: str, details: dict = None):
        super().__init__(message, "conflict", 409, details)


class UnauthorizedError(AppError):
    """Unauthorized access error."""
    
    def __init__(self, message: str = "Unauthorized access"):
        super().__init__(message, "unauthorized", 401)


class ForbiddenError(AppError):
    """Forbidden access error."""
    
    def __init__(self, message: str = "Forbidden access"):
        super().__init__(message, "forbidden", 403)


class RateLimitError(AppError):
    """Rate limit exceeded error."""
    
    def __init__(self, message: str = "Rate limit exceeded"):
        super().__init__(message, "rate_limit", 429)


def create_app_error_response(error: AppError) -> JSONResponse:
    """Create JSONResponse from AppError."""
    return JSONResponse(
        status_code=error.status_code,
        content=create_error_response(
            error.message,
            error.code,
            error.status_code,
            error.details
        )
    )


async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
    """Handle AppError exceptions."""
    logger.warning(f"AppError: {exc.message} (code: {exc.code})")
    return create_app_error_response(exc)


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle HTTPException exceptions."""
    logger.warning(f"HTTPException: {exc.detail}")
    
    # Use detail as error message if it's a string
    if isinstance(exc.detail, str):
        error_message = exc.detail
        error_code = "http_error"
        details = None
    elif isinstance(exc.detail, dict):
        # If detail is already a dict, use it directly
        return JSONResponse(status_code=exc.status_code, content=exc.detail)
    else:
        error_message = "HTTP error occurred"
        error_code = "http_error"
        details = {"detail": str(exc.detail)}
    
    return JSONResponse(
        status_code=exc.status_code,
        content=create_error_response(error_message, error_code, exc.status_code, details)
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors."""
    logger.warning(f"Validation error: {exc}")
    
    status_code, error_response = map_validation_error_to_http(exc)
    return JSONResponse(status_code=status_code, content=error_response)


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle database exceptions."""
    logger.error(f"Database error: {exc}")
    
    status_code, error_response = map_database_error_to_http(exc)
    return JSONResponse(status_code=status_code, content=error_response)


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle general exceptions."""
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    
    # In production, don't expose internal error details
    import os
    is_production = os.getenv("NODE_ENV") == "production"
    
    if is_production:
        error_message = "Internal server error"
        error_code = "internal_error"
        details = None
    else:
        error_message = str(exc)
        error_code = "internal_error"
        details = {
            "traceback": traceback.format_exc()
        }
    
    return JSONResponse(
        status_code=500,
        content=create_error_response(error_message, error_code, 500, details)
    )


def setup_error_handlers(app: FastAPI) -> None:
    """Setup all error handlers for the FastAPI app."""
    
    # App-specific errors
    app.add_exception_handler(AppError, app_error_handler)
    
    # HTTP exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    
    # Validation errors
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(ValidationError, validation_exception_handler)
    
    # Database errors
    app.add_exception_handler(IntegrityError, database_exception_handler)
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)
    
    # General exception handler (must be last)
    app.add_exception_handler(Exception, general_exception_handler)


# Utility functions for raising errors

def raise_not_found(resource_type: str, resource_id: str) -> None:
    """Raise NotFoundError."""
    raise NotFoundError(resource_type, resource_id)


def raise_unauthorized(message: str = "Unauthorized access") -> None:
    """Raise UnauthorizedError."""
    raise UnauthorizedError(message)


def raise_forbidden(message: str = "Forbidden access") -> None:
    """Raise ForbiddenError."""
    raise ForbiddenError(message)


def raise_conflict(message: str, details: dict = None) -> None:
    """Raise ConflictError."""
    raise ConflictError(message, details)


def raise_validation_error(message: str, details: dict = None) -> None:
    """Raise ValidationAppError."""
    raise ValidationAppError(message, details)


def raise_rate_limit(message: str = "Rate limit exceeded") -> None:
    """Raise RateLimitError."""
    raise RateLimitError(message)


# Error response helpers for common scenarios

def not_found_response(resource_type: str, resource_id: str) -> JSONResponse:
    """Create not found response."""
    error = NotFoundError(resource_type, resource_id)
    return create_app_error_response(error)


def unauthorized_response(message: str = "Unauthorized access") -> JSONResponse:
    """Create unauthorized response."""
    error = UnauthorizedError(message)
    return create_app_error_response(error)


def forbidden_response(message: str = "Forbidden access") -> JSONResponse:
    """Create forbidden response."""
    error = ForbiddenError(message)
    return create_app_error_response(error)


def conflict_response(message: str, details: dict = None) -> JSONResponse:
    """Create conflict response."""
    error = ConflictError(message, details)
    return create_app_error_response(error)


def validation_error_response(message: str, details: dict = None) -> JSONResponse:
    """Create validation error response."""
    error = ValidationAppError(message, details)
    return create_app_error_response(error)


def rate_limit_response(message: str = "Rate limit exceeded") -> JSONResponse:
    """Create rate limit response."""
    error = RateLimitError(message)
    return create_app_error_response(error)


# Example usage and testing
if __name__ == "__main__":
    # Test error creation
    print("Testing error handling...")
    
    # Test AppError
    try:
        raise AppError("Test error", "test_code", 400)
    except AppError as e:
        print(f"✅ AppError: {e.message} (code: {e.code}, status: {e.status_code})")
    
    # Test NotFoundError
    try:
        raise NotFoundError("Bot", "bot-123")
    except NotFoundError as e:
        print(f"✅ NotFoundError: {e.message}")
    
    # Test ValidationAppError
    try:
        raise ValidationAppError("Invalid input", {"field": "name"})
    except ValidationAppError as e:
        print(f"✅ ValidationAppError: {e.message}")
        print(f"   Details: {e.details}")
    
    # Test error response creation
    error = NotFoundError("User", "user-123")
    response = create_app_error_response(error)
    print(f"✅ Error response: {response.status_code} - {response.body}")
    
    print("Error handling tests completed!")