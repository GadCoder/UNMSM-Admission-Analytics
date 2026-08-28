from django.contrib import admin

from .models import ImportBatch


@admin.register(ImportBatch)
class ImportBatchAdmin(admin.ModelAdmin):
    list_display = (
        "source_name",
        "source_path",
        "status",
        "total_rows",
        "imported_rows",
        "rejected_rows",
        "created_at",
        "completed_at",
    )
    list_filter = ("status", "source_name")
    search_fields = ("source_name", "source_path", "error_message")
    readonly_fields = ("created_at", "updated_at", "started_at", "completed_at")
