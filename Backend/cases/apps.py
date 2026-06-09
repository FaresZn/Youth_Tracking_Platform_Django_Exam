# cases/apps.py
from django.apps import AppConfig

class CasesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'cases'

    def ready(self):
        import cases.signals  # Connects the signals when server mounts