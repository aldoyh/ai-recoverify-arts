"""
Database models for AI Recoverify Arts
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Float, Boolean, Text, Enum
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.dialects.postgresql import JSON
import enum

Base = declarative_base()


class ProcessingStatus(enum.Enum):
    """Processing status enumeration"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    CANCELLED = "cancelled"


class RestorationMode(enum.Enum):
    """Restoration mode enumeration"""
    STANDARD = "standard"
    ADVANCED = "advanced"
    COLORIZATION = "colorization"
    SUPER_RESOLUTION = "super_resolution"
    STYLE_TRANSFER = "style_transfer"
    BATCH = "batch"


class RestorationJob(Base):
    """Restoration job model"""
    __tablename__ = "restoration_jobs"

    id = Column(Integer, primary_key=True, index=True)
    job_id = Column(String(64), unique=True, index=True, nullable=False)
    user_id = Column(String(64), index=True, nullable=True)
    api_key = Column(String(64), index=True, nullable=True)

    # Input information
    input_filename = Column(String(255), nullable=False)
    input_path = Column(String(512), nullable=False)
    input_size = Column(Integer, nullable=False)  # File size in bytes
    input_dimensions = Column(JSON, nullable=True)  # {"width": 1920, "height": 1080}

    # Processing parameters
    mode = Column(Enum(RestorationMode), default=RestorationMode.STANDARD)
    parameters = Column(JSON, nullable=True)  # Store all processing parameters

    # Output information
    output_filename = Column(String(255), nullable=True)
    output_path = Column(String(512), nullable=True)
    output_size = Column(Integer, nullable=True)
    output_dimensions = Column(JSON, nullable=True)

    # Processing metadata
    status = Column(Enum(ProcessingStatus), default=ProcessingStatus.PENDING, index=True)
    progress = Column(Float, default=0.0)  # 0.0 to 100.0
    error_message = Column(Text, nullable=True)

    # Timing information
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    started_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    processing_time = Column(Float, nullable=True)  # Time in seconds

    # Quality metrics
    quality_score = Column(Float, nullable=True)  # 0.0 to 100.0
    improvement_score = Column(Float, nullable=True)  # 0.0 to 100.0

    # Webhook
    webhook_url = Column(String(512), nullable=True)
    webhook_sent = Column(Boolean, default=False)

    def __repr__(self):
        return f"<RestorationJob {self.job_id} - {self.status.value}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "job_id": self.job_id,
            "user_id": self.user_id,
            "input_filename": self.input_filename,
            "input_size": self.input_size,
            "input_dimensions": self.input_dimensions,
            "mode": self.mode.value if self.mode else None,
            "parameters": self.parameters,
            "output_filename": self.output_filename,
            "output_size": self.output_size,
            "output_dimensions": self.output_dimensions,
            "status": self.status.value if self.status else None,
            "progress": self.progress,
            "error_message": self.error_message,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "processing_time": self.processing_time,
            "quality_score": self.quality_score,
            "improvement_score": self.improvement_score,
        }


class User(Base):
    """User model for API authentication"""
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(64), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    api_key = Column(String(64), unique=True, index=True, nullable=True)

    # Limits and quotas
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    daily_quota = Column(Integer, default=100)
    used_quota = Column(Integer, default=0)
    quota_reset_at = Column(DateTime, nullable=True)

    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login_at = Column(DateTime, nullable=True)
    last_request_at = Column(DateTime, nullable=True)

    def __repr__(self):
        return f"<User {self.email}>"

    def to_dict(self):
        """Convert to dictionary"""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email": self.email,
            "is_active": self.is_active,
            "is_admin": self.is_admin,
            "daily_quota": self.daily_quota,
            "used_quota": self.used_quota,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class ProcessingMetrics(Base):
    """Processing metrics for monitoring"""
    __tablename__ = "processing_metrics"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    # Performance metrics
    processing_time = Column(Float, nullable=False)
    image_size = Column(Integer, nullable=False)
    mode = Column(Enum(RestorationMode), nullable=False)

    # Resource usage
    cpu_usage = Column(Float, nullable=True)
    memory_usage = Column(Float, nullable=True)
    gpu_usage = Column(Float, nullable=True)

    # Quality metrics
    quality_score = Column(Float, nullable=True)
    success = Column(Boolean, default=True)

    def __repr__(self):
        return f"<ProcessingMetrics {self.timestamp} - {self.mode.value}>"
