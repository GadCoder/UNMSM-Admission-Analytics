from django.urls import path

from config.views import ApiRootView

urlpatterns = [
    path("", ApiRootView.as_view(), name="api-root"),
]
