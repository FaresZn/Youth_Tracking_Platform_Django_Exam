# authentication/serializers.py
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth.models import User, Group
from .models import UserOTP
from django.core.mail import send_mail

# authentication/serializers.py
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.mail import send_mail
from .models import UserOTP

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        # 1. Authenticate standard username/password records natively first
        data = super().validate(attrs)
        user = self.user
        
        # 2. Fetch or create the OTP relational database profile slot
        otp_profile, _ = UserOTP.objects.get_or_create(user=user)
        code = otp_profile.generate_otp()
        
        # 3. Print verification email message directly to terminal standard output
        send_mail(
            subject="🔑 Secure OTP Verification - Réseau Vigilance Jeunesse",
            message=f"Hello {user.username},\n\nYour single-use authorization passcode is: {code}\nThis code expires in 10 minutes.",
            from_email="security@vigilance-jeunesse.tn",
            recipient_list=[user.email],
            fail_silently=False,
        )
        
        # 4. Clear out access/refresh keys from this initial payload stage!
        # This prevents bypassing the verification step.
        return {
            "mfa_status": "verification_required",
            "username": user.username,
            "detail": "A verification token has been successfully dispatched to your registered email address."
        }

class AdminUserProvisionSerializer(serializers.ModelSerializer):
    role = serializers.ChoiceField(choices=['Operator', 'Counselor', 'Admin'])

    class Meta:
        model = User
        fields = ['username', 'email', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        role_name = validated_data.pop('role')
        password = validated_data.pop('password')
        
        # Create standard auth user
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.save()
        
        # Assign chosen structural group
        group = Group.objects.get(name=role_name)
        user.groups.add(group)
        
        # Initialize their blank OTP structure
        UserOTP.objects.create(user=user)
        
        return user