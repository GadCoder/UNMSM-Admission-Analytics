from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        responses=inline_serializer(
            name="HealthCheckResponse",
            fields={"status": serializers.CharField()},
        )
    )
    def get(self, request):
        return Response({"status": "ok"})


class ApiRootView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(
        responses=inline_serializer(
            name="ApiRootResponse",
            fields={
                "name": serializers.CharField(),
                "version": serializers.CharField(),
                "resources": serializers.DictField(
                    child=serializers.CharField(),
                ),
            },
        )
    )
    def get(self, request):
        return Response(
            {
                "name": "UNMSM Admission Analytics API",
                "version": "v1",
                "resources": {
                    "academic_areas": "/api/v1/academic-areas/",
                    "faculties": "/api/v1/faculties/",
                    "majors": "/api/v1/majors/",
                    "modalities": "/api/v1/modalities/",
                    "processes": "/api/v1/processes/",
                    "latest_overview": "/api/v1/analytics/latest/",
                    "comparative_overview": "/api/v1/analytics/overview/",
                    "process_history": "/api/v1/analytics/history/",
                },
            }
        )


class ReadinessView(APIView):
    authentication_classes = []
    permission_classes = []

    @extend_schema(exclude=True)
    def get(self, request):
        import logging

        from django.db import connection

        try:
            with connection.cursor() as cursor:
                cursor.execute("SELECT 1")
                cursor.fetchone()
        except Exception:
            logging.getLogger(__name__).exception("Readiness database check failed")
            response = Response({"status": "unavailable"}, status=503)
        else:
            response = Response({"status": "ok"})
        response["Cache-Control"] = "no-store"
        return response
