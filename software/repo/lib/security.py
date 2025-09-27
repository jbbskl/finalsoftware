"""
Security middleware and utilities for CSRF protection, CORS, and session security.
"""

import os
import secrets
from typing import List, Optional, Callable
from fastapi import FastAPI, Request, Response, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
import logging

logger = logging.getLogger(__name__)


class CSRFProtectionMiddleware(BaseHTTPMiddleware):
    """
    CSRF protection middleware for state-changing routes.
    """
    
    def __init__(self, app, secret_key: str, exempt_paths: Optional[List[str]] = None):
        super().__init__(app)
        self.secret_key = secret_key.encode() if isinstance(secret_key, str) else secret_key
        self.exempt_paths = exempt_paths or [
            "/healthz",
            "/readyz", 
            "/api/billing/webhook/stripe",
            "/api/billing/webhook/crypto",
            "/api/bot-instances/*/logs/stream"  # SSE endpoint
        ]
    
    async def dispatch(self, request: Request, call_next: Callable):
        # Skip CSRF check for exempt paths
        if self._is_exempt_path(request.url.path):
            return await call_next(request)
        
        # Skip CSRF check for safe methods
        if request.method in ["GET", "HEAD", "OPTIONS"]:
            return await call_next(request)
        
        # Check for CSRF token
        csrf_token = request.headers.get("X-CSRF-Token")
        if not csrf_token:
            logger.warning(f"Missing CSRF token for {request.method} {request.url.path}")
            return JSONResponse(
                status_code=403,
                content={"error": "CSRF token required", "code": "csrf_token_missing"}
            )
        
        # Validate CSRF token (simplified - in production use proper session-based tokens)
        if not self._validate_csrf_token(csrf_token):
            logger.warning(f"Invalid CSRF token for {request.method} {request.url.path}")
            return JSONResponse(
                status_code=403,
                content={"error": "Invalid CSRF token", "code": "csrf_token_invalid"}
            )
        
        return await call_next(request)
    
    def _is_exempt_path(self, path: str) -> bool:
        """Check if path is exempt from CSRF protection."""
        for exempt_path in self.exempt_paths:
            if exempt_path.endswith("*"):
                if path.startswith(exempt_path[:-1]):
                    return True
            elif path == exempt_path:
                return True
        return False
    
    def _validate_csrf_token(self, token: str) -> bool:
        """
        Validate CSRF token.
        In production, this should validate against a session-based token.
        For now, we'll use a simple secret-based validation.
        """
        # In a real implementation, this would:
        # 1. Extract the token from the request
        # 2. Validate it against the session
        # 3. Check expiration
        # For now, we'll accept any non-empty token as valid
        return bool(token and len(token) > 10)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Add security headers to all responses.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        response = await call_next(request)
        
        # Security headers
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Permissions-Policy"] = "geolocation=(), microphone=(), camera=()"
        
        # HSTS for HTTPS
        if request.url.scheme == "https":
            response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        return response


def setup_cors(app: FastAPI, allowed_origins: List[str], cookie_domain: Optional[str] = None):
    """
    Setup CORS middleware with security considerations.
    """
    # Validate origins in production
    if os.getenv("NODE_ENV") == "production":
        if "*" in allowed_origins:
            raise ValueError("Wildcard CORS origins not allowed in production")
        
        if not allowed_origins:
            raise ValueError("At least one CORS origin must be specified in production")
    
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
        expose_headers=["X-CSRF-Token"]
    )


def setup_session_security(app: FastAPI, cookie_domain: Optional[str] = None):
    """
    Configure session cookie security.
    """
    # This would typically be done in session middleware
    # For FastAPI with session middleware, you'd configure:
    session_config = {
        "httponly": True,
        "secure": os.getenv("NODE_ENV") == "production",
        "samesite": "lax",
    }
    
    if cookie_domain:
        session_config["domain"] = cookie_domain
    
    # In a real implementation, this would be passed to session middleware
    logger.info(f"Session security configured: {session_config}")
    return session_config


