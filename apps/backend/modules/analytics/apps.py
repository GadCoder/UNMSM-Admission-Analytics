from django.apps import AppConfig


class AnalyticsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "modules.analytics"

    def ready(self):
        from . import signals  # noqa: F401
