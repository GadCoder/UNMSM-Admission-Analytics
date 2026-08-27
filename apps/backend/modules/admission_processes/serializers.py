from rest_framework import serializers

from .models import AdmissionModality, AdmissionProcess


class AdmissionModalitySerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionModality
        fields = ("id", "name")


class AdmissionProcessSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdmissionProcess
        fields = ("id", "year", "sequence", "name")


class AdmissionProcessDetailSerializer(AdmissionProcessSerializer):
    result_count = serializers.IntegerField(read_only=True)
    admitted_count = serializers.IntegerField(read_only=True)
    absent_count = serializers.IntegerField(read_only=True)

    class Meta(AdmissionProcessSerializer.Meta):
        fields = AdmissionProcessSerializer.Meta.fields + (
            "result_count",
            "admitted_count",
            "absent_count",
        )
