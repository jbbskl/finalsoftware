"""
Environment variable validation and configuration.
"""

import os
import sys
import base64
from urllib.parse import urlparse
from typing import Dict, Any, Optional


class EnvValidationError(Exception):
    """Raised when environment validation fails."""
    pass


def validate_required_env_vars() -> None:
    """
    Validate required environment variables at startup.
    Raises EnvValidationError if validation fails.
    """
    errors = []
    
    # Database URL
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        errors.append("DATABASE_URL is required")
    elif not database_url.startswith(("postgresql://", "postgresql+psycopg://")):
        errors.append("DATABASE_URL must be a valid PostgreSQL connection string")
    
    # Redis URL
    redis_url = os.getenv("REDIS_URL")
    if not redis_url:
        errors.append("REDIS_URL is required")
    elif not redis_url.startswith("redis://"):
        errors.append("REDIS_URL must be a valid Redis connection string")
    
    # Cookie Key
    cookie_key = os.getenv("COOKIE_KEY")
    if not cookie_key:
        errors.append("COOKIE_KEY is required")
    else:
        try:
            # Decode base64 and check length
            decoded_key = base64.b64decode(cookie_key)
            if len(decoded_key) != 32:
                errors.append("COOKIE_KEY must be exactly 32 bytes (256 bits) when base64 decoded")
        except Exception:
            errors.append("COOKIE_KEY must be valid base64")
    
    if errors:
        error_msg = "Environment validation failed:\n" + "\n".join(f"- {error}" for error in errors)
        raise EnvValidationError(error_msg)


def get_config() -> Dict[str, Any]:
    """
    Get validated configuration from environment variables.
    """
    # Validate required vars first
    validate_required_env_vars()
    
    # Parse and validate URLs
    database_url = os.getenv("DATABASE_URL")
    redis_url = os.getenv("REDIS_URL")
    
    # Decode cookie key
    cookie_key = base64.b64decode(os.getenv("COOKIE_KEY"))
    
    # Parse CORS origins
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
    allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",") if origin.strip()]
    
    config = {
        # Database
        "database_url": database_url,
        
        # Redis
        "redis_url": redis_url,
        
        # Security
        "cookie_key": cookie_key,
        "allowed_origins": allowed_origins,
        "cookie_domain": os.getenv("COOKIE_DOMAIN"),
        
        # API
        "api_host": os.getenv("API_HOST", "0.0.0.0"),
        "api_port": int(os.getenv("API_PORT", "8000")),
        
        # Worker
        "celery_broker_url": os.getenv("CELERY_BROKER_URL", redis_url),
        "celery_result_backend": os.getenv("CELERY_RESULT_BACKEND", redis_url),
        
        # Timezone
        "app_tz": os.getenv("APP_TZ", "Europe/Amsterdam"),
        
        # S3
        "s3_endpoint": os.getenv("S3_ENDPOINT"),
        "s3_access_key": os.getenv("S3_ACCESS_KEY"),
        "s3_secret_key": os.getenv("S3_SECRET_KEY"),
        "s3_bucket": os.getenv("S3_BUCKET"),
        
        # Rate Limiting
        "rate_limit_per_minute": int(os.getenv("RATE_LIMIT_PER_MINUTE", "30")),
        "rate_limit_auth_per_minute": int(os.getenv("RATE_LIMIT_AUTH_PER_MINUTE", "10")),
        "rate_limit_webhook_per_minute": int(os.getenv("RATE_LIMIT_WEBHOOK_PER_MINUTE", "120")),
        
        # Development
        "auth_disabled": os.getenv("AUTH_DISABLED", "false").lower() == "true",
        "dev_user_id": os.getenv("DEV_USER_ID", "dev-user-123"),
        "dev_user_role": os.getenv("DEV_USER_ROLE", "creator"),
        "dev_org_id": os.getenv("DEV_ORG_ID"),
        
        # Logging
        "log_level": os.getenv("LOG_LEVEL", "INFO"),
        "log_retention_days": int(os.getenv("LOG_RETENTION_DAYS", "7")),
        "log_format": os.getenv("LOG_FORMAT", "json"),
        
        # Metrics
        "metrics_enabled": os.getenv("METRICS_ENABLED", "false").lower() == "true",
        "metrics_port": int(os.getenv("METRICS_PORT", "9090")),
        
        # Production
        "node_env": os.getenv("NODE_ENV", "development"),
        "environment": os.getenv("ENVIRONMENT", "development"),
        
        # Scaling
        "api_replicas": int(os.getenv("API_REPLICAS", "1")),
        "worker_replicas": int(os.getenv("WORKER_REPLICAS", "1")),
        
        # Webhooks
        "stripe_webhook_secret": os.getenv("STRIPE_WEBHOOK_SECRET"),
        "crypto_webhook_secret": os.getenv("CRYPTO_WEBHOOK_SECRET"),
    }
    
    return config


def is_production() -> bool:
    """Check if running in production environment."""
    return os.getenv("NODE_ENV", "development") == "production"


def is_development() -> bool:
    """Check if running in development environment."""
    return not is_production()


def setup_logging():
    """Setup logging configuration based on environment."""
    import logging
    import logging.config
    
    log_level = os.getenv("LOG_LEVEL", "INFO")
    log_format = os.getenv("LOG_FORMAT", "json")
    
    if log_format == "json":
        # JSON logging for production
        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format='%(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout)
            ]
        )
        
        # Configure JSON formatter for structured logging
        for handler in logging.root.handlers:
            if isinstance(handler, logging.StreamHandler):
                handler.setFormatter(JsonFormatter())
    else:
        # Text logging for development
        logging.basicConfig(
            level=getattr(logging, log_level.upper()),
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.StreamHandler(sys.stdout)
            ]
        )


class JsonFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record):
        import json
        import datetime
        
        log_entry = {
            "timestamp": datetime.datetime.utcnow().isoformat() + "Z",
            "level": record.levelname,
            "message": record.getMessage(),
            "logger": record.name,
        }
        
        # Add exception info if present
        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)
        
        # Add extra fields
        for key, value in record.__dict__.items():
            if key not in ("name", "msg", "args", "levelname", "levelno", "pathname", 
                          "filename", "module", "exc_info", "exc_text", "stack_info",
                          "lineno", "funcName", "created", "msecs", "relativeCreated",
                          "thread", "threadName", "processName", "process", "getMessage"):
                log_entry[key] = value
        
        return json.dumps(log_entry)


def validate_cors_origins(origins: list) -> None:
    """
    Validate CORS origins configuration.
    """
    if is_production():
        if "*" in origins:
            raise EnvValidationError("Wildcard CORS origins (*) not allowed in production")
        
        if not origins:
            raise EnvValidationError("At least one CORS origin must be specified in production")
        
        # Validate URL format
        for origin in origins:
            try:
                parsed = urlparse(origin)
                if not parsed.scheme or not parsed.netloc:
                    raise ValueError("Invalid URL")
                if parsed.scheme not in ("http", "https"):
                    raise ValueError("Only http and https schemes allowed")
            except Exception:
                raise EnvValidationError(f"Invalid CORS origin: {origin}")


if __name__ == "__main__":
    """Test environment validation."""
    try:
        config = get_config()
        print("✅ Environment validation passed")
        print(f"Database URL: {config['database_url'][:50]}...")
        print(f"Redis URL: {config['redis_url']}")
        print(f"Cookie key length: {len(config['cookie_key'])} bytes")
        print(f"Allowed origins: {config['allowed_origins']}")
        print(f"Environment: {config['environment']}")
    except EnvValidationError as e:
        print(f"❌ Environment validation failed: {e}")
        sys.exit(1)