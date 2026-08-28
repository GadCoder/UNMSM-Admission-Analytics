from django.db.models import Count, Q
from rest_framework.generics import ListAPIView, RetrieveAPIView

from .models import AdmissionModality, AdmissionProcess
from .serializers import (
    AdmissionModalitySerializer,
    AdmissionProcessDetailSerializer,
    AdmissionProcessSerializer,
)


class ActiveModalityListView(ListAPIView):
    serializer_class = AdmissionModalitySerializer
    queryset = AdmissionModality.objects.filter(is_active=True)


class PublishedProcessListView(ListAPIView):
    serializer_class = AdmissionProcessSerializer
    queryset = AdmissionProcess.objects.filter(is_published=True).order_by(
        "-year", "-sequence"
    )


class PublishedProcessDetailView(RetrieveAPIView):
    serializer_class = AdmissionProcessDetailSerializer
    queryset = AdmissionProcess.objects.filter(is_published=True).annotate(
        result_count=Count("results"),
        admitted_count=Count("results", filter=Q(results__status="admitted")),
        absent_count=Count("results", filter=Q(results__status="absent")),
    )
