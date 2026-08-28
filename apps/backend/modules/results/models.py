from django.db import models

from modules.academics.models import Major
from modules.admission_processes.models import AdmissionModality, AdmissionProcess
from modules.ingestion.models import ImportBatch


class AdmissionResult(models.Model):
    class Status(models.TextChoices):
        POSTULANT = "postulant", "Postulant"
        ADMITTED = "admitted", "Admitted"
        NOT_ADMITTED = "not_admitted", "Not admitted"
        ABSENT = "absent", "Absent"
        DISQUALIFIED = "disqualified", "Disqualified"
        OTHER = "other", "Other"

    process = models.ForeignKey(
        AdmissionProcess, on_delete=models.PROTECT, related_name="results"
    )
    major = models.ForeignKey(Major, on_delete=models.PROTECT, related_name="results")
    modality = models.ForeignKey(
        AdmissionModality,
        on_delete=models.PROTECT,
        related_name="results",
        null=True,
        blank=True,
    )
    candidate_code = models.CharField(max_length=32)
    last_names = models.CharField(max_length=200)
    given_names = models.CharField(max_length=200)
    score = models.DecimalField(
        max_digits=8, decimal_places=4, null=True, blank=True
    )
    merit = models.PositiveIntegerField(null=True, blank=True)
    status = models.CharField(max_length=32, choices=Status.choices)
    source_file = models.CharField(max_length=500, blank=True)
    source_row_number = models.PositiveIntegerField(null=True, blank=True)
    import_batch = models.ForeignKey(
        ImportBatch,
        on_delete=models.SET_NULL,
        related_name="results",
        null=True,
        blank=True,
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["process", "major", "merit", "candidate_code"]
        constraints = [
            models.UniqueConstraint(
                fields=["process", "major", "candidate_code"],
                name="unique_result_candidate_per_major_process",
            ),
            models.CheckConstraint(
                condition=models.Q(merit__isnull=True) | models.Q(merit__gt=0),
                name="result_merit_positive_or_null",
            ),
        ]
        indexes = [
            models.Index(fields=["process", "major", "status"]),
            models.Index(fields=["process", "major", "score"]),
            models.Index(fields=["candidate_code"]),
        ]

    def __str__(self):
        return f"{self.candidate_code} — {self.major.name} ({self.process})"
