"""
Redis client for caching and rate limiting
"""

import redis
import json
import logging
from typing import Any, Optional
from functools import wraps
import time

from .config import config

logger = logging.getLogger(__name__)


class RedisClient:
    """Redis client wrapper"""

    def __init__(self):
        try:
            self.client = redis.Redis(
                host=config.redis.host,
                port=config.redis.port,
                db=config.redis.db,
                password=config.redis.password,
                decode_responses=config.redis.decode_responses,
            )
            self.client.ping()
            logger.info("Redis connection established")
        except Exception as e:
            logger.warning(f"Redis connection failed: {str(e)}. Caching disabled.")
            self.client = None

    def get(self, key: str) -> Optional[Any]:
        """Get value from Redis"""
        if not self.client:
            return None
        try:
            value = self.client.get(key)
            if value:
                return json.loads(value)
            return None
        except Exception as e:
            logger.error(f"Redis get error: {str(e)}")
            return None

    def set(self, key: str, value: Any, expire: int = 3600):
        """Set value in Redis with expiration"""
        if not self.client:
            return False
        try:
            self.client.setex(key, expire, json.dumps(value))
            return True
        except Exception as e:
            logger.error(f"Redis set error: {str(e)}")
            return False

    def delete(self, key: str):
        """Delete key from Redis"""
        if not self.client:
            return False
        try:
            self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis delete error: {str(e)}")
            return False

    def increment(self, key: str, amount: int = 1) -> int:
        """Increment counter"""
        if not self.client:
            return 0
        try:
            return self.client.incrby(key, amount)
        except Exception as e:
            logger.error(f"Redis increment error: {str(e)}")
            return 0

    def expire(self, key: str, seconds: int):
        """Set expiration on key"""
        if not self.client:
            return False
        try:
            self.client.expire(key, seconds)
            return True
        except Exception as e:
            logger.error(f"Redis expire error: {str(e)}")
            return False

    def rate_limit(self, key: str, limit: int, window: int = 60) -> bool:
        """
        Check if rate limit is exceeded

        Args:
            key: Rate limit key (e.g., user ID or IP)
            limit: Maximum requests allowed
            window: Time window in seconds

        Returns:
            True if under limit, False if exceeded
        """
        if not self.client:
            return True  # Allow if Redis is not available

        try:
            current = self.client.get(key)
            if current is None:
                self.client.setex(key, window, 1)
                return True

            current = int(current)
            if current >= limit:
                return False

            self.client.incr(key)
            return True
        except Exception as e:
            logger.error(f"Rate limit check error: {str(e)}")
            return True  # Allow on error


# Global Redis client instance
redis_client = RedisClient()


def cached(expire: int = 3600, key_prefix: str = ""):
    """
    Caching decorator

    Args:
        expire: Cache expiration in seconds
        key_prefix: Prefix for cache key
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{key_prefix}:{func.__name__}:{str(args)}:{str(kwargs)}"

            # Try to get from cache
            cached_value = redis_client.get(cache_key)
            if cached_value is not None:
                logger.debug(f"Cache hit for {cache_key}")
                return cached_value

            # Execute function
            result = func(*args, **kwargs)

            # Store in cache
            redis_client.set(cache_key, result, expire)
            logger.debug(f"Cache set for {cache_key}")

            return result
        return wrapper
    return decorator


def rate_limited(limit: int = 10, window: int = 60):
    """
    Rate limiting decorator

    Args:
        limit: Maximum requests allowed
        window: Time window in seconds
    """
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            # Get identifier (could be user_id, api_key, or IP)
            identifier = kwargs.get('user_id') or kwargs.get('api_key') or 'anonymous'
            rate_key = f"rate_limit:{identifier}"

            if not redis_client.rate_limit(rate_key, limit, window):
                raise Exception(f"Rate limit exceeded: {limit} requests per {window} seconds")

            return func(*args, **kwargs)
        return wrapper
    return decorator
