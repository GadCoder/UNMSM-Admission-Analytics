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
        max_digits=8, decimal_places=4, allow_null=True,
        help_text="Average valid score among admitted applicants in this career within the applied filters.",
    )
    is_new = serializers.BooleanField(help_text="Whether this major has results in exactly one published process.")


class ProcessOverviewSerializer(serializers.Serializer):
    process = AdmissionProcessSerializer()
    total_results = serializers.IntegerField()
    admitted_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    average_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True,
        help_text="Average valid score among admitted applicants within the applied filters.",
    )
    minimum_admitted_score = serializers.FloatField(allow_null=True)
    admitted_score_modality_count = serializers.IntegerField()
    admitted_score_modality = serializers.CharField(allow_null=True)
    highest_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True,
        help_text="Maximum valid score among admitted applicants within the applied filters.",
    )
    majors = MajorOverviewSerializer(many=True)


class ComparativeOverviewSerializer(serializers.Serializer):
    processes = ProcessOverviewSerializer(many=True)


class ProcessHistoryItemSerializer(serializers.Serializer):
    process = AdmissionProcessSerializer()
    total_results = serializers.IntegerField()
    admitted_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    average_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True,
        help_text="Average valid score among admitted applicants within the applied filters.",
    )
    minimum_admitted_score = serializers.FloatField(allow_null=True)
    admitted_score_modality_count = serializers.IntegerField()
    admitted_score_modality = serializers.CharField(allow_null=True)
    highest_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True,
        help_text="Maximum valid score among admitted applicants within the applied filters.",
    )


class ProcessHistorySerializer(serializers.Serializer):
    processes = ProcessHistoryItemSerializer(many=True)


class MajorProcessDetailSerializer(serializers.Serializer):
    process = AdmissionProcessSerializer()
    total_results = serializers.IntegerField()
    admitted_count = serializers.IntegerField()
    absent_count = serializers.IntegerField()
    average_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True,
        help_text="Average valid score among admitted applicants in this career, process and modality.",
    )
    minimum_admitted_score = serializers.FloatField(allow_null=True)
    admitted_score_modality_count = serializers.IntegerField()
    admitted_score_modality = serializers.CharField(allow_null=True)
    highest_score = serializers.DecimalField(
        max_digits=8, decimal_places=4, allow_null=True,
        help_text="Maximum valid score among admitted applicants in this career, process and modality.",
    )


class MajorDetailSerializer(serializers.Serializer):
    major = serializers.DictField()
    selected_processes = MajorProcessDetailSerializer(many=True)
    history = MajorProcessDetailSerializer(many=True)
