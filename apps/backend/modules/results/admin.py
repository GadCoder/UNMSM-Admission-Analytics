from django.contrib import admin

from .models import AdmissionResult


@admin.register(AdmissionResult)
class AdmissionResultAdmin(admin.ModelAdmin):
    list_display = (
        "candidate_code",
        "last_names",
        "given_names",
        "process",
        "major",
        "status",
        "score",
        "merit",
    )
    list_filter = ("process", "status", "modality", "major__faculty")
    search_fields = (
        "candidate_code",
        "last_names",
        "given_names",
        "major__name",
    )
    list_select_related = ("process", "major", "modality")
    readonly_fields = ("created_at", "updated_at")
