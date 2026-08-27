from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import ProcessOverviewSerializer
from .services import latest_process_overview


class LatestProcessOverviewView(APIView):
    def get(self, request):
        overview = latest_process_overview()
        if overview is None:
            return Response(
                {"detail": "No published admission process found."}, status=404
            )
        return Response(ProcessOverviewSerializer(overview).data)
