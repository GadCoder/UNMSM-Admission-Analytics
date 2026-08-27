from rest_framework.response import Response
from rest_framework.views import APIView


class HealthCheckView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"status": "ok"})


class ApiRootView(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({"name": "UNMSM Admission Analytics API", "version": "v1"})
