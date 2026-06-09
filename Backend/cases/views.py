# cases/views.py
import pandas as pd
import logging
import traceback
from rest_framework.views import APIView
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Count
from django.contrib.auth.models import User
from .models import Beneficiary, CaseFile,CaseMeeting
from .serializers import BeneficiarySerializer, CaseFileSerializer
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from django.core.exceptions import ObjectDoesNotExist

class BeneficiaryViewSet(viewsets.ModelViewSet):
    queryset = Beneficiary.objects.all()
    serializer_class = BeneficiarySerializer
    permission_classes = [IsAuthenticated]


class CaseFileViewSet(viewsets.ModelViewSet):
    queryset = CaseFile.objects.all()
    serializer_class = CaseFileSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        """
        Explicit check: Only Operators are legally authorized to execute 
        initial case intake creation.
        """
        if not request.user.groups.filter(name='Operator').exists():
            return Response(
                {"detail": "Security Exception: Initial data intake operations are restricted to the Operator role."},
                status=status.HTTP_403_FORBIDDEN
            )
        return super().create(request, *args, **kwargs)


class AdminDashboardMetricsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Strictly verify the caller belongs to the Admin network
        if not request.user.groups.filter(name='Admin').exists() and not request.user.is_superuser:
            return Response({"detail": "Access Denied: Administrative privileges required."}, status=status.HTTP_403_FORBIDDEN)

        try:
            # 2. Get counts of users by role
            operators_count = User.objects.filter(groups__name='Operator').count()
            counselors_count = User.objects.filter(groups__name='Counselor').count()

            # 3. Aggregated counts (Total System volume)
            total_cases = CaseFile.objects.count()
            total_beneficiaries = Beneficiary.objects.count()

            # 4. FIXED: Group by actual model field 'region_delegation' to eliminate the FieldError crash
            geo_distribution = (
                Beneficiary.objects.values('region_delegation')
                .annotate(beneficiary_count=Count('id'))
                .order_by('-beneficiary_count')
            )

            # 5. Format geographic payload array items to match React map iterations
            formatted_geo_data = [
                {
                    "zone": item['region_delegation'] or "Unknown Location",
                    "count": item['beneficiary_count']
                }
                for item in geo_distribution
            ]

            # 6. Return response utilizing frontend-matched layout dictionary keys
            return Response({
                "summary": {
                    "active_cases": total_cases,
                    "total_beneficiaries": total_beneficiaries,
                    "intake_operators": operators_count,
                    "clinical_reviewers": counselors_count
                },
                "geo_distribution": formatted_geo_data
            }, status=status.HTTP_200_OK)

        except Exception as e:
            return Response(
                {"error": f"Internal metrics aggregation engine fault: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class AdminStaffManagementView(APIView):

    permission_classes = [IsAuthenticated]



    def get(self, request):

        # Enforce administrative access control borders

        if not request.user.groups.filter(name='Admin').exists() and not request.user.is_superuser:

            return Response({"detail": "Access Denied: Administrative operations only."}, status=status.HTTP_403_FORBIDDEN)

        

        # Gather all users who belong to the Operator or Counselor groups

        staff_users = User.objects.filter(groups__name__in=['Operator', 'Counselor']).distinct().order_by('-date_joined')

        

        staff_list = []

        for user in staff_users:

            # Identify role string based on group membership assignments

            role = 'Operator' if user.groups.filter(name='Operator').exists() else 'Counselor'

            

            staff_list.append({

                "id": user.id,

                "username": user.username,

                "email": user.email,

                "role": role,

                "is_active": user.is_active,

                "date_joined": user.date_joined.strftime("%Y-%m-%d %H:%M")

            })

            

        return Response(staff_list, status=status.HTTP_200_OK)



    def delete(self, request, pk=None):

        if not request.user.groups.filter(name='Admin').exists() and not request.user.is_superuser:

            return Response({"detail": "Access Denied: Administrative operations only."}, status=status.HTTP_403_FORBIDDEN)

        

        # Prevent self-deletion accidents

        if request.user.id == int(pk):

            return Response({"error": "Self-destruction constraint: You cannot delete your own session account user node."}, status=status.HTTP_400_BAD_REQUEST)

            

        user_to_drop = get_object_or_404(User, id=pk)

        

        # Safe check: Ensure you aren't accidentally deleting another admin through this view

        if user_to_drop.is_superuser or user_to_drop.groups.filter(name='Admin').exists():

            return Response({"error": "Security Restriction: Superusers or administrators cannot be purged through this interface."}, status=status.HTTP_403_FORBIDDEN)

            

        user_to_drop.delete()

        return Response({"message": "Operational staff profile successfully dropped from the directory registry."}, status=status.HTTP_200_OK)
    


import uuid
import pandas as pd
from django.db import transaction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework import status as http_status

# Import your actual models here
from .models import Beneficiary, CaseFile 

class BeneficiaryBulkUploadView(APIView):
    permission_classes = [IsAuthenticated]

    REQUIRED_SCHEMA = {
        'anonymous_id': 'object',
        'age': 'int64',
        'region_delegation': 'object',
        'monthly_absence_count': 'int64',
        'grade_average_delta': 'float64',
        'missed_counseling_appointments': 'int64',
        'isolation_indicator_score': 'int64',
        'raw_intake_notes': 'object'
    }

    def post(self, request):
        if not request.user.groups.filter(name='Operator').exists() and not request.user.is_superuser:
            return Response({"error": "Forbidden: Operator role required."}, status=http_status.HTTP_403_FORBIDDEN)

        uploaded_file = request.FILES.get('file')
        if not uploaded_file:
            return Response({"error": "No file payload received."}, status=http_status.HTTP_400_BAD_REQUEST)

        # 1. Parse File Stream
        try:
            if uploaded_file.name.endswith('.csv'):
                df = pd.read_csv(uploaded_file)
            elif uploaded_file.name.endswith(('.xls', '.xlsx')):
                df = pd.read_excel(uploaded_file)
            else:
                return Response({"error": "Invalid format. Use .csv or .xlsx"}, status=http_status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": f"Failed parsing document stream: {str(e)}"}, status=http_status.HTTP_400_BAD_REQUEST)

        # Normalize header layouts
        df.columns = [str(c).strip().lower() for c in df.columns]
        
        # 2. Layout Structure Verification
        missing_cols = [col for col in self.REQUIRED_SCHEMA.keys() if col not in df.columns]
        if missing_cols:
            return Response({
                "status": "schema_mismatch",
                "message": "File format structural check failed.",
                "missing_columns": missing_cols
            }, status=http_status.HTTP_422_UNPROCESSABLE_ENTITY)

        # 3. Cell Level Formats, Data Validation, and Unique Key Audits
        datatype_errors = []
        file_seen_ids = set()
        
        # Fetch all existing IDs in one single database query for performance
        existing_db_ids = set(Beneficiary.objects.values_list('anonymous_id', flat=True))

        for index, row in df.iterrows():
            row_num = index + 2
            try:
                int(row['age'])
                int(row['monthly_absence_count'])
                int(row['missed_counseling_appointments'])
                int(row['isolation_indicator_score'])
                float(row['grade_average_delta'])
                
                anon_id = str(row['anonymous_id']).strip().upper() if not pd.isna(row['anonymous_id']) else ""
                
                if anon_id == "":
                    datatype_errors.append(f"Row {row_num}: 'anonymous_id' field cannot be left blank.")
                    continue
                
                # Check A: Detect duplicates inside the uploaded file itself
                if anon_id in file_seen_ids:
                    datatype_errors.append(f"Row {row_num}: Duplicate 'anonymous_id' ({anon_id}) detected within this spreadsheet.")
                else:
                    file_seen_ids.add(anon_id)
                
                # Check B: Detect keys that conflict with records already saved in the database
                if anon_id in existing_db_ids:
                    datatype_errors.append(f"Row {row_num}: Identifiers conflict error. '{anon_id}' already exists in the database.")

                if pd.isna(row['region_delegation']) or str(row['region_delegation']).strip() == "":
                    datatype_errors.append(f"Row {row_num}: 'region_delegation' field cannot be left blank.")
                    
            except KeyError as ke:
                datatype_errors.append(f"Row {row_num}: Missing column target access: {str(ke)}")
            except (ValueError, TypeError):
                datatype_errors.append(f"Row {row_num}: Numerical attribute formatting mismatch detected.")

        if datatype_errors:
            return Response({
                "status": "datatype_mismatch",
                "message": "Data checks failed. Correct the file records below.",
                "errors": datatype_errors[:20]
            }, status=http_status.HTTP_422_UNPROCESSABLE_ENTITY)

        # 4. Atomic Multi-Table Commit Execution 
        try:
            with transaction.atomic():
                for _, row in df.iterrows():
                    provided_anon_id = str(row['anonymous_id']).strip().upper()

                    # Write to Beneficiary Table using the spreadsheet's ID directly
                    beneficiary = Beneficiary.objects.create(
                        anonymous_id=provided_anon_id,
                        age=int(row['age']),
                        region_delegation=str(row['region_delegation']).strip(),
                        registered_extracurricular_hobbies=["Amateur Cinema", "Harmonica"]
                    )

                    # Write to CaseFile Table 
                    CaseFile.objects.create(
                        beneficiary=beneficiary,
                        status='ASSESSED',  
                        monthly_absence_count=int(row['monthly_absence_count']),
                        grade_average_delta=float(row['grade_average_delta']),
                        missed_counseling_appointments=int(row['missed_counseling_appointments']),
                        isolation_indicator_score=int(row['isolation_indicator_score']),
                        raw_intake_notes=str(row['raw_intake_notes']).strip() if not pd.isna(row['raw_intake_notes']) else ""
                    )

            return Response({
                "status": "success",
                "message": f"Successfully parsed and saved {len(df)} records using direct client anonymization keys."
            }, status=http_status.HTTP_201_CREATED)

        except Exception as db_err:
            return Response({"error": f"Database transactional integrity write error: {str(db_err)}"}, status=http_status.HTTP_500_INTERNAL_SERVER_ERROR)
        

logger = logging.getLogger(__name__)

class CounselorCaseListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # 1. Broad Group Guard check to ensure string match safety
        user_groups = [g.name.lower() for g in request.user.groups.all()]
        is_authorized = 'counselor' in user_groups or 'admin' in user_groups or request.user.is_superuser
        
        if not is_authorized:
            return Response(
                {"detail": "Access Denied: Insufficient workspace authority context."}, 
                status=http_status.HTTP_403_FORBIDDEN
            )
        
        try:
            # 2. Extract elements without using any complex database-side sorting criteria
            cases = CaseFile.objects.all().select_related('beneficiary')
            
            case_data = []
            for c in cases:
                # Absolute safety check: If any registration row has a broken link, skip it safely
                if not getattr(c, 'beneficiary', None):
                    continue
                
                # Extract variables safely, providing absolute defaults if database cells contain NULL
                anon_id = getattr(c.beneficiary, 'anonymous_id', f"UNKNOWN-NODE-{c.id}")
                age = getattr(c.beneficiary, 'age', 0)
                region = getattr(c.beneficiary, 'region_district', "Unknown Region")
                current_status = getattr(c, 'status', "ASSESSED")
                
                absences = getattr(c, 'monthly_absences', 0) or 0
                grade_delta = getattr(c, 'grade_average_drop', 0.0) or 0.0
                missed_appts = getattr(c, 'missed_assignments', 0) or 0
                iso_score = getattr(c, 'isolation_score', 0) or 0
                
                updated_str = ""
                if getattr(c, 'updated_at', None):
                    updated_str = c.updated_at.strftime("%Y-%m-%d %H:%M")

                case_data.append({
                    "case_id": c.id,
                    "anonymous_id": anon_id,
                    "age": age,
                    "region": region,
                    "status": current_status,
                    "metrics": {
                        "absences": absences,
                        "grade_delta": float(grade_delta),
                        "missed_appointments": missed_appts,
                        "isolation_score": int(iso_score)
                    },
                    "updated_at": updated_str
                })
            
            # 3. Sort manually in Python to shield the view from database engine variance
            # Sorts highest isolation_score first; if identical, falls back to highest case_id
            case_data.sort(key=lambda x: (x["metrics"]["isolation_score"], x["case_id"]), reverse=True)
                
            return Response(case_data, status=http_status.HTTP_200_OK)
            
        except Exception as err:
            # This prints the deep system traceback directly onto your running server terminal
            print("\n!!! CRITICAL BACKEND ERROR TRACEBACK !!!")
            import traceback
            traceback.print_exc()
            print("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!\n")
            
            return Response(
                {"error": f"Internal collection sync execution fail: {str(err)}"}, 
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    def patch(self, request, pk=None):
        try:
            case_file = CaseFile.objects.get(id=pk)
            new_status = request.data.get('status', '').strip().upper()
            case_file.status = new_status
            case_file.save()
            return Response({"message": "Synchronized."}, status=200)
        except Exception as e:
            return Response({"error": str(e)}, status=400)


class CounselorCalendarView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.groups.filter(name__in=['Counselor', 'Admin']).exists():
            return Response({"detail": "Access Denied."}, status=status.HTTP_403_FORBIDDEN)
        
        # Fetch meetings scheduled for this logged-in counselor node from today onwards
        meetings = CaseMeeting.objects.filter(
            counselor=request.user,
            start_time__gte=timezone.now() - timezone.timedelta(days=1)
        ).select_related('case_file__beneficiary').order_by('start_time')
        
        meeting_payload = [
            {
                "id": m.id,
                "case_file_id": m.case_file.id,
                "anonymous_id": m.case_file.beneficiary.anonymous_id,
                "title": m.title,
                "start": m.start_time.isoformat(),
                "end": m.end_time.isoformat(),
                "notes": m.notes
            }
            for m in meetings
        ]
        return Response(meeting_payload, status=status.HTTP_200_OK)

class CounselorCaseDetailView(APIView):
    permission_classes = [IsAuthenticated]

    # Accepting **kwargs catches both 'pk' and 'id' dynamically from your urls.py config!
    def get(self, request, *args, **kwargs):
        # Dynamically extract whatever lookup variable urls.py passed down
        case_id = kwargs.get('pk') or kwargs.get('id')
        
        # 1. Group Check Verification
        user_groups = [g.name.lower() for g in request.user.groups.all()]
        if 'counselor' not in user_groups and 'admin' not in user_groups and not request.user.is_superuser:
            return Response({"detail": "Access Denied."}, status=http_status.HTTP_403_FORBIDDEN)

        try:
            if not case_id:
                return Response({"error": "No target case tracking ID was specified in request configuration."}, status=http_status.HTTP_400_BAD_REQUEST)

            # 2. Fetch CaseFile safely
            try:
                # Using our extracted case_id string variable
                case_file = CaseFile.objects.select_related('beneficiary').get(id=case_id)
            except (CaseFile.DoesNotExist, ObjectDoesNotExist):
                return Response(
                    {"error": f"Case record with ID {case_id} does not exist in the tracking system."}, 
                    status=http_status.HTTP_404_NOT_FOUND
                )

            beneficiary = case_file.beneficiary
            if not beneficiary:
                return Response(
                    {"error": "Case file exists but has no attached beneficiary profile structure."}, 
                    status=http_status.HTTP_400_BAD_REQUEST
                )

            # 3. Read Core Attributes matching schema column models safely
            isolation = getattr(case_file, 'social_isolation_index', 0)
            grade_variance = getattr(case_file, 'grade_average_variance', 0.0)
            absences = getattr(case_file, 'monthly_absences', 0)
            missed_tasks = getattr(case_file, 'missed_core_tasks', 0)
            
            isolation_val = 0 if isolation is None else isolation
            grade_val = 0.0 if grade_variance is None else float(grade_variance)
            absences_val = 0 if absences is None else absences
            missed_val = 0 if missed_tasks is None else missed_tasks

            anonymous_id = getattr(beneficiary, 'anonymous_id', f"GEN-ID-{case_file.id}")
            age = getattr(beneficiary, 'age', None)
            region = getattr(beneficiary, 'zone', 'Unknown Region')

            # 4. Generate the Dynamic LLM Summary Text
            simulated_llm_analysis = (
                f"Automated Behavioral Core Summary for {anonymous_id}:\n"
                f"Analysis of intake logs indicates an isolation index score of {isolation_val}/5. "
                f"The significant change in student performance (Grade Delta: {grade_val}) "
                f"combined with {absences_val} unexcused monthly absences suggests strong social withdrawal tendencies. "
                f"Clinical Recommendation: Initiate proactive direct outreach."
            )

            # 5. Assemble Final Payload
            payload = {
                "case_id": case_file.id,
                "anonymous_id": case_file.beneficiary.anonymous_id,
                "age": case_file.beneficiary.age,
                "region": case_file.beneficiary.region_delegation,
                "status": case_file.status,
                "raw_intake_notes": case_file.raw_intake_notes,
                "ai_analysis": simulated_llm_analysis,
                "metrics": {
                    "absences": case_file.monthly_absence_count,            # Mapped from model field
                    "grade_delta": case_file.grade_average_delta,          # Mapped from model field
                    "missed_appointments": case_file.missed_counseling_appointments, # Mapped from model field
                    "isolation_score": case_file.isolation_indicator_score  # Mapped from model field
                },
                # Pull existing registered meetings using the related_name='meetings'
                "scheduled_meetings": list(case_file.meetings.values('title', 'start_time', 'end_time', 'notes'))
            }
            
            return Response(payload, status=http_status.HTTP_200_OK)

        except Exception as err:
            # If it STILL fails, this print block output will finally capture why in your console terminal window
            print("\n!!! CRITICAL EXCEPTION INSIDE DETAIL VIEW OPERATION !!!")
            print(f"Error type: {type(err)}")
            print(f"Error description: {str(err)}")
            traceback.print_exc()
            return Response(
                {
                    "error": "Internal database telemetry processing breakdown.",
                    "debug_message": str(err)
                }, 
                status=http_status.HTTP_500_INTERNAL_SERVER_ERROR
            )