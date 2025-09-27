"""
Health check utilities for database, Redis, and other services.
"""

import os
import time
import asyncio
import logging
from typing import Dict, Any, Optional
from datetime import datetime, timezone

logger = logging.getLogger(__name__)


class HealthChecker:
    """Health check utilities for various services."""
    
    def __init__(self):
        self.start_time = time.time()
    
    async def check_database(self) -> Dict[str, Any]:
        """
        Check database connectivity and basic operations.
        
        Returns:
            Dict with status and details
        """
        try:
            # Import here to avoid circular imports
            from db import get_db
            from sqlalchemy import text
            
            # Get database session
            db = next(get_db())
            
            # Simple query to test connectivity
            result = db.execute(text("SELECT 1 as health_check"))
            result.fetchone()
            
            # Check if migrations are applied (basic check)
            try:
                result = db.execute(text("SELECT COUNT(*) FROM alembic_version"))
                migration_count = result.fetchone()[0]
                migrations_applied = migration_count > 0
            except Exception:
                migrations_applied = False
            
            db.close()
            
            return {
                "status": "healthy",
                "migrations_applied": migrations_applied,
                "response_time_ms": 0  # Could measure actual time
            }
            
        except Exception as e:
            logger.error(f"Database health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def check_redis(self) -> Dict[str, Any]:
        """
        Check Redis connectivity.
        
        Returns:
            Dict with status and details
        """
        try:
            import redis
            
            # Parse Redis URL
            redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
            r = redis.from_url(redis_url)
            
            # Test basic operations
            start_time = time.time()
            r.ping()
            response_time = (time.time() - start_time) * 1000
            
            # Test set/get
            test_key = f"health_check_{int(time.time())}"
            r.set(test_key, "test_value", ex=10)
            value = r.get(test_key)
            r.delete(test_key)
            
            if value != b"test_value":
                raise Exception("Redis set/get test failed")
            
            return {
                "status": "healthy",
                "response_time_ms": round(response_time, 2)
            }
            
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def check_worker(self) -> Dict[str, Any]:
        """
        Check Celery worker connectivity.
        
        Returns:
            Dict with status and details
        """
        try:
            from celery import Celery
            
            # Create Celery app instance
            celery_app = Celery('health_check')
            celery_app.config_from_object({
                'broker_url': os.getenv("CELERY_BROKER_URL", os.getenv("REDIS_URL", "redis://localhost:6379/0")),
                'result_backend': os.getenv("CELERY_RESULT_BACKEND", os.getenv("REDIS_URL", "redis://localhost:6379/0"))
            })
            
            # Check active workers
            inspect = celery_app.control.inspect()
            active_workers = inspect.active()
            
            if not active_workers:
                return {
                    "status": "unhealthy",
                    "error": "No active workers found"
                }
            
            worker_count = len(active_workers)
            
            return {
                "status": "healthy",
                "active_workers": worker_count,
                "workers": list(active_workers.keys())
            }
            
        except Exception as e:
            logger.error(f"Worker health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    async def check_s3(self) -> Dict[str, Any]:
        """
        Check S3/MinIO connectivity.
        
        Returns:
            Dict with status and details
        """
        try:
            import boto3
            from botocore.exceptions import ClientError
            
            s3_endpoint = os.getenv("S3_ENDPOINT")
            if not s3_endpoint:
                return {
                    "status": "not_configured",
                    "message": "S3 endpoint not configured"
                }
            
            s3_client = boto3.client(
                's3',
                endpoint_url=s3_endpoint,
                aws_access_key_id=os.getenv("S3_ACCESS_KEY"),
                aws_secret_access_key=os.getenv("S3_SECRET_KEY"),
                region_name='us-east-1'
            )
            
            # Test bucket access
            bucket_name = os.getenv("S3_BUCKET", "artifacts")
            start_time = time.time()
            
            try:
                s3_client.head_bucket(Bucket=bucket_name)
                response_time = (time.time() - start_time) * 1000
                
                return {
                    "status": "healthy",
                    "bucket": bucket_name,
                    "response_time_ms": round(response_time, 2)
                }
            except ClientError as e:
                if e.response['Error']['Code'] == '404':
                    return {
                        "status": "unhealthy",
                        "error": f"Bucket {bucket_name} not found"
                    }
                else:
                    raise
            
        except Exception as e:
            logger.error(f"S3 health check failed: {e}")
            return {
                "status": "unhealthy",
                "error": str(e)
            }
    
    def get_system_info(self) -> Dict[str, Any]:
        """
        Get basic system information.
        
        Returns:
            Dict with system info
        """
        import psutil
        
        uptime = time.time() - self.start_time
        
        return {
            "uptime_seconds": round(uptime, 2),
            "cpu_percent": psutil.cpu_percent(),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage('/').percent,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }


# Global health checker instance
health_checker = HealthChecker()


async def get_health_status() -> Dict[str, Any]:
    """
    Get overall health status of all services.
    
    Returns:
        Dict with health status of all services
    """
    # Run all health checks in parallel
    db_health, redis_health, worker_health, s3_health = await asyncio.gather(
        health_checker.check_database(),
        health_checker.check_redis(),
        health_checker.check_worker(),
        health_checker.check_s3(),
        return_exceptions=True
    )
    
    # Handle exceptions
    if isinstance(db_health, Exception):
        db_health = {"status": "error", "error": str(db_health)}
    if isinstance(redis_health, Exception):
        redis_health = {"status": "error", "error": str(redis_health)}
    if isinstance(worker_health, Exception):
        worker_health = {"status": "error", "error": str(worker_health)}
    if isinstance(s3_health, Exception):
        s3_health = {"status": "error", "error": str(s3_health)}
    
    # Determine overall status
    all_healthy = all(
        service.get("status") in ["healthy", "not_configured"]
        for service in [db_health, redis_health, worker_health, s3_health]
    )
    
    overall_status = "healthy" if all_healthy else "unhealthy"
    
    return {
        "status": overall_status,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "services": {
            "database": db_health,
            "redis": redis_health,
            "worker": worker_health,
            "s3": s3_health
        },
        "system": health_checker.get_system_info()
    }


async def get_readiness_status() -> Dict[str, Any]:
    """
    Get readiness status (more strict than health).
    
    Returns:
        Dict with readiness status
    """
    # For readiness, we need database and Redis to be healthy
    db_health, redis_health = await asyncio.gather(
        health_checker.check_database(),
        health_checker.check_redis(),
        return_exceptions=True
    )
    
    # Handle exceptions
    if isinstance(db_health, Exception):
        db_health = {"status": "error", "error": str(db_health)}
    if isinstance(redis_health, Exception):
        redis_health = {"status": "error", "error": str(redis_health)}
    
    # Check if database has migrations applied
    db_ready = (
        db_health.get("status") == "healthy" and
        db_health.get("migrations_applied", False)
    )
    
    redis_ready = redis_health.get("status") == "healthy"
    
    ready = db_ready and redis_ready
    
    return {
        "ready": ready,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "checks": {
            "database": {
                "healthy": db_health.get("status") == "healthy",
                "migrations_applied": db_health.get("migrations_applied", False)
            },
            "redis": {
                "healthy": redis_health.get("status") == "healthy"
            }
        }
    }


# Example usage and testing
if __name__ == "__main__":
    async def test_health_checks():
        """Test health check functions."""
        print("Testing health checks...")
        
        # Test health status
        health_status = await get_health_status()
        print(f"Health Status: {health_status['status']}")
        
        # Test readiness status
        readiness_status = await get_readiness_status()
        print(f"Ready: {readiness_status['ready']}")
        
        # Print service details
        for service, status in health_status['services'].items():
            print(f"{service}: {status['status']}")
    
    # Run tests
    asyncio.run(test_health_checks())