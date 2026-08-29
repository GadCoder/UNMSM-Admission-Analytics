from django.urls import path

from config.views import ApiRootView
from modules.academics.api_views import (
    ActiveAcademicAreaListView,
    ActiveFacultyListView,
    ActiveMajorListView,
)
from modules.admission_processes.api_views import (
    ActiveModalityListView,
    PublishedProcessDetailView,
    PublishedProcessListView,
)
from modules.analytics.api_views import (
    ComparativeOverviewView,
    LatestProcessOverviewView,
    MajorDetailView,
)

urlpatterns = [
    path("", ApiRootView.as_view(), name="api-root"),
    path("academic-areas/", ActiveAcademicAreaListView.as_view(), name="academic-areas"),
    path("faculties/", ActiveFacultyListView.as_view(), name="faculties"),
    path("majors/", ActiveMajorListView.as_view(), name="majors"),
    path("modalities/", ActiveModalityListView.as_view(), name="modalities"),
    path("processes/", PublishedProcessListView.as_view(), name="processes"),
    path("processes/<int:pk>/", PublishedProcessDetailView.as_view(), name="process-detail"),
    path("analytics/latest/", LatestProcessOverviewView.as_view(), name="latest-overview"),
    path("analytics/overview/", ComparativeOverviewView.as_view(), name="comparative-overview"),
    path("analytics/majors/<int:major_id>/", MajorDetailView.as_view(), name="major-detail"),
]
