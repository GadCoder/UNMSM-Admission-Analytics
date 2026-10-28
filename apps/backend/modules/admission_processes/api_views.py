from django.db.models import Count, Q
from rest_framework.generics import ListAPIView, RetrieveAPIView

from modules.results.models import AdmissionResult

from .models import AdmissionModality, AdmissionProcess
from .serializers import (
    AdmissionModalitySerializer,
    AdmissionProcessDetailSerializer,
    PublishedProcessSerializer,
)


class ActiveModalityListView(ListAPIView):
    serializer_class = AdmissionModalitySerializer
    queryset = AdmissionModality.objects.filter(is_active=True)


class PublishedProcessListView(ListAPIView):
    serializer_class = PublishedProcessSerializer
    queryset = AdmissionProcess.objects.filter(is_published=True).order_by(
        "-year", "-sequence"
    )

    def get_serializer_context(self):
        context = super().get_serializer_context()
        modality_ids_by_process = {}
        pairs = (
            AdmissionResult.objects.filter(
                process__is_published=True, modality__is_active=True
            )
            .order_by("process_id", "modality_id")
            .values_list("process_id", "modality_id")
            .distinct()
        )
        for process_id, modality_id in pairs:
            modality_ids_by_process.setdefault(process_id, []).append(modality_id)
        context["modality_ids_by_process"] = modality_ids_by_process
        return context


class PublishedProcessDetailView(RetrieveAPIView):
    serializer_class = AdmissionProcessDetailSerializer
    queryset = AdmissionProcess.objects.filter(is_published=True).annotate(
        result_count=Count("results"),
        admitted_count=Count("results", filter=Q(results__status="admitted")),
        absent_count=Count("results", filter=Q(results__status="absent")),
    )
