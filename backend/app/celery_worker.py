"""
Celery worker for asynchronous task processing
"""

from celery import Celery
import logging
from datetime import datetime
from pathlib import Path

from .config import config
from .database import get_db
from .models import RestorationJob, ProcessingStatus
from .art_restorer import ArtRestorer
from .image_processor import ImageProcessor

logger = logging.getLogger(__name__)

# Initialize Celery
celery_app = Celery(
    'ai_recoverify',
    broker=config.celery.broker_url,
    backend=config.celery.result_backend,
)

celery_app.conf.update(
    task_serializer=config.celery.task_serializer,
    result_serializer=config.celery.result_serializer,
    accept_content=config.celery.accept_content,
    timezone=config.celery.timezone,
    enable_utc=config.celery.enable_utc,
)

# Initialize processors
art_restorer = ArtRestorer()
image_processor = ImageProcessor()


@celery_app.task(name='process_restoration', bind=True)
def process_restoration_task(self, job_id: str):
    """
    Process restoration job asynchronously

    Args:
        job_id: Restoration job ID
    """
    logger.info(f"Starting restoration job: {job_id}")

    with get_db() as db:
        try:
            # Get job from database
            job = db.query(RestorationJob).filter(RestorationJob.job_id == job_id).first()
            if not job:
                logger.error(f"Job not found: {job_id}")
                return {"error": "Job not found"}

            # Update status to processing
            job.status = ProcessingStatus.PROCESSING
            job.started_at = datetime.utcnow()
            db.commit()

            # Update progress
            self.update_state(state='PROGRESS', meta={'progress': 10})
            job.progress = 10.0
            db.commit()

            # Load parameters
            params = job.parameters or {}

            # Process based on mode
            if job.mode.value == 'standard':
                result = art_restorer.restore(
                    str(job.input_path),
                    enhancement_level=params.get('enhancement_level', 'medium'),
                    denoise_strength=params.get('denoise_strength', 0.5),
                    sharpen=params.get('sharpen', True),
                    color_correction=params.get('color_correction', True),
                    damage_repair=params.get('damage_repair', True),
                )
            elif job.mode.value == 'super_resolution':
                result = art_restorer.super_resolution(str(job.input_path), scale=params.get('scale', 2))
            elif job.mode.value == 'colorization':
                result = art_restorer.colorize(str(job.input_path))
            else:
                result = art_restorer.restore(str(job.input_path))

            # Update progress
            self.update_state(state='PROGRESS', meta={'progress': 80})
            job.progress = 80.0
            db.commit()

            # Save output
            output_path = config.storage.output_folder / job.output_filename
            image_processor.save_image(result, str(output_path))

            # Get output file info
            output_size = output_path.stat().st_size
            output_dims = {"width": result.shape[1], "height": result.shape[0]}

            # Update job
            job.status = ProcessingStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            job.processing_time = (job.completed_at - job.started_at).total_seconds()
            job.output_size = output_size
            job.output_dimensions = output_dims
            job.progress = 100.0
            db.commit()

            logger.info(f"Restoration job completed: {job_id}")

            # Send webhook if configured
            if job.webhook_url:
                send_webhook.delay(job_id)

            return {
                "success": True,
                "job_id": job_id,
                "output_filename": job.output_filename,
                "processing_time": job.processing_time,
            }

        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}")

            # Update job with error
            job = db.query(RestorationJob).filter(RestorationJob.job_id == job_id).first()
            if job:
                job.status = ProcessingStatus.FAILED
                job.error_message = str(e)
                job.completed_at = datetime.utcnow()
                if job.started_at:
                    job.processing_time = (job.completed_at - job.started_at).total_seconds()
                db.commit()

            return {"error": str(e)}


@celery_app.task(name='process_batch')
def process_batch_task(job_ids: list):
    """
    Process multiple restoration jobs in batch

    Args:
        job_ids: List of job IDs
    """
    logger.info(f"Starting batch processing: {len(job_ids)} jobs")

    results = []
    for job_id in job_ids:
        result = process_restoration_task.delay(job_id)
        results.append({"job_id": job_id, "task_id": result.id})

    return results


@celery_app.task(name='send_webhook')
def send_webhook(job_id: str):
    """
    Send webhook notification for completed job

    Args:
        job_id: Restoration job ID
    """
    import requests

    with get_db() as db:
        try:
            job = db.query(RestorationJob).filter(RestorationJob.job_id == job_id).first()
            if not job or not job.webhook_url:
                return

            # Prepare webhook payload
            payload = {
                "job_id": job.job_id,
                "status": job.status.value,
                "output_filename": job.output_filename,
                "processing_time": job.processing_time,
                "completed_at": job.completed_at.isoformat() if job.completed_at else None,
            }

            # Send webhook
            response = requests.post(
                job.webhook_url,
                json=payload,
                timeout=10,
                headers={"Content-Type": "application/json"}
            )

            if response.status_code == 200:
                job.webhook_sent = True
                db.commit()
                logger.info(f"Webhook sent successfully for job: {job_id}")
            else:
                logger.warning(f"Webhook failed for job {job_id}: {response.status_code}")

        except Exception as e:
            logger.error(f"Error sending webhook for job {job_id}: {str(e)}")


@celery_app.task(name='cleanup_old_files')
def cleanup_old_files():
    """Clean up old files based on retention policy"""
    import os
    from datetime import timedelta

    logger.info("Starting cleanup of old files")

    retention_days = config.storage.retention_days
    cutoff_date = datetime.utcnow() - timedelta(days=retention_days)

    with get_db() as db:
        # Find old jobs
        old_jobs = db.query(RestorationJob).filter(
            RestorationJob.created_at < cutoff_date,
            RestorationJob.status.in_([ProcessingStatus.COMPLETED, ProcessingStatus.FAILED])
        ).all()

        deleted_count = 0
        for job in old_jobs:
            try:
                # Delete files
                if job.input_path and os.path.exists(job.input_path):
                    os.remove(job.input_path)
                if job.output_path and os.path.exists(job.output_path):
                    os.remove(job.output_path)

                # Delete job record
                db.delete(job)
                deleted_count += 1

            except Exception as e:
                logger.error(f"Error deleting job {job.job_id}: {str(e)}")

        db.commit()
        logger.info(f"Cleanup completed: {deleted_count} jobs deleted")

        return {"deleted_count": deleted_count}


# Periodic tasks
@celery_app.on_after_configure.connect
def setup_periodic_tasks(sender, **kwargs):
    """Setup periodic tasks"""
    # Run cleanup daily at 2 AM
    sender.add_periodic_task(
        crontab(hour=2, minute=0),
        cleanup_old_files.s(),
        name='cleanup-daily'
    )
