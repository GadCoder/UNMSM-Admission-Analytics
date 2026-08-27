from django.db import models


class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True


class AcademicArea(TimestampedModel):
    code = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=150)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [models.Index(fields=["is_active", "name"])]

    def __str__(self):
        return f"{self.code} — {self.name}"


class Faculty(TimestampedModel):
    academic_area = models.ForeignKey(
        AcademicArea, on_delete=models.PROTECT, related_name="faculties"
    )
    code = models.CharField(max_length=16)
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        constraints = [
            models.UniqueConstraint(
                fields=["academic_area", "code"], name="unique_faculty_code_per_area"
            ),
        ]
        indexes = [
            models.Index(fields=["academic_area", "is_active"]),
            models.Index(fields=["is_active", "name"]),
        ]

    def __str__(self):
        return f"{self.code} — {self.name}"


class Major(TimestampedModel):
    faculty = models.ForeignKey(
        Faculty, on_delete=models.PROTECT, related_name="majors"
    )
    code = models.CharField(max_length=16, unique=True)
    name = models.CharField(max_length=200)
    is_active = models.BooleanField(default=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["faculty", "is_active"]),
            models.Index(fields=["is_active", "name"]),
        ]

    def __str__(self):
        return f"{self.code} — {self.name}"
