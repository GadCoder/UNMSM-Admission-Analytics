from django.contrib import admin

from .models import AdmissionModality, AdmissionProcess


@admin.register(AdmissionProcess)
class AdmissionProcessAdmin(admin.ModelAdmin):
    list_display = ("year", "sequence", "name", "is_published")
    list_filter = ("year", "is_published")
    search_fields = ("sequence", "name")
    ordering = ("-year", "sequence")


@admin.register(AdmissionModality)
class AdmissionModalityAdmin(admin.ModelAdmin):
    list_display = ("name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("name",)
