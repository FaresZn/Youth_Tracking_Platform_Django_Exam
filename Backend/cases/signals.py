# cases/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import CaseFile
from .services import LocalLLMService

@receiver(post_save, sender=CaseFile)
def trigger_case_intelligence_analysis(sender, instance, created, **kwargs):
    """
    Automated hook: Fires the local intelligence pipeline immediately after database creation.
    """
    if created:
        # For evaluation/demonstration, running inline. 
        # In a high-throughput production system, switch to a thread loop or Celery task.
        LocalLLMService.analyze_case_vulnerability(instance.id)