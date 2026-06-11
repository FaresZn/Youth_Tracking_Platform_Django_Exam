import pytest
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APIClient
from django.urls import reverse

@pytest.mark.django_db
class TestAuthentication:
    @pytest.fixture(autouse=True)
    def setup(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='authuser', password='password123')
        self.protected_url = reverse('beneficiary-list') 

    def test_unauthenticated_user_cannot_access(self):
        """Ensure an unauthenticated request receives a 401 or 403."""
        response = self.client.get(self.protected_url)
        assert response.status_code in [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN]

    def test_login_success(self):
        """Ensure valid credentials allow login."""
        response = self.client.post(reverse('token_obtain_pair'), { 
            'username': 'authuser',
            'password': 'password123'
        })
        assert response.status_code == status.HTTP_200_OK

    def test_authenticated_user_access(self):
        """Ensure an authenticated user can access the protected resource."""
        self.client.force_authenticate(user=self.user)
        response = self.client.get(self.protected_url)
        assert response.status_code == status.HTTP_200_OK