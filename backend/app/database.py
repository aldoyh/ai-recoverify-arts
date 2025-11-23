"""
Database utilities and session management
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from contextlib import contextmanager
import logging

from .config import config
from .models import Base

logger = logging.getLogger(__name__)

# Create engine
engine = create_engine(
    config.database.url,
    pool_size=config.database.pool_size,
    max_overflow=config.database.max_overflow,
    echo=config.database.echo,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Session = scoped_session(SessionLocal)


def init_db():
    """Initialize database, create all tables"""
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise


def drop_db():
    """Drop all tables (use with caution!)"""
    try:
        Base.metadata.drop_all(bind=engine)
        logger.info("Database dropped successfully")
    except Exception as e:
        logger.error(f"Error dropping database: {str(e)}")
        raise


@contextmanager
def get_db():
    """Get database session as context manager"""
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def get_db_session():
    """Get database session for dependency injection"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
