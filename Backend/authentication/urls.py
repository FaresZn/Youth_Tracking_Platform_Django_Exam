# authentication/urls.py
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView, LogoutAndBlacklistView, AdminProvisionUserView, VerifyOTPView,RegisterStaffView

urlpatterns = [
    # 🔑 Points to your custom MFA interceptor view
    path('login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    
    # 2FA challenge check destination
    path('login/verify-otp/', VerifyOTPView.as_view(), name='verify_otp'),
    
    # Token operations
    path('login/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('logout/', LogoutAndBlacklistView.as_view(), name='token_logout'),
    
    # Administration provisioning panel
    path('provision-user/', AdminProvisionUserView.as_view(), name='admin_provision_user'),
    path('register-staff/', RegisterStaffView.as_view(), name='register-staff'),
]