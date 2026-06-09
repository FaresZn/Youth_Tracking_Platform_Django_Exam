# cases/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CaseFile
from .services import LocalLLMService

@receiver(post_save, sender=CaseFile)
def trigger_ai_analysis_on_change(sender, instance, created, **kwargs):
    # Prevent infinite loops when the service saves the model back to the DB
    if hasattr(instance, '_skip_signal'):
        return

    # Check if this signal was fired by a telemetry save
    # (e.g., if you have fields that were updated)
    instance._skip_signal = True
    LocalLLMService.analyze_case_vulnerability(instance.id)
    del instance._skip_signal