from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, OpenApiResponse, extend_schema
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
    max_processes = 4
    max_id_digits = 10

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="process",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Required comma-separated positive integer process IDs (maximum 4 unique IDs total).",
            ),
            OpenApiParameter(
                name="compare",
                type=OpenApiTypes.STR,
                location=OpenApiParameter.QUERY,
                required=False,
                description="Optional comma-separated positive integer process IDs (maximum 4 unique IDs total).",
            ),
        ],
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

        process_ids = list(dict.fromkeys(process_ids))
        if len(process_ids) > self.max_processes:
            return Response(
                {"detail": f"A maximum of {self.max_processes} unique processes may be compared."},
                status=400,
            )

        try:
            overviews = process_overviews(process_ids)
        except AdmissionProcess.DoesNotExist:
            return Response(
                {"detail": "Admission process not found or is not published."},
                status=404,
            )

        return Response(
            ComparativeOverviewSerializer({"processes": overviews}).data
        )

    @staticmethod
    def _parse_ids(value, parameter):
        values = [item.strip() for item in value.split(",")]
        if any(
            not item.isdigit()
            or len(item) > ComparativeOverviewView.max_id_digits
            or int(item) <= 0
            for item in values
        ):
            return None, f"The {parameter} query parameter must contain positive integer IDs."
        return [int(item) for item in values], None
