"""
Advanced configuration management for AI Recoverify Arts
"""

import os
from pathlib import Path
from typing import Optional
from pydantic import BaseModel, Field


class DatabaseConfig(BaseModel):
    """Database configuration"""
    url: str = Field(default="postgresql://localhost/ai_recoverify")
    pool_size: int = Field(default=10)
    max_overflow: int = Field(default=20)
    echo: bool = Field(default=False)


class RedisConfig(BaseModel):
    """Redis configuration"""
    host: str = Field(default="localhost")
    port: int = Field(default=6379)
    db: int = Field(default=0)
    password: Optional[str] = Field(default=None)
    decode_responses: bool = Field(default=True)


class CeleryConfig(BaseModel):
    """Celery configuration"""
    broker_url: str = Field(default="redis://localhost:6379/1")
    result_backend: str = Field(default="redis://localhost:6379/2")
    task_serializer: str = Field(default="json")
    result_serializer: str = Field(default="json")
    accept_content: list = Field(default=["json"])
    timezone: str = Field(default="UTC")
    enable_utc: bool = Field(default=True)


class AIConfig(BaseModel):
    """AI model configuration"""
    use_gpu: bool = Field(default=False)
    model_cache_dir: Path = Field(default=Path("models/cache"))
    enable_super_resolution: bool = Field(default=True)
    enable_colorization: bool = Field(default=True)
    enable_style_transfer: bool = Field(default=True)
    max_image_dimension: int = Field(default=4096)


class SecurityConfig(BaseModel):
    """Security configuration"""
    secret_key: str = Field(default="change-this-in-production")
    jwt_algorithm: str = Field(default="HS256")
    jwt_expiration_hours: int = Field(default=24)
    enable_rate_limiting: bool = Field(default=True)
    rate_limit_per_minute: int = Field(default=10)
    require_api_key: bool = Field(default=False)


class StorageConfig(BaseModel):
    """Storage configuration"""
    upload_folder: Path = Field(default=Path("assets/input"))
    output_folder: Path = Field(default=Path("assets/output"))
    temp_folder: Path = Field(default=Path("assets/temp"))
    max_file_size: int = Field(default=16 * 1024 * 1024)  # 16MB
    retention_days: int = Field(default=7)


class MonitoringConfig(BaseModel):
    """Monitoring configuration"""
    enable_prometheus: bool = Field(default=True)
    enable_sentry: bool = Field(default=False)
    sentry_dsn: Optional[str] = Field(default=None)
    log_level: str = Field(default="INFO")
    log_file: Optional[Path] = Field(default=Path("logs/app.log"))


class Config(BaseModel):
    """Main application configuration"""
    app_name: str = Field(default="AI Recoverify Arts")
    version: str = Field(default="2.0.0")
    debug: bool = Field(default=False)
    host: str = Field(default="0.0.0.0")
    port: int = Field(default=5000)
    workers: int = Field(default=4)

    database: DatabaseConfig = Field(default_factory=DatabaseConfig)
    redis: RedisConfig = Field(default_factory=RedisConfig)
    celery: CeleryConfig = Field(default_factory=CeleryConfig)
    ai: AIConfig = Field(default_factory=AIConfig)
    security: SecurityConfig = Field(default_factory=SecurityConfig)
    storage: StorageConfig = Field(default_factory=StorageConfig)
    monitoring: MonitoringConfig = Field(default_factory=MonitoringConfig)

    @classmethod
    def from_env(cls) -> "Config":
        """Load configuration from environment variables"""
        return cls(
            debug=os.getenv("FLASK_DEBUG", "False").lower() == "true",
            host=os.getenv("HOST", "0.0.0.0"),
            port=int(os.getenv("PORT", "5000")),
            database=DatabaseConfig(
                url=os.getenv("DATABASE_URL", "postgresql://localhost/ai_recoverify"),
            ),
            redis=RedisConfig(
                host=os.getenv("REDIS_HOST", "localhost"),
                port=int(os.getenv("REDIS_PORT", "6379")),
                password=os.getenv("REDIS_PASSWORD"),
            ),
            celery=CeleryConfig(
                broker_url=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/1"),
                result_backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/2"),
            ),
            ai=AIConfig(
                use_gpu=os.getenv("USE_GPU", "False").lower() == "true",
                enable_super_resolution=os.getenv("ENABLE_SUPER_RES", "True").lower() == "true",
                enable_colorization=os.getenv("ENABLE_COLORIZATION", "True").lower() == "true",
            ),
            security=SecurityConfig(
                secret_key=os.getenv("SECRET_KEY", "change-this-in-production"),
                enable_rate_limiting=os.getenv("ENABLE_RATE_LIMITING", "True").lower() == "true",
                require_api_key=os.getenv("REQUIRE_API_KEY", "False").lower() == "true",
            ),
            monitoring=MonitoringConfig(
                enable_sentry=os.getenv("ENABLE_SENTRY", "False").lower() == "true",
                sentry_dsn=os.getenv("SENTRY_DSN"),
                log_level=os.getenv("LOG_LEVEL", "INFO"),
            ),
        )

    def ensure_directories(self):
        """Ensure all required directories exist"""
        self.storage.upload_folder.mkdir(parents=True, exist_ok=True)
        self.storage.output_folder.mkdir(parents=True, exist_ok=True)
        self.storage.temp_folder.mkdir(parents=True, exist_ok=True)
        self.ai.model_cache_dir.mkdir(parents=True, exist_ok=True)
        if self.monitoring.log_file:
            self.monitoring.log_file.parent.mkdir(parents=True, exist_ok=True)


# Global configuration instance
config = Config.from_env()
config.ensure_directories()
