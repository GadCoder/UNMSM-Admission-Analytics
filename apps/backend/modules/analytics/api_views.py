from drf_spectacular.utils import OpenApiResponse, extend_schema
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ProcessOverviewSerializer
from .services import latest_process_overview


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
