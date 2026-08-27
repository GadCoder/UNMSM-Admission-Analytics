from django.contrib import admin

from .models import AcademicArea, Faculty, Major


@admin.register(AcademicArea)
class AcademicAreaAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "is_active")
    list_filter = ("is_active",)
    search_fields = ("code", "name")


@admin.register(Faculty)
class FacultyAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "academic_area", "is_active")
    list_filter = ("academic_area", "is_active")
    search_fields = ("code", "name")
    list_select_related = ("academic_area",)


@admin.register(Major)
class MajorAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "faculty", "is_active")
    list_filter = ("faculty", "is_active")
    search_fields = ("code", "name", "faculty__name")
    list_select_related = ("faculty",)
