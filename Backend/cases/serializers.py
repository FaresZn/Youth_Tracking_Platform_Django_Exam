# cases/serializers.py
from rest_framework import serializers
from .models import Beneficiary, CaseFile, CaseTimelineLog

class BeneficiarySerializer(serializers.ModelSerializer):
    class Meta:
        model = Beneficiary
        fields = '__all__'


class CaseFileSerializer(serializers.ModelSerializer):
    beneficiary = BeneficiarySerializer(read_only=True)
    beneficiary_id = serializers.PrimaryKeyRelatedField(
        queryset=Beneficiary.objects.all(), source='beneficiary', write_only=True
    )

    class Meta:
        model = CaseFile
        fields = [
            'id', 'beneficiary', 'beneficiary_id', 'status', 
            'monthly_absence_count', 'grade_average_delta', 
            'missed_counseling_appointments', 'isolation_score', 
            'raw_intake_notes', 'updated_at'
        ]
    
    def get_isolation_score(self, obj):
        # Return the field from the model
        return obj.isolation_indicator_score

    def to_representation(self, instance):
        """
        Dynamically redacts qualitative fields unless the authorized user is a Counselor.
        """
        representation = super().to_representation(instance)
        request = self.context.get('request')

        if request and request.user:
            # Check if user belongs to the Counselor group
            is_counselor = request.user.groups.filter(name='Counselor').exists()
            
            if not is_counselor:
                # Mask sensitive free-text fields for Operators and Admins
                representation['raw_intake_notes'] = "[REDACTED - SENSITIVE CONTENT - COUNSELOR ACCESS ONLY]"
                
        return representation

class CaseDetailSerializer(serializers.ModelSerializer):
    # Constructing the nested metrics object explicitly to fulfill the React contract
    metrics = serializers.SerializerMethodField()
    scheduled_meetings = serializers.SerializerMethodField()

    class Meta:
        model = Beneficiary
        fields = [
            'id', 'anonymous_id', 'region', 'age', 'status',
            'raw_intake_notes', 'ai_analysis', 'metrics', 'scheduled_meetings'
        ]

    def get_metrics(self, obj):
        # Gracefully handle matching database names to frontend keys
        return {
            'absences': obj.monthly_absences,
            'isolation_indicator_score': obj.social_isolation_index,
            'grade_delta': obj.grade_average_variance,
            'missed_appointments': obj.missed_core_tasks
        }

    def get_scheduled_meetings(self, obj):
        # Avoid crashing if there are no related appointments yet
        if hasattr(obj, 'appointments'):
            return [
                {
                    'title': appt.title,
                    'start': appt.start_time.isoformat() if appt.start_time else None,
                    'notes': appt.notes
                } for appt in obj.appointments.all()
            ]
        return []