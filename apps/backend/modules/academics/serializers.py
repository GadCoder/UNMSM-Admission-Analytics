from rest_framework import serializers

from .models import AcademicArea, Faculty, Major


class AcademicAreaSerializer(serializers.ModelSerializer):
    class Meta:
        model = AcademicArea
        fields = ("id", "code", "name")


class FacultySerializer(serializers.ModelSerializer):
    class Meta:
        model = Faculty
        fields = ("id", "code", "name", "academic_area_id")


class MajorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Major
        fields = ("id", "code", "name", "faculty_id")
