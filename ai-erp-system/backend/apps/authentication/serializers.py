from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from apps.users.models import UserProfile


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, required=True)
    role = serializers.CharField(write_only=True, required=False, default="staff")

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "password", "password2", "role"]

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        role = validated_data.pop("role", "staff")

        user = User.objects.create_user(**validated_data)

        # Basic role flags for ERP
        if role == "admin":
            user.is_staff = True
            user.is_superuser = True
        elif role == "manager":
            user.is_staff = True
        else:
            user.is_staff = False

        user.save()
        UserProfile.objects.get_or_create(user=user, defaults={"role": role})
        return user


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name", "is_active", "role"]

    def get_role(self, obj):
        if obj.is_superuser:
            return "admin"
        if obj.is_staff:
            return "manager"
        return "staff"