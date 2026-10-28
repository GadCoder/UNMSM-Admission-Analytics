from django.db import transaction
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from modules.academics.models import AcademicArea, Faculty, Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.results.models import AdmissionResult

from .cache import invalidate_analytics_cache, invalidation_suspended


@receiver(
    (post_save, post_delete),
    sender=AcademicArea,
    dispatch_uid="analytics_cache_academic_area_changed",
)
@receiver(
    (post_save, post_delete),
    sender=Faculty,
    dispatch_uid="analytics_cache_faculty_changed",
)
@receiver(
    (post_save, post_delete),
    sender=Major,
    dispatch_uid="analytics_cache_major_changed",
)
@receiver(
    (post_save, post_delete),
    sender=AdmissionModality,
    dispatch_uid="analytics_cache_modality_changed",
)
@receiver(
    (post_save, post_delete),
    sender=AdmissionProcess,
    dispatch_uid="analytics_cache_process_changed",
)
@receiver(
    (post_save, post_delete),
    sender=AdmissionResult,
    dispatch_uid="analytics_cache_result_changed",
)
def schedule_analytics_invalidation(sender, using, **kwargs):
    if not invalidation_suspended():
        transaction.on_commit(invalidate_analytics_cache, using=using)
