from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from modules.admission_processes.models import AdmissionProcess

from .serializers import ComparativeOverviewSerializer, ProcessOverviewSerializer
from .services import latest_process_overview, process_overviews


class LatestProcessOverviewView(APIView):
    @extend_schema(
        responses={
            200: ProcessOverviewSerializer,
            404: OpenApiResponse(description="No published admission process found."),
        }
    )
    def get(self, request):
        overview = latest_process_overview()
        if overview is None:
            return Response(
                {"detail": "No published admission process found."}, status=404
            )
        return Response(ProcessOverviewSerializer(overview).data)


class ComparativeOverviewView(APIView):
    @extend_schema(
        responses={
            200: ComparativeOverviewSerializer,
            400: OpenApiResponse(description="Invalid process ID query parameter."),
            404: OpenApiResponse(
                description="A requested process does not exist or is unpublished."
            ),
        }
    )
    def get(self, request):
        process_value = request.query_params.get("process")
        if process_value is None or not process_value.strip():
            return Response(
                {"detail": "The process query parameter is required and cannot be empty."},
                status=400,
            )

        process_ids, error = self._parse_ids(process_value, "process")
        if error:
            return Response({"detail": error}, status=400)

        compare_value = request.query_params.get("compare")
        if compare_value is not None:
            compare_ids, error = self._parse_ids(compare_value, "compare")
            if error:
                return Response({"detail": error}, status=400)
            process_ids.extend(compare_ids)

        published_ids = set(
            AdmissionProcess.objects.filter(
                is_published=True, id__in=process_ids
            ).values_list("id", flat=True)
        )
        if any(process_id not in published_ids for process_id in process_ids):
            return Response(
                {"detail": "Admission process not found or is not published."},
                status=404,
            )

        return Response(
            ComparativeOverviewSerializer(
                {"processes": process_overviews(process_ids)}
            ).data
        )

    @staticmethod
    def _parse_ids(value, parameter):
        values = [item.strip() for item in value.split(",")]
        if any(not item.isdigit() or int(item) <= 0 for item in values):
            return None, f"The {parameter} query parameter must contain positive integer IDs."
        return [int(item) for item in values], None
