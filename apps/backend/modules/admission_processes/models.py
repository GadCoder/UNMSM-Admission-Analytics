from django.db import models


class AdmissionProcess(models.Model):
    year = models.PositiveSmallIntegerField()
    sequence = models.CharField(max_length=32)
    name = models.CharField(max_length=150, blank=True)
    is_published = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-year", "sequence"]
        constraints = [
            models.UniqueConstraint(
                fields=["year", "sequence"], name="unique_admission_process"
            ),
        ]
        indexes = [
            models.Index(fields=["-year", "sequence"]),
            models.Index(fields=["is_published", "-year"]),
        ]

    def __str__(self):
        return f"{self.year} — {self.sequence}"


class AdmissionModality(models.Model):
    name = models.CharField(max_length=200, unique=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["is_active", "name"])]

    def __str__(self):
        return self.name
