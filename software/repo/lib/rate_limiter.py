"""
Rate limiting middleware for sensitive endpoints.
"""

import time
from typing import Dict, Optional
from fastapi import HTTPException, Request
from collections import defaultdict, deque
import os


class RateLimiter:
    """Simple in-memory rate limiter."""
    
    def __init__(self, requests_per_minute: int = 30):
        self.requests_per_minute = requests_per_minute
        self.requests: Dict[str, deque] = defaultdict(deque)
    
    def is_allowed(self, client_ip: str) -> bool:
        """
        Check if request is allowed for the given client IP.
        
        Args:
            client_ip: Client IP address
            
        Returns:
            True if request is allowed, False otherwise
        """
        now = time.time()
        minute_ago = now - 60
        
        # Clean old requests
        while self.requests[client_ip] and self.requests[client_ip][0] < minute_ago:
            self.requests[client_ip].popleft()
        
        # Check if under limit
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return False
        
        # Add current request
        self.requests[client_ip].append(now)
        return True


# Global rate limiter instance
rate_limiter = RateLimiter(
    requests_per_minute=int(os.getenv("RATE_LIMIT_PER_MINUTE", "30"))
)


def get_client_ip(request: Request) -> str:
    """
    Extract client IP from request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        Client IP address
    """
    # Check for forwarded headers first
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    # Fallback to direct connection
    if request.client:
        return request.client.host
    
    return "unknown"


def check_rate_limit(request: Request) -> bool:
    """
    Check rate limit for the request.
    
    Args:
        request: FastAPI request object
        
    Returns:
        True if request is allowed, raises HTTPException otherwise
    """
    client_ip = get_client_ip(request)
    
    if not rate_limiter.is_allowed(client_ip):
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": f"Too many requests. Limit: {rate_limiter.requests_per_minute} per minute"
            }
        )
    
    return True


def rate_limit_middleware():
    """
    FastAPI middleware factory for rate limiting.
    """
    async def middleware(request: Request, call_next):
        # Check rate limit for sensitive endpoints
        sensitive_paths = [
            "/api/auth/login",
            "/api/bot-instances/",
            "/api/schedules",
            "/api/billing/invoice"
        ]
        
        # Check if this is a sensitive endpoint
        is_sensitive = any(request.url.path.startswith(path) for path in sensitive_paths)
        
        if is_sensitive and request.method in ["POST", "PUT", "PATCH", "DELETE"]:
            check_rate_limit(request)
        
        response = await call_next(request)
        return response
    
    return middleware