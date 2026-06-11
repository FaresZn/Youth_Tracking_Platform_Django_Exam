import pytest
import pandas as pd
from io import BytesIO
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient 
from django.contrib.auth.models import Group, User

@pytest.mark.django_db
class TestBeneficiaryBulkUploadView:
    
    @pytest.fixture(autouse=True)
    def setup_api_client(self):
        self.client = APIClient()
        self.group, _ = Group.objects.get_or_create(name='Operator')
        self.user, _ = User.objects.get_or_create(username='testop')
        self.user.groups.add(self.group)
        self.url = reverse('beneficiary-bulk-upload')

    def create_csv_file(self, data):
        df = pd.DataFrame(data)
        file = BytesIO()
        df.to_csv(file, index=False)
        file.seek(0)
        file.name = 'test_upload.csv'
        return file

    def test_upload_success(self):
        self.client.force_authenticate(user=self.user)
        data = {
            'anonymous_id': ['STU001'],
            'age': [18],
            'region_delegation': ['North'],
            'monthly_absence_count': [2],
            'grade_average_delta': [1.5],
            'missed_counseling_appointments': [0],
            'isolation_indicator_score': [1],
            'raw_intake_notes': ['Healthy']
        }
        file = self.create_csv_file(data)
        response = self.client.post(self.url, {'file': file}, format='multipart')
        if response.status_code == 400:
            print(response.data)
        assert response.status_code == status.HTTP_201_CREATED
        assert "Successfully parsed" in response.data['message']

    def test_failure_schema_mismatch(self):
        self.client.force_authenticate(user=self.user)
        data = {'anonymous_id': ['STU002']} 
        file = self.create_csv_file(data)
        response = self.client.post(self.url, {'file': file}, format='multipart')
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert response.data['status'] == 'schema_mismatch'

    def test_failure_duplicate_id_in_db(self):
        from cases.models import Beneficiary
        Beneficiary.objects.create(anonymous_id='STU001', age=20, region_delegation='Test')
        
        self.client.force_authenticate(user=self.user)
        data = {
            'anonymous_id': ['STU001'], 
            'age': [18], 'region_delegation': ['North'],
            'monthly_absence_count': [2], 'grade_average_delta': [1.5],
            'missed_counseling_appointments': [0], 'isolation_indicator_score': [1],
            'raw_intake_notes': ['']
        }
        file = self.create_csv_file(data)
        response = self.client.post(self.url, {'file': file}, format='multipart')
        
        assert response.status_code == status.HTTP_422_UNPROCESSABLE_ENTITY
        assert any("already exists in the database" in err for err in response.data['errors'])