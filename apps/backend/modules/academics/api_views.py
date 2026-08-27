from rest_framework.generics import ListAPIView

from .models import AcademicArea, Faculty, Major
from .serializers import AcademicAreaSerializer, FacultySerializer, MajorSerializer


class ActiveAcademicAreaListView(ListAPIView):
    serializer_class = AcademicAreaSerializer
    queryset = AcademicArea.objects.filter(is_active=True)


class ActiveFacultyListView(ListAPIView):
    serializer_class = FacultySerializer
    queryset = Faculty.objects.filter(is_active=True).select_related("academic_area")


class ActiveMajorListView(ListAPIView):
    serializer_class = MajorSerializer
    queryset = Major.objects.filter(is_active=True).select_related("faculty")
