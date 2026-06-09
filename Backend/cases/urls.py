# cases/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from cases.views import BeneficiaryViewSet, CaseFileViewSet, AdminDashboardMetricsView, AdminStaffManagementView, BeneficiaryBulkUploadView,CounselorCaseListView, CounselorCalendarView, CounselorCaseDetailView

router = DefaultRouter()
router.register(r'beneficiaries', BeneficiaryViewSet, basename='beneficiary')
router.register(r'files', CaseFileViewSet, basename='casefile')

urlpatterns = [
    path('', include(router.urls)),
    path('admin-metrics/', AdminDashboardMetricsView.as_view(), name='admin-metrics'),
    path('admin-staff/', AdminStaffManagementView.as_view(), name='admin-staff-list'),
    path('admin-staff/<int:pk>/', AdminStaffManagementView.as_view(), name='admin-staff-detail'),
    path('bulk-upload/', BeneficiaryBulkUploadView.as_view(), name='beneficiary-bulk-upload'),
    path('counselor/cases/', CounselorCaseListView.as_view(), name='counselor-cases-list'),
    path('counselor/cases/<int:pk>/', CounselorCaseListView.as_view(), name='counselor-case-patch'),
    path('counselor/calendar/', CounselorCalendarView.as_view(), name='counselor-calendar-feed'),
    path('counselor/cases/detail/<int:id>/', CounselorCaseDetailView.as_view(), name='counselor-case-detail-node'),
]