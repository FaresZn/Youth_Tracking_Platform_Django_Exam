# cases/models.py
from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator
from django.core.exceptions import ValidationError

class Beneficiary(models.Model):
    anonymous_id = models.CharField(max_length=60, unique=True, db_index=True)
    age = models.IntegerField(validators=[MinValueValidator(12), MaxValueValidator(24)])
    region_delegation = models.CharField(max_length=100)
    registered_extracurricular_hobbies = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.anonymous_id


class CaseFile(models.Model):
    STATUS_CHOICES = [
        ('INTAKE', 'Intake / New Registration'),
        ('ASSESSED', 'Assessed / Risk Flagged'),
        ('PLANNING', 'Intervention Strategy Planned'),
        ('CLOSED', 'Case Securely Closed'),
    ]

    beneficiary = models.OneToOneField(Beneficiary, on_delete=models.CASCADE, related_name='case_file')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='INTAKE', db_index=True)
    
    # Scenario 1 & 2 quantitative variables
    monthly_absence_count = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    grade_average_delta = models.FloatField(default=0.0)  
    missed_counseling_appointments = models.IntegerField(default=0, validators=[MinValueValidator(0)])
    isolation_indicator_score = models.IntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(5)])
    
    raw_intake_notes = models.TextField(blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Case {self.beneficiary.anonymous_id} - [{self.status}]"

    def save(self, *args, **kwargs):
        """
        Deterministic Triage Rules Engine (Prevents 'Black-Box' opacity).
        Automatically flags cases crossing Scenario 1 risk-threshold boundaries.
        """
        # Capture previous state configuration if updating an existing record
        old_status = None
        if self.pk:
            old_status = CaseFile.objects.get(pk=self.pk).status

        # 🔍 Hard Rule Triage Execution: Scenario 1 Thresholds
        # If absences exceed 7 days AND grade average delta shows a drop of 3 points or worse
        if self.monthly_absence_count > 7 and self.grade_average_delta <= -3.0:
            if self.status == 'INTAKE':
                self.status = 'ASSESSED'

        super().save(*args, **kwargs)

        # Log state transition if a status variance occurs
        if old_status and old_status != self.status:
            CaseTimelineLog.objects.create(
                case_file=self,
                previous_state=old_status,
                new_state=self.status,
                system_notes=f"Automated System Rules Engine executed triage update based on indicators."
            )


class CaseTimelineLog(models.Model):
    case_file = models.ForeignKey(CaseFile, on_delete=models.CASCADE, related_name='timeline_logs')
    operator_action_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    previous_state = models.CharField(max_length=20)
    new_state = models.CharField(max_length=20)
    timestamp = models.DateTimeField(auto_now_add=True)
    system_notes = models.TextField()

    class Meta:
        ordering = ['-timestamp']

    def __str__(self):
        return f"{self.case_file.beneficiary.anonymous_id}: {self.previous_state} -> {self.new_state}"


class CaseMeeting(models.Model):
    # Change rel_name='meetings' to related_name='meetings'
    case_file = models.ForeignKey('CaseFile', on_delete=models.CASCADE, related_name='meetings')
    counselor = models.ForeignKey(User, on_delete=models.CASCADE, limit_choices_to={'groups__name': 'Counselor'})
    title = models.CharField(max_length=255, default="Clinical Counseling Session")
    start_time = models.DateTimeField()
    end_time = models.DateTimeField()
    notes = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Meeting for {self.case_file.beneficiary.anonymous_id} on {self.start_time.strftime('%Y-%m-%d')}"