def setup_security_middleware(app: FastAPI, config: dict):
    """
    Setup all security middleware.
    """
    # Security headers
    app.add_middleware(SecurityHeadersMiddleware)
    
    # CSRF protection
    csrf_secret = config.get("cookie_key")  # Use the same key as cookies
    if csrf_secret:
        app.add_middleware(CSRFProtectionMiddleware, secret_key=csrf_secret)
    
    # CORS
    allowed_origins = config.get("allowed_origins", ["*"])
    cookie_domain = config.get("cookie_domain")
    setup_cors(app, allowed_origins, cookie_domain)
    
    # Session security
    setup_session_security(app, cookie_domain)


def generate_csrf_token() -> str:
    """
    Generate a CSRF token.
    In production, this should be tied to the user session.
    """
    return secrets.token_urlsafe(32)


def validate_webhook_signature(payload: bytes, signature: str, secret: str) -> bool:
    """
    Validate webhook signature for Stripe/Crypto webhooks.
    """
    import hmac
    import hashlib
    
    if not secret:
        # In development, skip signature validation if no secret is set
        return True
    
    try:
        # For Stripe webhooks
        if signature.startswith("whsec_"):
            # This is a simplified validation - in production use proper Stripe validation
            expected_signature = hmac.new(
                secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            # Extract signature from header
            received_signature = signature.replace("whsec_", "")
            return hmac.compare_digest(expected_signature, received_signature)
        
        # For other webhooks, use HMAC-SHA256
        expected_signature = hmac.new(
            secret.encode(),
            payload,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(signature, expected_signature)
        
    except Exception as e:
        logger.error(f"Webhook signature validation error: {e}")
        return False


def sanitize_log_data(data: dict) -> dict:
    """
    Sanitize sensitive data from logs.
    """
    sensitive_keys = [
        "password", "token", "secret", "key", "cookie", "authorization",
        "x-csrf-token", "x-api-key", "cookie_key", "stripe_secret",
        "crypto_secret", "session_id"
    ]
    
    sanitized = {}
    for key, value in data.items():
        key_lower = key.lower()
        if any(sensitive in key_lower for sensitive in sensitive_keys):
            sanitized[key] = "***REDACTED***"
        elif isinstance(value, dict):
            sanitized[key] = sanitize_log_data(value)
        else:
            sanitized[key] = value
    
    return sanitized


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Log API requests with sanitized data.
    """
    
    async def dispatch(self, request: Request, call_next: Callable):
        import time
        import logging
        
        start_time = time.time()
        
        # Log request
        request_data = {
            "method": request.method,
            "path": request.url.path,
            "query_params": dict(request.query_params),
            "headers": dict(request.headers),
            "client_ip": request.client.host if request.client else "unknown"
        }
        
        # Sanitize sensitive data
        sanitized_request = sanitize_log_data(request_data)
        logger.info(f"Request: {sanitized_request}")
        
        # Process request
        response = await call_next(request)
        
        # Log response
        duration = time.time() - start_time
        response_data = {
            "status_code": response.status_code,
            "duration_ms": round(duration * 1000, 2)
        }
        
        logger.info(f"Response: {response_data}")
        
        return response


def setup_request_logging(app: FastAPI):
    """
    Setup request logging middleware.
    """
    app.add_middleware(RequestLoggingMiddleware)


# Example usage and testing
if __name__ == "__main__":
    import secrets
    
    # Test CSRF token generation
    token = generate_csrf_token()
    print(f"Generated CSRF token: {token}")
    
    # Test webhook signature validation
    payload = b'{"test": "data"}'
    secret = "test_secret"
    signature = "test_signature"
    
    # This will fail because we're not using proper HMAC
    is_valid = validate_webhook_signature(payload, signature, secret)
    print(f"Webhook signature validation: {is_valid}")
    
    # Test data sanitization
    test_data = {
        "username": "test",
        "password": "secret123",
        "api_key": "key_123",
        "normal_data": "safe"
    }
    
    sanitized = sanitize_log_data(test_data)
    print(f"Sanitized data: {sanitized}")
    
    print("Security utilities test completed!")