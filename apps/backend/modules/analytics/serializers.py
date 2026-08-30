from rest_framework import serializers

from modules.admission_processes.serializers import AdmissionProcessSerializer


class MajorOverviewSerializer(serializers.Serializer):
    major_id = serializers.IntegerField()
    major_code = serializers.CharField(source="major__code")
    major_name = serializers.CharField(source="major__name")
    total_results = serializers.IntegerField()
    admitted_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    average_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True
    )


class ProcessOverviewSerializer(serializers.Serializer):
    process = AdmissionProcessSerializer()
    total_results = serializers.IntegerField()
    admitted_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    average_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True
    )
    highest_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True
    )
    majors = MajorOverviewSerializer(many=True)


class ComparativeOverviewSerializer(serializers.Serializer):
    processes = ProcessOverviewSerializer(many=True)


class MajorProcessDetailSerializer(serializers.Serializer):
    process = AdmissionProcessSerializer()
    total_results = serializers.IntegerField()
    admitted_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    average_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True
    )
    highest_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True
    )


class MajorDetailSerializer(serializers.Serializer):
    major = serializers.DictField()
    selected_processes = MajorProcessDetailSerializer(many=True)
    history = MajorProcessDetailSerializer(many=True)
