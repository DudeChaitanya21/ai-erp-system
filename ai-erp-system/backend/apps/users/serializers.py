from django.contrib.auth.models import User
from rest_framework import serializers
from .models import UserProfile


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ["role", "phone", "department"]


class UserManagementSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer()

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "is_active",
            "is_staff",
            "date_joined",
            "profile",
        ]
        read_only_fields = ["id", "date_joined"]

    def update(self, instance, validated_data):
        profile_data = validated_data.pop("profile", None)

        for key, value in validated_data.items():
            setattr(instance, key, value)
        instance.save()

        if profile_data:
            profile, _ = UserProfile.objects.get_or_create(user=instance)
            for key, value in profile_data.items():
                setattr(profile, key, value)
            profile.save()

            role = profile.role
            if role == "admin":
                instance.is_staff = True
                instance.is_superuser = True
            elif role == "manager":
                instance.is_staff = True
                instance.is_superuser = False
            else:
                instance.is_staff = False
                instance.is_superuser = False
            instance.save()

        return instance