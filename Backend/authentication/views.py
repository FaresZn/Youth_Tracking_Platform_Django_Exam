# authentication/views.py
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status, views
from .serializers import CustomTokenObtainPairSerializer, AdminUserProvisionSerializer
from django.contrib.auth.models import User, Group
from django.core.mail import send_mail
from .models import UserOTP
from rest_framework_simplejwt.tokens import RefreshToken
from .models import UserProfile


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    POST View to capture credentials, return JWT Access/Refresh tokens,
    and expose the authorized role dashboard path.
    """
    serializer_class = CustomTokenObtainPairSerializer

class LogoutAndBlacklistView(APIView):
    """
    A view to handle explicit client logouts by confirming 
    successful token discarding safely on the client container.
    """
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        # In simple stateless JWT architectures, explicit client token discarding
        # is typically executed by destroying the tokens on the client application container.
        return Response(
            {"detail": "Successfully logged out. Clean up authorization tokens on client side."}, 
            status=status.HTTP_200_OK
        )

class AdminProvisionUserView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.groups.filter(name='Admin').exists() and not request.user.is_superuser:
            return Response(
                {"error": "Security Restriction: Only System Administrators can provision staff accounts."},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        role = data.get('role')  
        zone = data.get('zone')

        if not all([username, password, email, role, zone]):
            return Response({"error": "All credential validation fields are mandatory."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "An internal node with this username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create base account
            user = User.objects.create_user(username=username, email=email, password=password)

            # Assign group
            group, created = Group.objects.get_or_create(name=role)
            user.groups.add(group)

            # Access the automatically generated profile (via signal) and save the zone
            profile = user.profile
            profile.zone = zone
            profile.save()

            return Response({"status": "Account created successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Database write failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTPView(views.APIView):
    """
    POST endpoint to validate 2FA tokens and issue final access tokens.
    """
    permission_classes = [] # Allow unauthenticated challenge submission

    def post(self, request):
        username = request.data.get("username")
        submitted_code = request.data.get("otp_code")
        
        try:
            user = User.objects.get(username=username)
            otp_profile = user.otp_profile
        except (User.DoesNotExist, UserOTP.DoesNotExist):
            return Response({"detail": "Invalid authentication request parameter state."}, status=status.HTTP_400_BAD_REQUEST)

        # Confirm match and validate expiration timeline boundaries
        if otp_profile.otp_code == submitted_code and otp_profile.is_valid():
            otp_profile.is_verified = True
            otp_profile.save()
            
            # Programmatically compile standard JWT payload tokens manually
            refresh = RefreshToken.for_user(user)
            user_groups = list(user.groups.values_list('name', flat=True))
            
            # Resolve target dashboard routing paths
            if 'Admin' in user_groups:
                dashboard = 'admin_analytics'
            elif 'Counselor' in user_groups:
                dashboard = 'counselor_workspace'
            else:
                dashboard = 'operator_intake'

            return Response({
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "username": user.username,
                    "roles": user_groups,
                    "target_dashboard": dashboard
                }
            }, status=status.HTTP_200_OK)
            
        return Response({"detail": "Security Exception: Passcode is invalid or has expired."}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterStaffView(APIView):
    # Enforce that only logged-in users with Admin clearance can create accounts
    permission_classes = [IsAuthenticated]

    def post(self, request):
        # 1. Check if the logged-in requester is actually an Administrator
        if not request.user.groups.filter(name='Admin').exists() and not request.user.is_superuser:
            return Response(
                {"error": "Security Restriction: Only System Administrators can provision staff accounts."},
                status=status.HTTP_403_FORBIDDEN
            )

        data = request.data
        username = data.get('username')
        password = data.get('password')
        email = data.get('email')
        role = data.get('role')  # Expecting 'Operator' or 'Counselor'
        zone = data.get('zone')

        # 2. Base Validation
        if not all([username, password, email, role, zone]):
            return Response({"error": "All credential validation fields are mandatory."}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({"error": "An internal node with this username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # 3. Create the Base Django User Object
            user = User.objects.create_user(username=username, email=email, password=password)

            # 4. Bind the Institutional Role Group
            group, created = Group.objects.get_or_create(name=role)
            user.groups.add(group)

            # 5. Populate and Save the Extended Geographic Field
            UserProfile.objects.create(user=user, zone=zone)

            return Response({"status": "Account created successfully!"}, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({"error": f"Database write failure: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    